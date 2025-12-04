import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Leave a channel
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

    // Check if user is a member
    if (!channel.members.includes(session.id as any)) {
      return NextResponse.json({ error: "You are not a member of this channel" }, { status: 400 })
    }

    // Prevent leaving if user is the only member
    if (channel.members.length === 1) {
      return NextResponse.json({ error: "Cannot leave channel - you are the only member" }, { status: 400 })
    }

    // Remove user from channel
    channel.members = channel.members.filter((memberId) => memberId.toString() !== session.id)
    await channel.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leave channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
