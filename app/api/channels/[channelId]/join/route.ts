import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Join a channel
export async function POST(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { channelId } = await params

    const channel = await Channel.findById(channelId)

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Check if user is already a member
    if (channel.members.includes(session.id as any)) {
      return NextResponse.json({ error: "You are already a member of this channel" }, { status: 400 })
    }

    // Add user to channel
    channel.members.push(session.id as any)
    await channel.save()

    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "username avatar isOnline")
      .populate("createdBy", "username")

    return NextResponse.json({ channel: populatedChannel })
  } catch (error) {
    console.error("Join channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
