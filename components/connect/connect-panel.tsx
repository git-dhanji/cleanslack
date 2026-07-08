"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { usePeer } from "@/hooks/use-peer"
import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Lobby } from "./lobby"
import { WaitingPanel } from "./waiting-panel"
import { ChatRoom } from "./chat-room"

export function ConnectPanel() {
  const { status, items, code, connect, sendText, sendFile, disconnect } = usePeer()
  const searchParams = useSearchParams()
  const autoJoined = useRef(false)

  // Open an invite link (/connect?code=...) → join automatically, once.
  useEffect(() => {
    const invite = searchParams.get("code")
    if (invite && !autoJoined.current && status === "idle") {
      autoJoined.current = true
      void connect(invite, "join")
    }
  }, [searchParams, status, connect])

  // Immersive chat surface: no marketing nav, just the conversation.
  const inChat =
    status === "connecting" ||
    status === "connected" ||
    status === "disconnected" ||
    status === "failed"

  if (inChat) {
    return (
      <ChatRoom
        code={code}
        status={status}
        items={items}
        onSend={sendText}
        onSendFile={sendFile}
        onDisconnect={disconnect}
      />
    )
  }

  // Lobby / waiting: light chrome only (brand + theme), centered.
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Home
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {status === "waiting" ? (
          <WaitingPanel code={code} onCancel={disconnect} />
        ) : searchParams.get("code") ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Joining…</p>
          </div>
        ) : (
          <Lobby onConnect={connect} />
        )}
      </main>
    </div>
  )
}
