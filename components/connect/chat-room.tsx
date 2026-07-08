"use client"

import { useEffect, useRef, useState } from "react"
import { Send, LogOut, ShieldCheck } from "lucide-react"
import type { ChatMessage, PeerStatus } from "@/hooks/use-peer"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatRoomProps {
  code: string
  status: PeerStatus
  messages: ChatMessage[]
  onSend: (text: string) => void
  onDisconnect: () => void
}

export function ChatRoom({ code, status, messages, onSend, onDisconnect }: ChatRoomProps) {
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const connected = status === "connected"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const send = () => {
    if (!draft.trim()) return
    onSend(draft)
    setDraft("")
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium">{code}</span>
          </div>
          <StatusBadge status={status} />
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDisconnect}>
          <LogOut className="mr-1 h-4 w-4" /> Leave
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Messages are end-to-end encrypted and never stored
        </div>

        {messages.length === 0 && connected && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            You are connected. Say hello — this conversation lives only on your two devices.
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                m.mine
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-secondary text-secondary-foreground",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <span
                className={cn(
                  "mt-1 block text-[10px]",
                  m.mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={connected ? "Type a message…" : "Waiting for the connection…"}
            disabled={!connected}
            rows={1}
            className="max-h-32 min-h-[2.75rem] resize-none"
          />
          <Button size="icon" className="h-11 w-11 shrink-0" disabled={!connected || !draft.trim()} onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
