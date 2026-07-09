import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Code from "@/lib/models/code"
import { generateCode } from "@/lib/code-gen"

// Code reservation — ensures two people never end up on the same connection
// code. The database stores only the code; never any chat content or identity.
// Every handler degrades gracefully: if the database is unreachable, the code
// is allowed and uniqueness falls back to the in-memory room cap (max 2 peers).

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalize(raw: string | null | undefined): string {
  return (raw || "").trim().toLowerCase()
}

function isDuplicate(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000
}

// GET ?fresh=1 → a freshly generated code that is confirmed NOT already in the
// database, so the lobby only ever shows a code no one currently holds.
// GET ?code=... → is that specific code free to use?
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams

  if (params.get("fresh")) {
    try {
      await dbConnect()
      // Try a handful of candidates; collisions are astronomically rare, so this
      // almost always succeeds on the first try.
      for (let i = 0; i < 12; i++) {
        const candidate = generateCode()
        if (!(await Code.exists({ code: candidate }))) {
          return NextResponse.json({ code: candidate, db: true })
        }
      }
      return NextResponse.json({ code: generateCode(), db: true })
    } catch {
      // DB down — still hand back a code; the atomic reservation on create guards.
      return NextResponse.json({ code: generateCode(), db: false })
    }
  }

  const code = normalize(params.get("code"))
  if (code.length < 3) return NextResponse.json({ available: false, error: "invalid" }, { status: 400 })

  try {
    await dbConnect()
    const exists = await Code.exists({ code })
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
    try {
      await dbConnect()
      await Code.deleteOne({ code })
      return NextResponse.json({ ok: true, db: true })
    } catch {
      return NextResponse.json({ ok: true, db: false })
    }
  }

  // Reserve: unique index makes this atomic — a second reserver gets a duplicate.
  try {
    await dbConnect()
    await Code.create({ code })
    return NextResponse.json({ ok: true, reserved: true, db: true })
  } catch (err) {
    if (isDuplicate(err)) {
      return NextResponse.json({ ok: false, reason: "taken" }, { status: 409 })
    }
    // Database unreachable — allow, and rely on the in-memory room cap.
    return NextResponse.json({ ok: true, reserved: false, db: false })
  }
}
