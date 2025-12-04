import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Get a specific channel
export async function GET(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { channelId } = await params

    const channel = await Channel.findById(channelId)
      .populate("members", "username avatar isOnline lastSeen")
      .populate("createdBy", "username")

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error("Get channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
