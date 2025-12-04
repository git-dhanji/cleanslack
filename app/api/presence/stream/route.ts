import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/user"

// Store for presence connections
const presenceConnections = new Set<ReadableStreamDefaultController>()

// Broadcast presence update to all connections
export function broadcastPresenceUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  presenceConnections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (e) {
      // Connection closed
    }
  })
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Mark user as online
  await dbConnect()
  await User.findByIdAndUpdate(session.id, {
    isOnline: true,
    lastSeen: new Date(),
  })

  // Broadcast that user came online
  broadcastPresenceUpdate({
    type: "user_online",
    userId: session.id,
    username: session.username,
  })

  const stream = new ReadableStream({
    start(controller) {
      presenceConnections.add(controller)

      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`))

      // Keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))
        } catch (e) {
          clearInterval(pingInterval)
        }
      }, 30000)

      // Heartbeat to update lastSeen
      const heartbeatInterval = setInterval(async () => {
        try {
          await dbConnect()
          await User.findByIdAndUpdate(session.id, {
            lastSeen: new Date(),
          })
        } catch (e) {
          // Ignore errors
        }
      }, 60000)

      // Cleanup on close
      request.signal.addEventListener("abort", async () => {
        clearInterval(pingInterval)
        clearInterval(heartbeatInterval)
        presenceConnections.delete(controller)

        // Mark user as offline
        try {
          await dbConnect()
          await User.findByIdAndUpdate(session.id, {
            isOnline: false,
            lastSeen: new Date(),
          })

          // Broadcast that user went offline
          broadcastPresenceUpdate({
            type: "user_offline",
            userId: session.id,
            username: session.username,
          })
        } catch (e) {
          console.error("Failed to update offline status:", e)
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
