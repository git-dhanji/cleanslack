// Tiny Upstash Redis REST client — no SDK, no npm dependency, runs on the Edge.
//
// Wisp uses Redis for TWO throwaway jobs only: reserving connection codes so two
// people never collide, and brokering the WebRTC handshake (SDP + ICE) between
// peers who share a code. It never holds a chat message, a file, or an identity —
// only ephemeral handshake notes and code names, all guarded by short TTLs.
//
// Why Redis over a long-lived stream: on Vercel's serverless/Hobby tier a held-
// open SSE function is expensive and capped. Short polling backed by Redis keeps
// every request tiny and instant, and Redis' native TTLs wipe stragglers on their
// own. Configure it with UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// True when the signaling/reservation backend is configured. When false, callers
// degrade gracefully instead of erroring (code checks pass, signaling reports 503).
export function hasRedis(): boolean {
  return Boolean(REST_URL && REST_TOKEN)
}

type Command = (string | number)[]

// Run several Redis commands in one round trip. Returns each command's result in
// order; a command-level error is thrown (they should never happen for our ops).
export async function pipeline(commands: Command[]): Promise<unknown[]> {
  if (!REST_URL || !REST_TOKEN) throw new Error("Upstash Redis is not configured")

  console.log("🔄 Redis pipeline executing:", {
    commandCount: commands.length,
    commands: commands.map(cmd => cmd[0])
  })

  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  })

  if (!res.ok) {
    console.error("❌ Redis pipeline failed:", res.status)
    throw new Error(`Upstash request failed: ${res.status}`)
  }

  const data = (await res.json()) as { result?: unknown; error?: string }[]
  console.log("✅ Redis pipeline completed:", {
    resultCount: data.length,
    results: data.map(d => d.result)
  })

  return data.map((entry) => {
    if (entry.error) throw new Error(entry.error)
    return entry.result
  })
}

// Run a single Redis command.
export async function redis(command: Command): Promise<unknown> {
  console.log("🔄 Redis single command:", command[0])
  const [result] = await pipeline([command])
  console.log("✅ Redis command result:", result)
  return result
}
