import type { NextRequest } from "next/server"
import type { ServerEvent, SignalPost } from "@/lib/signaling-types"

// This is the ONLY server-side state in Wisp. It exists purely to introduce
// two peers who share a code. It holds nothing about who they are, and never sees
// a single chat message or file — those go directly between the two devices.
//
// State is in-process memory (no database, nothing persisted). That means this
// works on a single long-lived Node server (`next start`) or a VPS. On a
// horizontally-scaled / serverless platform, both peers must reach the same
// instance — there you would front it with a shared pub/sub. Kept intentionally
// minimal to honour the "server knows nothing" goal.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Peer {
  id: string
  send: (event: ServerEvent) => void
}

interface Room {
  peers: Map<string, Peer>
}

// Survive dev hot-reloads by hanging state off globalThis.
const g = globalThis as unknown as { __coveRooms?: Map<string, Room> }
const rooms: Map<string, Room> = g.__coveRooms ?? new Map()
g.__coveRooms = rooms

const encoder = new TextEncoder()
const MAX_PEERS = 2

function normalizeCode(raw: string | null): string | null {
  if (!raw) return null
  const code = raw.trim().toLowerCase()
  if (code.length < 3 || code.length > 64) return null
  return code
}

// SSE stream: a peer opens this to receive handshake events for a code.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = normalizeCode(searchParams.get("code"))
  const peerId = searchParams.get("peer")?.trim()

  if (!code || !peerId) {
    return new Response("code and peer are required", { status: 400 })
  }

  const room = rooms.get(code) ?? { peers: new Map<string, Peer>() }
  if (!rooms.has(code)) rooms.set(code, room)

  // Reject a third participant — a code links exactly two devices.
  if (room.peers.size >= MAX_PEERS && !room.peers.has(peerId)) {
    return new Response(`data: ${JSON.stringify({ t: "full" } satisfies ServerEvent)}\n\n`, {
      status: 200,
      headers: sseHeaders(),
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const write = (event: ServerEvent) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          /* controller already gone */
        }
      }

      const self: Peer = { id: peerId, send: write }
      room.peers.set(peerId, self)

      // First to use the code is host; the second is guest.
      const role = room.peers.size === 1 ? "host" : "guest"
      write({ t: "ready", role })

      // Announce presence between the two peers so the host knows to make the offer.
      if (room.peers.size === 2) {
        write({ t: "peer-present" })
        for (const [id, peer] of room.peers) {
          if (id !== peerId) peer.send({ t: "peer-joined" })
        }
      }

      const ping = setInterval(() => write({ t: "ping" }), 20000)

      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(ping)
        room.peers.delete(peerId)
        for (const peer of room.peers.values()) peer.send({ t: "peer-left" })
        if (room.peers.size === 0) rooms.delete(code)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      request.signal.addEventListener("abort", cleanup)
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

// Relay a single handshake payload (SDP or ICE) to the other peer in the room.
export async function POST(request: NextRequest) {
  let body: SignalPost
  try {
    body = (await request.json()) as SignalPost
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 })
  }

  const code = normalizeCode(body.code)
  const peerId = body.peer?.trim()
  if (!code || !peerId) {
    return Response.json({ error: "code and peer are required" }, { status: 400 })
  }

  const room = rooms.get(code)
  if (!room) return Response.json({ error: "no such room" }, { status: 404 })

  let delivered = false
  for (const [id, peer] of room.peers) {
    if (id !== peerId) {
      peer.send({ t: "signal", data: body.data })
      delivered = true
    }
  }

  return Response.json({ delivered })
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  }
}
