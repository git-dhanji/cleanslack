import type { NextRequest } from "next/server"
import type { SignalPoll, SignalPost } from "@/lib/signaling-types"
import { hasRedis, pipeline, redis } from "@/lib/upstash"

// The signaling broker. Its ONLY job is to introduce two peers who share a code
// so they can exchange the WebRTC handshake (SDP + ICE); once the direct link is
// up the client stops polling and everything flows peer-to-peer. It never sees a
// chat message or a file.
//
// Coordination goes through Redis, NOT process memory. That's deliberate: on a
// serverless / multi-instance host (e.g. Vercel) the two peers can land on
// different instances, and shared memory would never let them find each other.
// Both peers meet through Redis, then it steps out — TTLs wipe everything in
// under a minute. The client SHORT-POLLS this endpoint (GET) a couple times a
// second during the handshake, so each request is tiny and returns immediately;
// nothing is held open. That fits Vercel's Hobby tier far better than SSE.

export const runtime = "edge"
export const dynamic = "force-dynamic"

const MAX_PEERS = 2
const STALE_MS = 15000 // a peer not seen within this long counts as gone
const PRESENCE_TTL_MS = 60000 // whole presence key self-destructs this long after last touch
const MAILBOX_TTL_MS = 60000 // an undrained handshake note evaporates this fast
const MAX_DATA = 100 * 1024 // reject oversized handshake payloads (SDP is a few KB)

function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const code = raw.trim().toLowerCase()
  if (code.length < 3 || code.length > 64) return null
  return code
}

// Turn HGETALL's flat [field, value, field, value, ...] into per-peer timestamps.
// Fields are `${peerId}:c` (created) and `${peerId}:s` (last seen); peer ids are
// UUIDs (no colon), so the split is unambiguous.
function parsePresence(hash: unknown): Map<string, { c: number; s: number }> {
  const map = new Map<string, { c: number; s: number }>()
  // Normalize to [field, value, ...] pairs whether Redis returned a flat array
  // (raw RESP) or an object (some client encodings).
  const pairs: [string, unknown][] = []
  if (Array.isArray(hash)) {
    for (let i = 0; i < hash.length - 1; i += 2) pairs.push([String(hash[i]), hash[i + 1]])
  } else if (hash && typeof hash === "object") {
    for (const [k, v] of Object.entries(hash as Record<string, unknown>)) pairs.push([k, v])
  }
  for (const [field, value] of pairs) {
    const sep = field.lastIndexOf(":")
    if (sep < 0) continue
    const peerId = field.slice(0, sep)
    const kind = field.slice(sep + 1)
    const entry = map.get(peerId) ?? { c: 0, s: 0 }
    if (kind === "c") entry.c = Number(value)
    else if (kind === "s") entry.s = Number(value)
    map.set(peerId, entry)
  }
  return map
}

// The active (non-stale) peers on a code, in an order BOTH peers compute
// identically — so each independently agrees on who is host (index 0) vs guest.
function activePeers(
  presence: Map<string, { c: number; s: number }>,
  now: number,
): { peerId: string; c: number }[] {
  return [...presence.entries()]
    .filter(([, e]) => e.s >= now - STALE_MS)
    .map(([peerId, e]) => ({ peerId, c: e.c }))
    .sort((a, b) => (a.c !== b.c ? a.c - b.c : a.peerId < b.peerId ? -1 : 1))
}

// GET: one poll tick. Refresh our presence, learn our role and who else is here,
// and drain any handshake notes the other peer left for us. Returns immediately.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = normalizeCode(searchParams.get("code"))
  const peerId = searchParams.get("peer")?.trim()
  if (!code || !peerId) return json({ error: "code and peer are required" }, 400)
  if (!hasRedis()) return json({ error: "signaling unavailable" }, 503)

  const now = Date.now()
  const presenceKey = `pr:${code}`

  try {
    // Heartbeat (set createdAt once, refresh lastSeen), keep the key alive, read all.
    const [, , , hash] = await pipeline([
      ["HSETNX", presenceKey, `${peerId}:c`, now],
      ["HSET", presenceKey, `${peerId}:s`, now],
      ["PEXPIRE", presenceKey, PRESENCE_TTL_MS],
      ["HGETALL", presenceKey],
    ])

    const presence = parsePresence(hash)
    const peers = activePeers(presence, now)
    const idx = peers.findIndex((p) => p.peerId === peerId)

    // A third participant is rejected — pull our own fields back out so we don't
    // linger in the set and confuse the two who got there first.
    if (idx < 0 || idx >= MAX_PEERS) {
      await redis(["HDEL", presenceKey, `${peerId}:c`, `${peerId}:s`]).catch(() => {})
      return json<SignalPoll>({ role: null, full: true, others: [], msgs: [] })
    }

    const role = idx === 0 ? "host" : "guest"
    const others = peers.filter((p) => p.peerId !== peerId).map((p) => p.peerId)

    // Drain the other peer's outbox (the notes they addressed to us). LPOP with a
    // count both reads and removes atomically, so nothing is delivered twice.
    let msgs: unknown[] = []
    if (others.length) {
      const popped = await redis(["LPOP", `mb:${code}:${others[0]}`, 100])
      if (Array.isArray(popped)) {
        for (const raw of popped) {
          try {
            msgs.push(JSON.parse(String(raw)))
          } catch {
            /* skip a malformed note */
          }
        }
      }
    }

    return json<SignalPoll>({ role, full: false, others, msgs })
  } catch {
    // Transient Redis hiccup — tell the client to retry on its next tick.
    return json({ error: "signaling error" }, 503)
  }
}

// POST: relay one handshake payload to the other peer by appending it to OUR
// outbox, which the other peer drains on its next poll. A `leave` note instead
// removes our presence immediately so the peer sees us go without waiting for TTL.
export async function POST(request: NextRequest) {
  let body: SignalPost
  try {
    body = (await request.json()) as SignalPost
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const code = normalizeCode(body.code)
  const peerId = body.peer?.trim()
  if (!code || !peerId) return json({ error: "code and peer are required" }, 400)
  if (!hasRedis()) return json({ error: "signaling unavailable" }, 503)

  if (body.leave) {
    try {
      await redis(["HDEL", `pr:${code}`, `${peerId}:c`, `${peerId}:s`])
    } catch {
      /* best effort — TTL clears it anyway */
    }
    return json({ ok: true })
  }

  if (body.data == null) return json({ error: "no data" }, 400)

  let payload: string
  try {
    payload = JSON.stringify(body.data)
  } catch {
    return json({ error: "unserializable data" }, 400)
  }
  if (payload.length > MAX_DATA) return json({ error: "payload too large" }, 413)

  try {
    await pipeline([
      ["RPUSH", `mb:${code}:${peerId}`, payload],
      ["PEXPIRE", `mb:${code}:${peerId}`, MAILBOX_TTL_MS],
    ])
    return json({ delivered: true })
  } catch {
    return json({ delivered: false }, 503)
  }
}

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}
