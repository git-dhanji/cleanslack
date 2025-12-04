import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/user"
import { getSession } from "@/lib/auth"

// Get online users
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const onlineUsers = await User.find({ isOnline: true })
      .select("username avatar isOnline lastSeen")
      .sort({ username: 1 })

    return NextResponse.json({ users: onlineUsers })
  } catch (error) {
    console.error("Get online users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update presence (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { status } = await request.json()
    const isOnline = status === "online"

    await User.findByIdAndUpdate(session.id, {
      isOnline,
      lastSeen: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update presence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
