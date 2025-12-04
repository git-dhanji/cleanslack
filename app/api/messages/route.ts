import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Message from "@/lib/models/message"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Get messages for a channel with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const cursor = searchParams.get("cursor") // Message ID for pagination
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    // Build query
    const query: any = { channel: channelId }

    if (cursor) {
      const cursorMessage = await Message.findById(cursor)
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt }
      }
    }

    const messages = await Message.find(query)
      .populate("sender", "username avatar isOnline")
      .sort({ createdAt: -1 })
      .limit(limit + 1) // Fetch one extra to check if there are more

    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages
    const nextCursor = hasMore ? messagesToReturn[messagesToReturn.length - 1]._id : null

    return NextResponse.json({
      messages: messagesToReturn.reverse(), // Return in chronological order
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Send a new message
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

    return NextResponse.json({ message: populatedMessage })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
