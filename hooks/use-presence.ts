"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import useSWR from "swr"

interface OnlineUser {
  _id: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  // Initial fetch
  const { data, error, mutate } = useSWR("/api/presence", fetcher, {
    refreshInterval: 60000, // Refresh every minute as backup
    revalidateOnFocus: true,
    onSuccess: (data) => {
      if (data.users) {
        setOnlineUsers(data.users)
      }
    },
  })

  // SSE for real-time presence updates
  useEffect(() => {
    const eventSource = new EventSource("/api/presence/stream")
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "user_online") {
          setOnlineUsers((prev) => {
            // Check if user already in list
            if (prev.some((u) => u._id === data.userId)) {
              return prev.map((u) => (u._id === data.userId ? { ...u, isOnline: true } : u))
            }
            // Add new user
            return [
              ...prev,
              {
                _id: data.userId,
                username: data.username,
                isOnline: true,
                lastSeen: new Date().toISOString(),
              },
            ]
          })
        } else if (data.type === "user_offline") {
          setOnlineUsers((prev) => prev.filter((u) => u._id !== data.userId))
        }
      } catch (e) {
        console.error("Failed to parse presence event:", e)
      }
    }

    eventSource.onerror = () => {
      // Will auto-reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Update presence status
  const updateStatus = useCallback(async (status: "online" | "offline") => {
    try {
      await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      console.error("Failed to update presence:", error)
    }
  }, [])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Don't immediately go offline, just reduce activity
      } else {
        updateStatus("online")
        mutate()
      }
    }

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline update
      navigator.sendBeacon("/api/presence", JSON.stringify({ status: "offline" }))
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [updateStatus, mutate])

  return {
    onlineUsers,
    isLoading: !data && !error,
    error,
    updateStatus,
    refresh: mutate,
  }
}
