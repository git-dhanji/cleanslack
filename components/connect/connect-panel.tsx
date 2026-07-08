"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { usePeer } from "@/hooks/use-peer"
import { Lobby } from "./lobby"
import { WaitingPanel } from "./waiting-panel"
import { ChatRoom } from "./chat-room"

export function ConnectPanel() {
  const { status, messages, code, connect, sendText, disconnect } = usePeer()
  const searchParams = useSearchParams()
  const autoJoined = useRef(false)

  // Open an invite link (/connect?code=...) → join automatically, once.
  useEffect(() => {
    const invite = searchParams.get("code")
    if (invite && !autoJoined.current && status === "idle") {
      autoJoined.current = true
      connect(invite)
    }
  }, [searchParams, status, connect])

  // A code already in use by two people can't be joined.
  useEffect(() => {
    if (status === "full") {
      toast.error("That code is already in use by two people. Try another.")
      disconnect()
    }
  }, [status, disconnect])

  if (status === "idle") {
    return <Lobby onConnect={connect} />
  }

  if (status === "waiting") {
    return <WaitingPanel code={code} onCancel={disconnect} />
  }

  return (
    <ChatRoom
      code={code}
      status={status}
      messages={messages}
      onSend={sendText}
      onDisconnect={disconnect}
    />
  )
}
