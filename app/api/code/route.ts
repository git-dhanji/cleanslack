import { type NextRequest, NextResponse } from "next/server"
import { hasRedis, redis } from "@/lib/upstash"
import { generateCode } from "@/lib/code-gen"

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
  let body: { code?: string; action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const code = normalize(body.code)
  if (code.length < 3) return NextResponse.json({ error: "invalid code" }, { status: 400 })

  if (body.action === "release") {
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
