import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

// Store for active connections by channel
const channelConnections = new Map<string, Set<ReadableStreamDefaultController>>()

// Broadcast message to all connections in a channel
export function broadcastToChannel(channelId: string, data: any) {
  const connections = channelConnections.get(channelId)
  if (connections) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    connections.forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(message))
      } catch (e) {
        // Connection closed, will be cleaned up
      }
    })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get("channelId")

  if (!channelId) {
    return new Response("Channel ID required", { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add connection to channel
      if (!channelConnections.has(channelId)) {
        channelConnections.set(channelId, new Set())
      }
      channelConnections.get(channelId)!.add(controller)

      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`))

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))
        } catch (e) {
          clearInterval(pingInterval)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval)
        channelConnections.get(channelId)?.delete(controller)
        if (channelConnections.get(channelId)?.size === 0) {
          channelConnections.delete(channelId)
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
