import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Get all available public channels
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    // Get public channels where user is NOT a member
    const channels = await Channel.find({
      isPrivate: false,
      members: { $ne: session.id },
    })
      .populate("createdBy", "username")
      .select("name description members createdBy createdAt")
      .sort({ createdAt: -1 })

    // Add member count
    const channelsWithCount = channels.map((channel) => ({
      ...channel.toObject(),
      memberCount: channel.members.length,
    }))

    return NextResponse.json({ channels: channelsWithCount })
  } catch (error) {
    console.error("Get available channels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
