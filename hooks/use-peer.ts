"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PeerConnection, type PeerStatus } from "@/lib/webrtc"

export type { PeerStatus }

export interface ChatMessage {
  id: string
  kind: "text"
  text: string
  mine: boolean
  ts: number
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function usePeer() {
  const peerRef = useRef<PeerConnection | null>(null)
  const [status, setStatus] = useState<PeerStatus>("idle")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [code, setCode] = useState("")

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [...prev, m])
  }, [])

  const connect = useCallback(
    (rawCode: string) => {
      const normalized = rawCode.trim().toLowerCase()
      if (!normalized) return

      peerRef.current?.close()
      setMessages([])
      setCode(normalized)

      const peer = new PeerConnection({
        onStatus: setStatus,
        onControl: (msg) => {
          if (msg.k === "msg" && typeof msg.text === "string") {
            addMessage({
              id: newId(),
              kind: "text",
              text: msg.text,
              mine: false,
              ts: typeof msg.ts === "number" ? msg.ts : Date.now(),
            })
          }
        },
      })
      peerRef.current = peer
      peer.connect(normalized)
    },
    [addMessage],
  )

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      const peer = peerRef.current
      if (!trimmed || !peer?.isOpen()) return
      peer.sendText(trimmed)
      addMessage({ id: newId(), kind: "text", text: trimmed, mine: true, ts: Date.now() })
    },
    [addMessage],
  )

  const disconnect = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    setStatus("idle")
    setCode("")
    setMessages([])
  }, [])

  useEffect(() => {
    return () => {
      peerRef.current?.close()
      peerRef.current = null
    }
  }, [])

  return { status, messages, code, connect, sendText, disconnect, peerRef }
}
