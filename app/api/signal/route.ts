import type { NextRequest } from "next/server"
import type { ServerEvent, SignalPost, SignalRole } from "@/lib/signaling-types"
import dbConnect from "@/lib/mongodb"
import Signal from "@/lib/models/signal"
import Presence from "@/lib/models/presence"

// The signaling broker. Its ONLY job is to introduce two peers who share a code
// so they can exchange the WebRTC handshake (SDP + ICE); once the direct link is
// up, the client closes this stream and everything flows peer-to-peer. It never
// sees a chat message or a file.
//
// Coordination goes through MongoDB (a tiny presence set + an ephemeral mailbox),
// NOT process memory. That's deliberate: on a serverless / multi-instance host
// (e.g. Vercel) the two peers can land on different instances, and shared memory
// would never let them find each other. Both peers meet through the database,
// then it steps out. Nothing here is persisted — TTL indexes wipe it in seconds.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Stream for up to 5 minutes, then the browser's EventSource silently reconnects
// (presence + role are recomputed identically, so the session survives).
export const maxDuration = 300

const encoder = new TextEncoder()
const MAX_PEERS = 2
const POLL_MS = 1000 // how often we check presence + drain the mailbox
const STALE_MS = 15000 // a peer not seen within this long counts as gone
const HEARTBEAT_MS = 5000 // refresh our own lastSeen at most this often
const PING_MS = 15000 // SSE keepalive comment cadence
const MAX_DATA = 100 * 1024 // reject oversized handshake payloads (SDP is a few KB)

function normalizeCode(raw: string | null): string | null {
  if (!raw) return null
  const code = raw.trim().toLowerCase()
  if (code.length < 3 || code.length > 64) return null
  return code
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  }
}

// The active (non-stale) peers on a code, in an order BOTH peers compute
// identically — so each independently agrees on who is host (index 0) vs guest.
async function activePeers(code: string): Promise<{ peerId: string; createdAt: Date }[]> {
  const since = new Date(Date.now() - STALE_MS)
  const docs = await Presence.find({ code, lastSeen: { $gte: since } })
    .select("peerId createdAt")
    .lean<{ peerId: string; createdAt: Date }[]>()
  return docs.sort((a, b) => {
    const t = +new Date(a.createdAt) - +new Date(b.createdAt)
    return t !== 0 ? t : a.peerId < b.peerId ? -1 : 1
  })
}

// SSE stream: a peer opens this to receive handshake events for a code.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = normalizeCode(searchParams.get("code"))
  const peerId = searchParams.get("peer")?.trim()
  if (!code || !peerId) return new Response("code and peer are required", { status: 400 })

  try {
    await dbConnect()
  } catch {
    // Without the database the two peers can't be introduced across instances.
    return new Response("signaling unavailable", { status: 503 })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      let lastBeat = 0
      let lastPing = 0

      const write = (event: ServerEvent) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          closed = true
        }
      }

      const shutdown = async () => {
        if (closed) return
        closed = true
        try {
          await Presence.deleteOne({ code, peerId })
        } catch {
          /* best effort — TTL will clear it anyway */
        }
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      request.signal.addEventListener("abort", () => void shutdown())

      // Join the presence set.
      try {
        await Presence.updateOne(
          { code, peerId },
          { $set: { lastSeen: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true },
        )
      } catch {
        await shutdown()
        return
      }

      // Assign a role from the agreed ordering. A third participant is rejected.
      const peers = await activePeers(code)
      const idx = peers.findIndex((p) => p.peerId === peerId)
      if (idx >= MAX_PEERS) {
        write({ t: "full" })
        try {
          await Presence.deleteOne({ code, peerId })
        } catch {
          /* noop */
        }
        await shutdown()
        return
      }
      const role: SignalRole = idx === 0 ? "host" : "guest"
      write({ t: "ready", role })

      // Track which other peers we've already told the client about, so we emit
      // peer-joined / peer-left exactly on change. The host is the one that makes
      // the offer, so it announces arrivals as "peer-joined"; the guest (which
      // always finds the host already present) announces "peer-present".
      const known = new Set<string>()
      const reconcile = (others: Set<string>) => {
        for (const id of others) {
          if (!known.has(id)) write(role === "host" ? { t: "peer-joined" } : { t: "peer-present" })
        }
        for (const id of known) {
          if (!others.has(id)) write({ t: "peer-left" })
        }
        known.clear()
        for (const id of others) known.add(id)
      }
      const othersOf = (list: { peerId: string }[]) =>
        new Set(list.filter((p) => p.peerId !== peerId).map((p) => p.peerId))
      reconcile(othersOf(peers))

      // Poll loop: heartbeat our presence, reconcile the other peer, drain the
      // mailbox of any handshake notes addressed to us, and keep the SSE alive.
      while (!closed) {
        await new Promise((r) => setTimeout(r, POLL_MS))
        if (closed) break

        const now = Date.now()
        if (now - lastBeat >= HEARTBEAT_MS) {
          lastBeat = now
          try {
            await Presence.updateOne({ code, peerId }, { $set: { lastSeen: new Date() } })
          } catch {
            /* transient — try again next tick */
          }
        }

        try {
          reconcile(othersOf(await activePeers(code)))

          const msgs = await Signal.find({ code, from: { $ne: peerId } })
            .sort({ createdAt: 1 })
            .lean<{ _id: unknown; data: unknown }[]>()
          if (msgs.length) {
            for (const m of msgs) write({ t: "signal", data: m.data })
            await Signal.deleteMany({ _id: { $in: msgs.map((m) => m._id) } })
          }
        } catch {
          /* transient DB hiccup — keep the stream open and retry next tick */
        }

        if (now - lastPing >= PING_MS) {
          lastPing = now
          write({ t: "ping" })
        }
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

// Relay a single handshake payload (SDP or ICE) to the other peer via the
// shared mailbox. The other peer's open stream drains and deletes it.
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
  if (body.data == null) {
    return Response.json({ error: "no data" }, { status: 400 })
  }

  let size = 0
  try {
    size = JSON.stringify(body.data).length
  } catch {
    return Response.json({ error: "unserializable data" }, { status: 400 })
  }
  if (size > MAX_DATA) {
    return Response.json({ error: "payload too large" }, { status: 413 })
  }

  try {
    await dbConnect()
    await Signal.create({ code, from: peerId, data: body.data })
    return Response.json({ delivered: true })
  } catch {
    return Response.json({ delivered: false }, { status: 503 })
  }
}
