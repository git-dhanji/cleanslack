"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
}

function formatMessageDate(date: Date) {
  if (isToday(date)) {
    return format(date, "h:mm a")
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`
  }
  return format(date, "MMM d, yyyy h:mm a")
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = []

  messages.forEach((message) => {
    const date = new Date(message.createdAt)
    let dateLabel: string

    if (isToday(date)) {
      dateLabel = "Today"
    } else if (isYesterday(date)) {
      dateLabel = "Yesterday"
    } else {
      dateLabel = format(date, "EEEE, MMMM d, yyyy")
    }

    const existingGroup = groups.find((g) => g.date === dateLabel)
    if (existingGroup) {
      existingGroup.messages.push(message)
    } else {
      groups.push({ date: dateLabel, messages: [message] })
    }
  })

  return groups
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const prevMessagesLength = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }

    // If new messages were added (not loaded from pagination)
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.sender?._id === currentUserId) {
        // Always scroll when current user sends a message
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight
      }
    }

    prevMessagesLength.current = messages.length
  }, [messages, shouldAutoScroll, currentUserId])

  // Detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShouldAutoScroll(isNearBottom)
  }, [])

  const messageGroups = groupMessagesByDate(messages)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-3xl">👋</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No messages yet</h3>
        <p className="text-muted-foreground text-sm">Be the first to send a message in this channel!</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-muted-foreground hover:text-foreground"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load older messages"
            )}
          </Button>
        </div>
      )}

      {messageGroups.map((group) => (
        <div key={group.date}>
          {/* Date Separator */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground px-2">{group.date}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {group.messages.map((message, index) => {
              const isCurrentUser = message.sender._id === currentUserId
              const showAvatar = index === 0 || group.messages[index - 1]?.sender._id !== message.sender._id

              return (
                <div key={message._id} className={cn("flex gap-3 group", !showAvatar && "pl-11")}>
                  {showAvatar && (
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center",
                          isCurrentUser ? "bg-primary/30" : "bg-accent",
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {message.sender.username[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {message.sender.username}
                          {isCurrentUser && <span className="text-muted-foreground font-normal ml-1">(you)</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageDate(new Date(message.createdAt))}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
