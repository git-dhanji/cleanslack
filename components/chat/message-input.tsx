"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  channelName: string
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
}

export function MessageInput({ channelName, onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending || disabled) return

    setIsSending(true)
    try {
      await onSendMessage(trimmedMessage)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            disabled={disabled || isSending}
            rows={1}
            className="min-h-[44px] max-h-[200px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground pr-12"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isSending || disabled}
          size="icon"
          className="h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Enter</kbd> to send,{" "}
        <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Shift + Enter</kbd> for new line
      </p>
    </div>
  )
}
