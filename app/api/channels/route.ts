import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Channel from "@/lib/models/channel"
import { getSession } from "@/lib/auth"

// Get all channels for the current user
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    // Get channels where user is a member
    const channels = await Channel.find({
      members: session.id,
    })
      .populate("members", "username avatar isOnline")
      .populate("createdBy", "username")
      .sort({ createdAt: 1 })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error("Get channels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new channel
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await dbConnect()

    const { name, description, isPrivate } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Channel name must be at least 2 characters" }, { status: 400 })
    }

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({
      name: name.toLowerCase().replace(/\s+/g, "-"),
    })

    if (existingChannel) {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 400 })
    }

    const channel = await Channel.create({
      name: name.toLowerCase().replace(/\s+/g, "-"),
      description,
      isPrivate: isPrivate || false,
      createdBy: session.id,
      members: [session.id],
    })

    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "username avatar isOnline")
      .populate("createdBy", "username")

    return NextResponse.json({ channel: populatedChannel })
  } catch (error: any) {
    console.error("Create channel error:", error)

    if (error.code === 11000) {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
