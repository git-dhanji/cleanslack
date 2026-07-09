"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Send, LogOut, ShieldCheck, Paperclip, Loader2, WifiOff, RotateCcw, Phone, Video, MoreVertical, Trash2, DoorOpen } from "lucide-react"
import type { ChatItem, PeerStatus, PeerActivity, CallState } from "@/hooks/use-peer"
import { LinkMark } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { PresenceLine } from "./presence-line"
import { FileBubble } from "./file-bubble"
import { EmojiPicker } from "./emoji-picker"
import { MessageText } from "./message-text"
import { CallOverlay } from "./call-overlay"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
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

export interface CallProps {
  state: CallState
  video: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micOn: boolean
  camOn: boolean
  start: (video: boolean) => void
  accept: () => void
  decline: () => void
  end: () => void
  toggleMic: () => void
  toggleCam: () => void
}

interface ChatRoomProps {
  code: string
  status: PeerStatus
  items: ChatItem[]
  peerActivity: PeerActivity
  safety: string | null
  call: CallProps
  onSend: (text: string) => void
  onSendFile: (file: File) => void
  onActivity: (state: PeerActivity) => void
  onDelete: (id: string, forEveryone: boolean) => void
  onReconnect: () => Promise<{ taken: boolean }>
  onDisconnect: () => void
  onLeaveSafely: () => void
  onDestroy: () => void
}

