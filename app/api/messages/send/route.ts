import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Message from "@/lib/models/message"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"
import { broadcastToChannel } from "../stream/route"

// Send a new message with real-time broadcast
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { content, channelId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    // Verify user is a member of the channel
    const channel = await Channel.findById(channelId)

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    if (!channel.members.includes(session.id as any)) {
      return NextResponse.json({ error: "You are not a member of this channel" }, { status: 403 })
    }

    const message = await Message.create({
      content: content.trim(),
      sender: session.id,
      channel: channelId,
    })

    const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar isOnline")

    // Broadcast message to all connections in the channel
    broadcastToChannel(channelId, {
      type: "new_message",
      message: populatedMessage,
    })

    return NextResponse.json({ message: populatedMessage })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
