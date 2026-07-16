import { type NextRequest, NextResponse } from "next/server"
import { hasRedis, redis } from "@/lib/upstash"
import { generateCode } from "@/lib/code-gen"
import { codeRateLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limit"

// Code reservation — ensures two people never end up on the same connection
// code. Redis stores only the code name (as a key) with a TTL; never any chat
// content or identity. Every handler degrades gracefully: if Redis isn't
// configured, the code is allowed and uniqueness falls back to the signaling
// room cap (max 2 peers per code).

export const runtime = "edge"
export const dynamic = "force-dynamic"

// A reservation lives 2 days, so a code a user made stays resumable/rejoinable
// within that window, then cleans itself up even if never released explicitly.
// An "exit & destroy" deletes it immediately (see the release branch below).
const CODE_TTL_SECONDS = 60 * 60 * 24 * 2
const key = (code: string) => `code:${code}`

function normalize(raw: string | null | undefined): string {
  return (raw || "").trim().toLowerCase()
}

// GET ?fresh=1 → a freshly generated code confirmed NOT already reserved, so the
// lobby only ever shows a code no one currently holds.
// GET ?code=... → is that specific code free to use?
export async function GET(request: NextRequest) {
  // Rate limiting: prevent code enumeration attacks
  const identifier = getClientIdentifier(request)
  const rateLimitCheck = await checkRateLimit(codeRateLimiter, identifier)
  if (!rateLimitCheck.success) {
    return rateLimitCheck.response!
  }

  const params = new URL(request.url).searchParams

  if (params.get("fresh")) {
    if (!hasRedis()) return NextResponse.json({ code: generateCode(), db: false })
    try {
      // Collisions are astronomically rare, so this almost always succeeds first try.
      for (let i = 0; i < 12; i++) {
        const candidate = generateCode()
        if (!(await redis(["EXISTS", key(candidate)]))) {
          return NextResponse.json({ code: candidate, db: true })
        }
      }
      return NextResponse.json({ code: generateCode(), db: true })
    } catch {
      return NextResponse.json({ code: generateCode(), db: false })
    }
  }

  const code = normalize(params.get("code"))
  if (code.length < 3) return NextResponse.json({ available: false, error: "invalid" }, { status: 400 })
  if (!hasRedis()) return NextResponse.json({ available: true, db: false })

  try {
    const exists = await redis(["EXISTS", key(code)])
    return NextResponse.json({ available: !exists, db: true })
  } catch {
    return NextResponse.json({ available: true, db: false })
  }
}

// Reserve (default) or release a code.
export async function POST(request: NextRequest) {
  // Rate limiting: prevent code reservation spam
  const identifier = getClientIdentifier(request)
  const rateLimitCheck = await checkRateLimit(codeRateLimiter, identifier)
  if (!rateLimitCheck.success) {
    return rateLimitCheck.response!
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  // Strict input validation
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 })
  }

  const payload = body as Record<string, unknown>

  // Validate only expected fields exist
  const allowedFields = ["code", "action"]
  const receivedFields = Object.keys(payload)
  const unexpectedFields = receivedFields.filter(f => !allowedFields.includes(f))
  if (unexpectedFields.length > 0) {
    return NextResponse.json({ error: "unexpected fields" }, { status: 400 })
  }

  // Validate code field
  if (!("code" in payload) || typeof payload.code !== "string") {
    return NextResponse.json({ error: "code must be a string" }, { status: 400 })
  }

  const code = normalize(payload.code)

  // Validate code format: must match expected pattern (adjective-noun-number)
  // or at least contain only alphanumeric and hyphens
  if (code.length < 3 || code.length > 64) {
    return NextResponse.json({ error: "code length must be 3-64 characters" }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(code)) {
    return NextResponse.json({ error: "code contains invalid characters" }, { status: 400 })
  }

  // Validate action field if present
  if ("action" in payload) {
    if (typeof payload.action !== "string") {
      return NextResponse.json({ error: "action must be a string" }, { status: 400 })
    }
    if (payload.action !== "release" && payload.action !== "reserve") {
      return NextResponse.json({ error: "action must be 'reserve' or 'release'" }, { status: 400 })
    }
  }

  if (payload.action === "release") {
    if (!hasRedis()) return NextResponse.json({ ok: true, db: false })
    try {
      await redis(["DEL", key(code)])
      return NextResponse.json({ ok: true, db: true })
    } catch {
      return NextResponse.json({ ok: true, db: false })
    }
  }

  // Reserve: SET NX is atomic — a second reserver gets null and is told "taken".
  if (!hasRedis()) return NextResponse.json({ ok: true, reserved: false, db: false })
  try {
    const set = await redis(["SET", key(code), "1", "NX", "EX", CODE_TTL_SECONDS])
    if (set === null) return NextResponse.json({ ok: false, reason: "taken" }, { status: 409 })
    return NextResponse.json({ ok: true, reserved: true, db: true })
  } catch {
    // Redis unreachable — allow, and rely on the signaling room cap.
    return NextResponse.json({ ok: true, reserved: false, db: false })
  }
}