export function ChatRoom({
  code,
  status,
  items,
  peerActivity,
  safety,
  call,
  onSend,
  onSendFile,
  onActivity,
  onDelete,
  onReconnect,
  onDisconnect,
  onLeaveSafely,
  onDestroy,
}: ChatRoomProps) {
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activityRef = useRef<PeerActivity>("idle")
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connected = status === "connected"
  const ended = status === "disconnected" || status === "failed"

  // Broadcast our own composer activity, de-duplicated so we only send on change.
  const setActivity = (state: PeerActivity) => {
    if (activityRef.current === state) return
    activityRef.current = state
    onActivity(state)
  }

  // Called on every keystroke: "typing" now, then "present" after a short pause.
  const notifyTyping = (value: string) => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    if (value.trim()) {
      setActivity("typing")
      pauseTimerRef.current = setTimeout(() => setActivity("present"), 1200)
    } else {
      setActivity("present") // focused but nothing written
    }
  }

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setDraft((d) => d + emoji)
      return
    }
    const start = el.selectionStart ?? draft.length
    const end = el.selectionEnd ?? draft.length
    const next = draft.slice(0, start) + emoji + draft.slice(end)
    setDraft(next)
    notifyTyping(next)
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
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    setActivity("present") // still focused after sending, just not typing
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
              <div className="mt-0.5">
                <PresenceLine status={status} activity={peerActivity} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {connected && call.state === "idle" && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground"
                  aria-label="Start voice call"
                  onClick={() => call.start(false)}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground"
                  aria-label="Start video call"
                  onClick={() => call.start(true)}
                >
                  <Video className="h-5 w-5" />
                </Button>
              </>
            )}
            <ThemeToggle />
            <ExitMenu
              ended={ended}
              onSafe={onLeaveSafely}
              onDestroy={onDestroy}
              onClose={onDisconnect}
            />
          </div>
        </div>
      </header>

      <CallOverlay
        callState={call.state}
        callVideo={call.video}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        micOn={call.micOn}
        camOn={call.camOn}
        onAccept={call.accept}
        onDecline={call.decline}
        onEnd={call.end}
        onToggleMic={call.toggleMic}
        onToggleCam={call.toggleCam}
      />

      {/* Body */}
      {status === "connecting" ? (
        <ConnectingState />
      ) : ended ? (
        <EndedState status={status} onLeave={onDisconnect} onReconnect={onReconnect} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-3 px-4 py-5">
            <SafetyChip safety={safety} />

            {items.length === 0 && (
              <p className="pt-12 text-center text-sm text-muted-foreground">
                You&apos;re connected. Send a message or a file — it travels only between your two
                devices.
              </p>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                className={cn("group flex items-center gap-1", item.mine ? "justify-end" : "justify-start")}
              >
                {item.mine && <MessageActions mine onDelete={(all) => onDelete(item.id, all)} />}
                {item.kind === "file" ? (
                  <FileBubble file={item} />
                ) : (
                  <div
                    className={cn(
                      "flex max-w-[80%] flex-col rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                      item.mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-secondary text-secondary-foreground",
                    )}
                  >
                    <MessageText text={item.text} mine={item.mine} />
                    <span
                      className={cn(
                        "mt-1 self-end text-[10px] tabular-nums leading-none",
                        item.mine ? "text-primary-foreground/60" : "text-muted-foreground",
                      )}
                    >
                      {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {!item.mine && <MessageActions onDelete={(all) => onDelete(item.id, all)} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      {!ended && (
        <div className="border-t border-border/70 bg-card/40 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-end gap-2 px-2 py-2 sm:px-4 sm:py-3">
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
            <div className="flex min-w-0 flex-1 items-end gap-0.5 rounded-3xl border border-border bg-background px-1.5 py-1 shadow-sm focus-within:border-ring">
              <EmojiPicker onPick={insertEmoji} disabled={!connected} />
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  notifyTyping(e.target.value)
                }}
                onFocus={() => setActivity(draft.trim() ? "typing" : "present")}
                onBlur={() => {
                  if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
                  setActivity("idle")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={connected ? "Type a message…" : "Waiting for the connection…"}
                disabled={!connected}
                rows={1}
                className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-1.5 py-2 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
                disabled={!connected}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Send a file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full shadow-sm"
              disabled={!connected || !draft.trim()}
              onClick={send}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageActions({
  mine,
  onDelete,
}: {
  mine?: boolean
  onDelete: (forEveryone: boolean) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary focus:opacity-100 group-hover:opacity-100 max-sm:opacity-70"
          aria-label="Message options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mine ? "end" : "start"}>
        <DropdownMenuItem onClick={() => onDelete(false)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete for me
        </DropdownMenuItem>
        {mine && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete for everyone
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Two ways out of a live room:
//  • Safe exit  — leave but keep the room + code alive; either side can rejoin.
//  • Exit & destroy — wipe the chat, room, and code on BOTH devices, no resume.
function ExitMenu({
  ended,
  onSafe,
  onDestroy,
  onClose,
}: {
  ended: boolean
  onSafe: () => void
  onDestroy: () => void
  onClose: () => void
}) {
  const [confirmDestroy, setConfirmDestroy] = useState(false)

  if (ended) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>
        <LogOut className="mr-1 h-4 w-4" /> Close
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="mr-1 h-4 w-4" /> Leave
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onClick={onSafe}>
            <DoorOpen className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex flex-col">
              Safe exit
              <span className="text-xs text-muted-foreground">Keep the room — rejoin later</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmDestroy(true)
            }}
          >
            <Trash2 className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex flex-col">
              Exit &amp; destroy
              <span className="text-xs text-muted-foreground">Delete chat, room &amp; code for both</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDestroy} onOpenChange={setConfirmDestroy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the conversation on <strong>both devices</strong>, closes the room, and
              frees the connection code for reuse. It can&apos;t be undone or resumed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDestroy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Destroy everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Shows the emoji safety string once the link is verified. Tapping it explains
// what to do — compare the emoji on both devices to be sure no one is in between.
function SafetyChip({ safety }: { safety: string | null }) {
  const [open, setOpen] = useState(false)

  if (!safety) {
    return (
      <div className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        End-to-end encrypted · nothing is stored
      </div>
    )
  }

  return (
    <div className="mx-auto mb-2 flex w-fit max-w-full flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs transition-colors hover:bg-success/15"
        aria-expanded={open}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
        <span className="text-muted-foreground">Verify</span>
        <span className="text-sm tracking-[0.2em]" aria-label={`Safety emoji ${safety}`}>
          {safety}
        </span>
      </button>
      {open && (
        <p className="max-w-xs text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
          Both devices should show these same emoji. If they match, your line is private
          end-to-end — no one slipped in between. If they differ, don&apos;t trust it and leave.
        </p>
      )}
    </div>
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
