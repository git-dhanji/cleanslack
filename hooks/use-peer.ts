"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PeerConnection, type PeerStatus } from "@/lib/webrtc"
import { reserveCode, releaseCode } from "@/lib/codes"

export type ConnectMode = "create" | "join"

export type { PeerStatus }

export interface TextMessage {
  id: string
  kind: "text"
  text: string
  mine: boolean
  ts: number
}

export interface FileMessage {
  id: string
  kind: "file"
  name: string
  size: number
  mime: string
  mine: boolean
  ts: number
  progress: number // 0..1
  status: "transferring" | "complete" | "error"
  url?: string // object URL once complete (download link)
}

export type ChatItem = TextMessage | FileMessage

interface IncomingFile {
  id: string
  size: number
  mime: string
  received: number
  chunks: ArrayBuffer[]
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// Remember the last successful connection so a returning user can rejoin without
// retyping the code. Only the code + role are kept, locally, for 24h.
const LAST_KEY = "cove:last"
const LAST_TTL = 24 * 60 * 60 * 1000

export interface LastSession {
  code: string
  mode: ConnectMode
}

function readLast(): LastSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(LAST_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p?.code || !p?.ts || Date.now() - p.ts > LAST_TTL) return null
    return { code: String(p.code), mode: p.mode === "create" ? "create" : "join" }
  } catch {
    return null
  }
}

function writeLast(s: LastSession) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify({ ...s, ts: Date.now() }))
  } catch {
    /* ignore */
  }
}

function clearLast() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(LAST_KEY)
  } catch {
    /* ignore */
  }
}

export function usePeer() {
  const peerRef = useRef<PeerConnection | null>(null)
  const incomingRef = useRef<IncomingFile | null>(null)
  const reservedRef = useRef<string | null>(null) // code we reserved (release on exit)
  const [status, setStatus] = useState<PeerStatus>("idle")
  const [items, setItems] = useState<ChatItem[]>([])
  const [code, setCode] = useState("")
  const [lastSession, setLastSession] = useState<LastSession | null>(null)

  // Load the remembered session (if any) once on mount.
  useEffect(() => {
    setLastSession(readLast())
  }, [])

  const addItem = useCallback((item: ChatItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<FileMessage>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id && it.kind === "file" ? { ...it, ...patch } : it)),
    )
  }, [])

  const handleControl = useCallback(
    (msg: Record<string, unknown>) => {
      switch (msg.k) {
        case "msg":
          if (typeof msg.text === "string") {
            addItem({
              id: newId(),
              kind: "text",
              text: msg.text,
              mine: false,
              ts: typeof msg.ts === "number" ? msg.ts : Date.now(),
            })
          }
          break
        case "file-start":
          if (typeof msg.id === "string" && typeof msg.size === "number") {
            incomingRef.current = {
              id: msg.id,
              size: msg.size,
              mime: typeof msg.mime === "string" ? msg.mime : "application/octet-stream",
              received: 0,
              chunks: [],
            }
            addItem({
              id: msg.id,
              kind: "file",
              name: typeof msg.name === "string" ? msg.name : "file",
              size: msg.size,
              mime: incomingRef.current.mime,
              mine: false,
              ts: Date.now(),
              progress: 0,
              status: "transferring",
            })
          }
          break
        case "file-end":
          if (typeof msg.id === "string" && incomingRef.current?.id === msg.id) {
            const inc = incomingRef.current
            const blob = new Blob(inc.chunks, { type: inc.mime })
            const url = URL.createObjectURL(blob)
            patchItem(inc.id, { progress: 1, status: "complete", url })
            incomingRef.current = null
          }
          break
      }
    },
    [addItem, patchItem],
  )

  const handleBinary = useCallback(
    (chunk: ArrayBuffer) => {
      const inc = incomingRef.current
      if (!inc) return
      inc.chunks.push(chunk)
      inc.received += chunk.byteLength
      const progress = inc.size > 0 ? Math.min(inc.received / inc.size, 1) : 1
      patchItem(inc.id, { progress })
    },
    [patchItem],
  )

  const openPeer = useCallback(
    (normalized: string) => {
      peerRef.current?.close()
      incomingRef.current = null
      setItems([])
      setCode(normalized)

      const peer = new PeerConnection({
        onStatus: setStatus,
        onControl: handleControl,
        onBinary: handleBinary,
      })
      peerRef.current = peer
      peer.connect(normalized)
    },
    [handleControl, handleBinary],
  )

  // Connect to a code. In "create" mode we first reserve the code so two hosts
  // can never collide; returns { taken: true } if someone already holds it.
  const connect = useCallback(
    async (rawCode: string, mode: ConnectMode = "join"): Promise<{ taken: boolean }> => {
      const normalized = rawCode.trim().toLowerCase()
      if (normalized.length < 3) return { taken: false }

      if (mode === "create") {
        const result = await reserveCode(normalized)
        if (result.taken) return { taken: true }
        reservedRef.current = normalized
      }

      const session: LastSession = { code: normalized, mode }
      writeLast(session)
      setLastSession(session)

      openPeer(normalized)
      return { taken: false }
    },
    [openPeer],
  )

  // Rejoin the last connection. Falls back to joining if a re-reserve collides.
  const reconnect = useCallback(async (): Promise<{ taken: boolean }> => {
    const last = readLast()
    if (!last) return { taken: false }
    const result = await connect(last.code, last.mode)
    if (result.taken) return connect(last.code, "join")
    return result
  }, [connect])

  const forgetLastSession = useCallback(() => {
    clearLast()
    setLastSession(null)
  }, [])

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      const peer = peerRef.current
      if (!trimmed || !peer?.isOpen()) return
      peer.sendText(trimmed)
      addItem({ id: newId(), kind: "text", text: trimmed, mine: true, ts: Date.now() })
    },
    [addItem],
  )

  const sendFile = useCallback(
    async (file: File) => {
      const peer = peerRef.current
      if (!peer?.isOpen()) return
      const id = newId()
      addItem({
        id,
        kind: "file",
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        mine: true,
        ts: Date.now(),
        progress: 0,
        status: "transferring",
      })
      try {
        await peer.sendFile(file, id, (sent, total) => {
          patchItem(id, { progress: total > 0 ? sent / total : 1 })
        })
        patchItem(id, { progress: 1, status: "complete" })
      } catch {
        patchItem(id, { status: "error" })
      }
    },
    [addItem, patchItem],
  )

  const disconnect = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    incomingRef.current = null
    if (reservedRef.current) {
      releaseCode(reservedRef.current)
      reservedRef.current = null
    }
    setStatus("idle")
    setCode("")
    setItems([])
  }, [])

  // Release any reserved code and tear down on unmount or tab close.
  useEffect(() => {
    const release = () => {
      if (reservedRef.current) releaseCode(reservedRef.current)
    }
    window.addEventListener("beforeunload", release)
    return () => {
      window.removeEventListener("beforeunload", release)
      release()
      peerRef.current?.close()
      peerRef.current = null
    }
  }, [])

  return {
    status,
    items,
    code,
    lastSession,
    connect,
    reconnect,
    forgetLastSession,
    sendText,
    sendFile,
    disconnect,
  }
}
