"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { PeerConnection, type PeerStatus, type CallState } from "@/lib/webrtc"
import { reserveCode, releaseCode } from "@/lib/codes"
import { generateSecret, splitFullCode } from "@/lib/code-gen"

export type { CallState }

export type ConnectMode = "create" | "join"

// typing = actively producing text; present = focused on the box but paused;
// idle = not composing at all.
export type PeerActivity = "typing" | "present" | "idle"

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

// Remember the last connection so a returning user can rejoin without retyping
// the code. Only the code + role are kept, locally, for 2 days — the same window
// the server keeps the code reservation alive, so "safe exit" stays resumable.
const LAST_KEY = "wisp:last"
const LAST_TTL = 2 * 24 * 60 * 60 * 1000

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
  const reservedRef = useRef<string | null>(null) // code we reserved (release on destroy)
  const codeRef = useRef("") // current code, readable from stable callbacks
  const sendChainRef = useRef<Promise<void>>(Promise.resolve()) // serialize outgoing files
  const [status, setStatus] = useState<PeerStatus>("idle")
  const [items, setItems] = useState<ChatItem[]>([])
  const [code, setCode] = useState("")
  const [lastSession, setLastSession] = useState<LastSession | null>(null)
  const [peerActivity, setPeerActivity] = useState<PeerActivity>("idle")
  const [safety, setSafety] = useState<string | null>(null)

  // Voice/video call state.
  const [callState, setCallState] = useState<CallState>("idle")
  const [callVideo, setCallVideo] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const resetCall = useCallback(() => {
    setCallState("idle")
    setCallVideo(false)
    setLocalStream(null)
    setRemoteStream(null)
    setMicOn(true)
    setCamOn(true)
  }, [])

  // Tell the peer what we're doing in the composer (typing / paused / idle).
  const sendActivity = useCallback((state: PeerActivity) => {
    peerRef.current?.sendControl({ k: "activity", state })
  }, [])

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

  // Full teardown back to the lobby with NO resume: clears chat, forgets the
  // last session, and drops the reservation reference. Used by "exit & destroy"
  // (locally and when the peer destroys). Does not itself delete the DB code —
  // the caller does that so the exact code is known.
  const wipeEverything = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    incomingRef.current = null
    reservedRef.current = null
    codeRef.current = ""
    clearLast()
    setLastSession(null)
    setStatus("idle")
    setCode("")
    setItems([])
    setPeerActivity("idle")
    setSafety(null)
    resetCall()
  }, [resetCall])

  const handleControl = useCallback(
    (msg: Record<string, unknown>) => {
      switch (msg.k) {
        case "msg":
          if (typeof msg.text === "string") {
            setPeerActivity("idle") // they just sent — no longer typing
            addItem({
              // Share the sender's id so "delete for everyone" matches on both sides.
              id: typeof msg.id === "string" ? msg.id : newId(),
              kind: "text",
              text: msg.text,
              mine: false,
              ts: typeof msg.ts === "number" ? msg.ts : Date.now(),
            })
          }
          break
        case "activity":
          if (msg.state === "typing" || msg.state === "present" || msg.state === "idle") {
            setPeerActivity(msg.state)
          }
          break
        case "delete":
          // Peer deleted a message for everyone — remove it on our side too.
          if (typeof msg.id === "string") {
            setItems((prev) => prev.filter((it) => it.id !== msg.id))
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
        case "destroy":
          // The other person chose "exit & destroy": wipe the whole room on our
          // side too — messages, the resume memory, and the code reservation.
          if (codeRef.current) releaseCode(codeRef.current)
          toast.error("The other person ended and destroyed this room.")
          wipeEverything()
          break
      }
    },
    [addItem, patchItem, wipeEverything],
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
    (publicCode: string, secret: string | null, fullCode: string) => {
      peerRef.current?.close()
      incomingRef.current = null
      setItems([])
      setPeerActivity("idle")
      setSafety(null)
      resetCall()
      // Display (and remember) the full "public#secret" code — that's what the
      // peer needs. Server-facing operations use only the public part.
      setCode(fullCode)
      codeRef.current = publicCode

      const peer = new PeerConnection({
        onStatus: setStatus,
        onControl: handleControl,
        onBinary: handleBinary,
        onSafety: setSafety,
        onCallState: (state, meta) => {
          setCallState(state)
          setCallVideo(meta.video)
          if (state === "idle") {
            setMicOn(true)
            setCamOn(true)
          }
        },
        onLocalStream: setLocalStream,
        onRemoteStream: setRemoteStream,
        onError: (message) => toast.error(message),
      })
      peerRef.current = peer
      peer.connect(publicCode, secret)
    },
    [handleControl, handleBinary, resetCall],
  )

  // Connect to a code ("public" or "public#secret"). In "create" mode we first
  // reserve the public part so two hosts can never collide, and always attach a
  // secret so the room's signaling is end-to-end encrypted; the server only
  // ever sees the public part. Returns { taken: true } if someone holds it.
  const connect = useCallback(
    async (rawCode: string, mode: ConnectMode = "join"): Promise<{ taken: boolean }> => {
      const { code: publicCode, secret: parsed } = splitFullCode(rawCode)
      if (publicCode.length < 3) return { taken: false }

      // A created room always gets a secret, even for a hand-typed code.
      const secret = parsed ?? (mode === "create" ? generateSecret() : null)

      if (mode === "create") {
        const result = await reserveCode(publicCode)
        if (result.taken) return { taken: true }
        reservedRef.current = publicCode
      }

      const fullCode = secret ? `${publicCode}#${secret}` : publicCode
      const session: LastSession = { code: fullCode, mode }
      writeLast(session)
      setLastSession(session)

      openPeer(publicCode, secret, fullCode)
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
      // Send the id with the message so both sides key the message the same way
      // (required for "delete for everyone" to find it on the peer).
      const id = newId()
      const ts = Date.now()
      peer.sendControl({ k: "msg", id, text: trimmed, ts })
      addItem({ id, kind: "text", text: trimmed, mine: true, ts })
    },
    [addItem],
  )

  const sendFile = useCallback(
    (file: File) => {
      const id = newId()
      const mime = file.type || "application/octet-stream"
      // Local preview for images/GIFs so the sender sees them inline too.
      const url = mime.startsWith("image/") ? URL.createObjectURL(file) : undefined

      addItem({
        id,
        kind: "file",
        name: file.name,
        size: file.size,
        mime,
        mine: true,
        ts: Date.now(),
        progress: 0,
        status: "transferring",
        url,
      })

      // Queue behind any in-flight transfer: files must not interleave on the
      // single data channel, or the receiver's chunks would get mixed up.
      sendChainRef.current = sendChainRef.current.then(async () => {
        const peer = peerRef.current
        if (!peer?.isOpen()) {
          patchItem(id, { status: "error" })
          return
        }
        try {
          await peer.sendFile(file, id, (sent, total) => {
            patchItem(id, { progress: total > 0 ? sent / total : 1 })
          })
          patchItem(id, { progress: 1, status: "complete" })
        } catch {
          patchItem(id, { status: "error" })
        }
      })
    },
    [addItem, patchItem],
  )

  // Delete a message: locally always; "for everyone" also tells the peer to drop it.
  const deleteItem = useCallback((id: string, forEveryone: boolean) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (forEveryone) peerRef.current?.sendControl({ k: "delete", id })
  }, [])

  // ---- Call actions ----
  const startCall = useCallback((video: boolean) => {
    void peerRef.current?.startCall(video)
  }, [])
  const acceptCall = useCallback(() => {
    void peerRef.current?.acceptCall()
  }, [])
  const declineCall = useCallback(() => {
    peerRef.current?.declineCall()
  }, [])
  const endCall = useCallback(() => {
    peerRef.current?.endCall()
  }, [])
  const toggleMic = useCallback(() => {
    setMicOn(peerRef.current?.toggleMic() ?? true)
  }, [])
  const toggleCam = useCallback(() => {
    setCamOn(peerRef.current?.toggleCam() ?? true)
  }, [])

  // Abandon before/around connecting (waiting cancel, "back to start"): release
  // the code and clear, but keep it simple — nothing to resume yet.
  const disconnect = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    incomingRef.current = null
    if (reservedRef.current) {
      releaseCode(reservedRef.current)
      reservedRef.current = null
    }
    codeRef.current = ""
    setStatus("idle")
    setCode("")
    setItems([])
    setPeerActivity("idle")
    setSafety(null)
    resetCall()
  }, [resetCall])

  // Safe exit: leave the conversation but KEEP the code reserved and the resume
  // memory, so either person can rejoin/resume the same room within the window.
  const leaveSafely = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    incomingRef.current = null
    codeRef.current = ""
    setStatus("idle")
    setCode("")
    setItems([])
    setPeerActivity("idle")
    setSafety(null)
    resetCall()
    // reservedRef + lastSession are intentionally left intact for resume.
  }, [resetCall])

  // Exit & destroy: tell the peer to wipe everything, delete the code from the
  // database, and tear the whole room down on both sides — no resume possible.
  const destroyRoom = useCallback(() => {
    const theCode = codeRef.current
    peerRef.current?.sendControl({ k: "destroy" })
    if (theCode) releaseCode(theCode)
    // Give the destroy frame a moment to flush over the channel, then tear down.
    setTimeout(() => wipeEverything(), 250)
  }, [wipeEverything])

  // Tear down the live connection on unmount. The reservation is deliberately
  // NOT released here — a tab close should still be resumable within the window;
  // only an explicit "exit & destroy" removes the code.
  useEffect(() => {
    return () => {
      peerRef.current?.close()
      peerRef.current = null
    }
  }, [])

  return {
    status,
    items,
    code,
    lastSession,
    peerActivity,
    safety,
    connect,
    reconnect,
    forgetLastSession,
    sendText,
    sendFile,
    sendActivity,
    deleteItem,
    disconnect,
    leaveSafely,
    destroyRoom,
    // calls
    callState,
    callVideo,
    localStream,
    remoteStream,
    micOn,
    camOn,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCam,
  }
}
