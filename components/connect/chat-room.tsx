"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Send, LogOut, ShieldCheck, Paperclip, Loader2, WifiOff, RotateCcw } from "lucide-react"
import type { ChatItem, PeerStatus } from "@/hooks/use-peer"
import { LinkMark } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatusBadge } from "./status-badge"
import { FileBubble } from "./file-bubble"
import { EmojiPicker } from "./emoji-picker"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ChatRoomProps {
  code: string
  status: PeerStatus
  items: ChatItem[]
  onSend: (text: string) => void
  onSendFile: (file: File) => void
  onReconnect: () => Promise<{ taken: boolean }>
  onDisconnect: () => void
}

export function ChatRoom({
  code,
  status,
  items,
  onSend,
  onSendFile,
  onReconnect,
  onDisconnect,
}: ChatRoomProps) {
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const connected = status === "connected"
  const ended = status === "disconnected" || status === "failed"

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setDraft((d) => d + emoji)
      return
    }
    const start = el.selectionStart ?? draft.length
    const end = el.selectionEnd ?? draft.length
    setDraft(draft.slice(0, start) + emoji + draft.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [items])

  const send = () => {
    if (!draft.trim()) return
    onSend(draft)
    setDraft("")
  }

  const pickFiles = (fileList: FileList | null) => {
    if (!fileList) return
    for (const file of Array.from(fileList)) onSendFile(file)
    if (fileList.length) toast.success(fileList.length > 1 ? `Sending ${fileList.length} files` : "Sending file")
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* App header */}
      <header className="border-b border-border/70 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <LinkMark className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-mono text-sm font-medium leading-none">{code}</div>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LeaveButton onConfirm={onDisconnect} ended={ended} />
          </div>
        </div>
      </header>

      {/* Body */}
      {status === "connecting" ? (
        <ConnectingState />
      ) : ended ? (
        <EndedState status={status} onLeave={onDisconnect} onReconnect={onReconnect} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-3 px-4 py-5">
            <div className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              End-to-end encrypted · nothing is stored
            </div>

            {items.length === 0 && (
              <p className="pt-12 text-center text-sm text-muted-foreground">
                You&apos;re connected. Send a message or a file — it travels only between your two
                devices.
              </p>
            )}

            {items.map((item) => (
              <div key={item.id} className={cn("flex", item.mine ? "justify-end" : "justify-start")}>
                {item.kind === "file" ? (
                  <FileBubble file={item} />
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                      item.mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{item.text}</p>
                    <span
                      className={cn(
                        "mt-1 block text-[10px]",
                        item.mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      {!ended && (
        <div className="border-t border-border/70 bg-card/40 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                pickFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <EmojiPicker onPick={insertEmoji} disabled={!connected} />
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0"
              disabled={!connected}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Send a file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
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
              className="max-h-32 min-h-11 resize-none"
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={!connected || !draft.trim()}
              onClick={send}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LeaveButton({ onConfirm, ended }: { onConfirm: () => void; ended: boolean }) {
  if (ended) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onConfirm}>
        <LogOut className="mr-1 h-4 w-4" /> Close
      </Button>
    )
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <LogOut className="mr-1 h-4 w-4" /> Leave
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this connection?</AlertDialogTitle>
          <AlertDialogDescription>
            The conversation isn&apos;t stored anywhere, so it will be gone for good.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ConnectingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </span>
      <div>
        <p className="font-medium">Establishing a direct link…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Setting up an end-to-end encrypted channel between your two devices.
        </p>
      </div>
    </div>
  )
}

function EndedState({
  status,
  onLeave,
  onReconnect,
}: {
  status: PeerStatus
  onLeave: () => void
  onReconnect: () => Promise<{ taken: boolean }>
}) {
  const failed = status === "failed"
  const [busy, setBusy] = useState(false)

  const retry = async () => {
    setBusy(true)
    try {
      await onReconnect()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium">{failed ? "Couldn't establish a link" : "The connection ended"}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {failed
            ? "A direct path between the two devices could not be found. Some strict networks need a TURN relay."
            : "The other person left, or the link dropped. Nothing was saved."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
          Reconnect
        </Button>
        <Button variant="outline" onClick={onLeave} disabled={busy}>
          Back to start
        </Button>
      </div>
    </div>
  )
}
