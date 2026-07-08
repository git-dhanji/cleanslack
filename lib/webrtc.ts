// The peer-to-peer engine. Everything here runs in the browser.
//
// Responsibilities:
//  - talk to /api/signal ONLY to exchange the WebRTC handshake (SDP + ICE)
//  - open a reliable, ordered DataChannel directly to the other device
//  - frame messages on that channel: JSON strings for control/text,
//    binary ArrayBuffers for file chunks
//
// Once the DataChannel opens, the signaling connection is closed — the server
// is out of the loop and all data flows straight between the two peers.

import type { ServerEvent, SignalRole } from "./signaling-types"

export type PeerStatus =
  | "idle"
  | "waiting" // code is live, waiting for the other person
  | "connecting" // both present, handshake in progress
  | "connected" // direct link open
  | "disconnected"
  | "failed"
  | "full" // code already used by two people

export interface PeerHandlers {
  onStatus?: (status: PeerStatus) => void
  onControl?: (msg: Record<string, unknown>) => void // JSON control/text frames
  onBinary?: (chunk: ArrayBuffer) => void // binary file chunks
  onError?: (message: string) => void
}

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ]
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    })
  }
  return servers
}

export class PeerConnection {
  private pc: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private events: EventSource | null = null
  private readonly peerId: string
  private role: SignalRole | null = null
  private code = ""
  private status: PeerStatus = "idle"
  private closedByUser = false

  constructor(private handlers: PeerHandlers) {
    this.peerId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
  }

  getStatus() {
    return this.status
  }

  private setStatus(s: PeerStatus) {
    if (this.status === s) return
    this.status = s
    this.handlers.onStatus?.(s)
  }

  // Begin: open signaling for `code` and wire up WebRTC.
  connect(code: string) {
    this.code = code.trim().toLowerCase()
    this.closedByUser = false
    this.createPeer()

    const url = `/api/signal?code=${encodeURIComponent(this.code)}&peer=${encodeURIComponent(
      this.peerId,
    )}`
    const es = new EventSource(url)
    this.events = es

    es.onmessage = (e) => {
      let event: ServerEvent
      try {
        event = JSON.parse(e.data) as ServerEvent
      } catch {
        return
      }
      this.onServerEvent(event)
    }

    es.onerror = () => {
      // Signaling drops are only fatal before the direct link is up. Once
      // connected we deliberately close signaling ourselves.
      if (this.status !== "connected" && !this.closedByUser) {
        this.setStatus("connecting")
      }
    }
  }

  private createPeer() {
    const pc = new RTCPeerConnection({ iceServers: iceServers() })
    this.pc = pc

    pc.onicecandidate = (e) => {
      if (e.candidate) this.postSignal({ candidate: e.candidate })
    }

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === "failed") this.setStatus("failed")
      else if (s === "disconnected" && !this.closedByUser) this.setStatus("disconnected")
    }

    // Guest receives the channel the host creates.
    pc.ondatachannel = (e) => this.setupChannel(e.channel)
  }

  private onServerEvent(event: ServerEvent) {
    switch (event.t) {
      case "ready":
        this.role = event.role
        this.setStatus(event.role === "host" ? "waiting" : "connecting")
        break
      case "peer-present":
        // The other side is already here; handshake will begin momentarily.
        this.setStatus("connecting")
        break
      case "peer-joined":
        // Host makes the first move once the guest arrives.
        this.setStatus("connecting")
        if (this.role === "host") void this.makeOffer()
        break
      case "peer-left":
        if (this.status !== "connected") this.setStatus("waiting")
        break
      case "full":
        this.setStatus("full")
        this.closeSignaling()
        break
      case "signal":
        void this.onRemoteSignal(event.data)
        break
      case "ping":
        break
    }
  }

  private async makeOffer() {
    const pc = this.pc
    if (!pc) return
    const channel = pc.createDataChannel("peerlink", { ordered: true })
    this.setupChannel(channel)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    this.postSignal({ sdp: pc.localDescription })
  }

  private async onRemoteSignal(data: unknown) {
    const pc = this.pc
    if (!pc || !data || typeof data !== "object") return
    const payload = data as { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }

    try {
      if (payload.sdp) {
        await pc.setRemoteDescription(payload.sdp)
        if (payload.sdp.type === "offer") {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          this.postSignal({ sdp: pc.localDescription })
        }
      } else if (payload.candidate) {
        await pc.addIceCandidate(payload.candidate)
      }
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err.message : "handshake error")
    }
  }

  private setupChannel(channel: RTCDataChannel) {
    channel.binaryType = "arraybuffer"
    this.channel = channel

    channel.onopen = () => {
      this.setStatus("connected")
      // Server's job is done — step it out of the loop entirely.
      this.closeSignaling()
    }
    channel.onclose = () => {
      if (!this.closedByUser) this.setStatus("disconnected")
    }
    channel.onmessage = (e) => {
      if (typeof e.data === "string") {
        try {
          this.handlers.onControl?.(JSON.parse(e.data))
        } catch {
          /* ignore malformed control frame */
        }
      } else if (e.data instanceof ArrayBuffer) {
        this.handlers.onBinary?.(e.data)
      }
    }
  }

  private postSignal(data: unknown) {
    void fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: this.code, peer: this.peerId, data }),
      keepalive: true,
    }).catch(() => {
      /* peer may not be listening yet; ICE will retry paths */
    })
  }

  private closeSignaling() {
    this.events?.close()
    this.events = null
  }

  // ---- Application-facing send helpers ----

  get dataChannel() {
    return this.channel
  }

  isOpen() {
    return this.channel?.readyState === "open"
  }

  sendControl(obj: Record<string, unknown>): boolean {
    if (!this.isOpen()) return false
    this.channel!.send(JSON.stringify(obj))
    return true
  }

  sendBinary(chunk: ArrayBuffer): boolean {
    if (!this.isOpen()) return false
    this.channel!.send(chunk)
    return true
  }

  // Convenience: send a chat message.
  sendText(text: string): boolean {
    return this.sendControl({ k: "msg", text, ts: Date.now() })
  }

  close() {
    this.closedByUser = true
    this.closeSignaling()
    try {
      this.channel?.close()
    } catch {
      /* noop */
    }
    try {
      this.pc?.close()
    } catch {
      /* noop */
    }
    this.channel = null
    this.pc = null
    this.setStatus("disconnected")
  }
}

// Generate a friendly random connection code (e.g. "brave-otter-4821").
const ADJECTIVES = [
  "brave", "calm", "clever", "swift", "quiet", "bright", "bold", "warm",
  "cool", "keen", "mellow", "noble", "vivid", "amber", "azure", "cosmic",
]
const NOUNS = [
  "otter", "falcon", "cedar", "harbor", "meadow", "comet", "river", "lynx",
  "willow", "ember", "pixel", "cobalt", "summit", "orbit", "quartz", "raven",
]

export function generateCode(): string {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${num}`
}
