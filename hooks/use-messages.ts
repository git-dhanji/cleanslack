"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import useSWR from "swr"

interface Sender {
  _id: string
  username: string
  avatar?: string
  isOnline: boolean
}

interface Message {
  _id: string
  content: string
  sender: Sender
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Initial fetch
  const { data, error, isLoading, mutate } = useSWR(
    channelId ? `/api/messages?channelId=${channelId}&limit=50` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setMessages(data.messages || [])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      },
    },
  )

  // SSE for real-time updates
  useEffect(() => {
    if (!channelId) return

    // Clean up previous connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/messages/stream?channelId=${channelId}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "new_message") {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m._id === data.message._id)) {
              return prev
            }
            return [...prev, data.message]
          })
        }
      } catch (e) {
        console.error("Failed to parse SSE message:", e)
      }
    }

    eventSource.onerror = () => {
      // Reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          eventSource.close()
          // Trigger re-connection by updating state
        }
      }, 5000)
    }

    return () => {
      eventSource.close()
    }
  }, [channelId])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!channelId || !cursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}&cursor=${cursor}&limit=50`)
      const data = await res.json()

      if (res.ok) {
        setMessages((prev) => [...data.messages, ...prev])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error("Failed to load more messages:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [channelId, cursor, isLoadingMore])

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!channelId) return

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send message")
      }

      // Message will be added via SSE
    },
    [channelId],
  )

  // Reset when channel changes
  useEffect(() => {
    setMessages([])
    setCursor(null)
    setHasMore(false)
  }, [channelId])

  return {
    messages,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    sendMessage,
    refresh: mutate,
  }
}
