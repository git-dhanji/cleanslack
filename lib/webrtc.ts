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

// Call state for voice/video. All call setup is signaled over the data channel
// (never the server) via a manual renegotiation, so calls add zero server load.
export type CallState = "idle" | "calling" | "incoming" | "active"
export interface CallMeta {
  video: boolean
}

export interface PeerHandlers {
  onStatus?: (status: PeerStatus) => void
  onControl?: (msg: Record<string, unknown>) => void // JSON control/text frames
  onBinary?: (chunk: ArrayBuffer) => void // binary file chunks
  onCallState?: (state: CallState, meta: CallMeta) => void
  onLocalStream?: (stream: MediaStream | null) => void
  onRemoteStream?: (stream: MediaStream | null) => void
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
  // Serialize remote-signal handling so an ICE candidate can never be processed
  // before the SDP it belongs to. Candidates that still arrive early are buffered.
  private signalChain: Promise<void> = Promise.resolve()
  private remoteReady = false
  private pendingCandidates: RTCIceCandidateInit[] = []
  // Voice/video call state (renegotiated over the data channel).
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private callState: CallState = "idle"
  private callMeta: CallMeta = { video: false }
  private callSenders: RTCRtpSender[] = []
  private callChain: Promise<void> = Promise.resolve()
  private callRemoteReady = false
  private pendingCallCandidates: RTCIceCandidateInit[] = []

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
      if (!e.candidate) return
      // Before the direct link exists, candidates go via the server. Once the
      // data channel is open (e.g. during a call renegotiation), they go P2P.
      if (this.isOpen()) {
        this.channel!.send(JSON.stringify({ k: "call-ice", candidate: e.candidate }))
      } else {
        this.postSignal({ candidate: e.candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === "failed") this.setStatus("failed")
      else if (s === "disconnected" && !this.closedByUser) this.setStatus("disconnected")
    }

    // Remote media arriving during a call.
    pc.ontrack = (e) => {
      if (!this.remoteStream) this.remoteStream = new MediaStream()
      this.remoteStream.addTrack(e.track)
      this.handlers.onRemoteStream?.(this.remoteStream)
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
        // Chain so each signal fully applies before the next one starts.
        this.signalChain = this.signalChain.then(() => this.onRemoteSignal(event.data))
        break
      case "ping":
        break
    }
  }

  private async makeOffer() {
    const pc = this.pc
    if (!pc) return
    const channel = pc.createDataChannel("cove", { ordered: true })
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
        // Remote description is set — drain any candidates that arrived early.
        this.remoteReady = true
        const buffered = this.pendingCandidates.splice(0)
        for (const candidate of buffered) {
          await pc.addIceCandidate(candidate).catch(() => {})
        }
      } else if (payload.candidate) {
        if (this.remoteReady) {
          await pc.addIceCandidate(payload.candidate)
        } else {
          // No remote description yet — hold the candidate until there is one.
          this.pendingCandidates.push(payload.candidate)
        }
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
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(e.data)
        } catch {
          return // ignore malformed control frame
        }
        // Call-signaling frames are handled internally; everything else
        // (chat, files, typing) goes to the app.
        if (typeof msg.k === "string" && msg.k.startsWith("call-")) {
          this.callChain = this.callChain.then(() => this.handleCallControl(msg))
        } else {
          this.handlers.onControl?.(msg)
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

  // Send a file directly to the peer, chunked with backpressure so large files
  // don't blow up memory. The channel is reliable + ordered, so chunks arrive
  // complete and in order — nothing is lost. Progress is reported in bytes.
  async sendFile(
    file: File,
    id: string,
    onProgress?: (sent: number, total: number) => void,
  ): Promise<void> {
    const ch = this.channel
    if (!ch || ch.readyState !== "open") throw new Error("not connected")

    const CHUNK = 16 * 1024 // 16 KiB — safe across browsers
    const HIGH_WATER = 8 * 1024 * 1024 // pause sending above 8 MiB buffered
    ch.bufferedAmountLowThreshold = 256 * 1024

    this.sendControl({
      k: "file-start",
      id,
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
    })

    let offset = 0
    while (offset < file.size) {
      if (ch.bufferedAmount > HIGH_WATER) {
        await new Promise<void>((resolve) => {
          const onLow = () => {
            ch.removeEventListener("bufferedamountlow", onLow)
            resolve()
          }
          ch.addEventListener("bufferedamountlow", onLow)
        })
      }
      const end = Math.min(offset + CHUNK, file.size)
      const buffer = await file.slice(offset, end).arrayBuffer()
      if (ch.readyState !== "open") throw new Error("connection closed")
      ch.send(buffer)
      offset = end
      onProgress?.(offset, file.size)
    }

    this.sendControl({ k: "file-end", id })
  }

  // ---- Voice / video calls (all signaling flows over the data channel) ----

  private sendCall(obj: Record<string, unknown>) {
    if (this.isOpen()) this.channel!.send(JSON.stringify(obj))
  }

  private setCallState(state: CallState) {
    this.callState = state
    this.handlers.onCallState?.(state, this.callMeta)
  }

  private async getMedia(video: boolean): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera/microphone need HTTPS or localhost")
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video })
    this.localStream = stream
    this.handlers.onLocalStream?.(stream)
    return stream
  }

  private addLocalTracks() {
    const pc = this.pc
    if (!pc || !this.localStream || this.callSenders.length) return
    for (const track of this.localStream.getTracks()) {
      this.callSenders.push(pc.addTrack(track, this.localStream))
    }
  }

  private cleanupCall(notify = true) {
    for (const track of this.localStream?.getTracks() ?? []) track.stop()
    if (this.pc) {
      for (const sender of this.callSenders) {
        try {
          this.pc.removeTrack(sender)
        } catch {
          /* pc may be closing */
        }
      }
    }
    this.callSenders = []
    this.localStream = null
    this.remoteStream = null
    this.callRemoteReady = false
    this.pendingCallCandidates = []
    this.callMeta = { video: false }
    if (notify) {
      this.handlers.onLocalStream?.(null)
      this.handlers.onRemoteStream?.(null)
      this.setCallState("idle")
    }
  }

  // Caller: request a call. Media is added only after the peer accepts.
  async startCall(video: boolean) {
    if (!this.isOpen() || this.callState !== "idle") return
    this.callMeta = { video }
    try {
      await this.getMedia(video)
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err.message : "Could not access media")
      this.cleanupCall()
      return
    }
    this.setCallState("calling")
    this.sendCall({ k: "call-invite", video })
  }

  // Callee: accept the incoming call, then wait for the caller's offer.
  async acceptCall() {
    if (this.callState !== "incoming") return
    try {
      await this.getMedia(this.callMeta.video)
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err.message : "Could not access media")
      this.declineCall()
      return
    }
    this.setCallState("active")
    this.sendCall({ k: "call-accept" })
  }

  declineCall() {
    this.sendCall({ k: "call-decline" })
    this.cleanupCall()
  }

  endCall() {
    this.sendCall({ k: "call-end" })
    this.cleanupCall()
  }

  toggleMic(): boolean {
    const track = this.localStream?.getAudioTracks()[0]
    if (!track) return false
    track.enabled = !track.enabled
    return track.enabled
  }

  toggleCam(): boolean {
    const track = this.localStream?.getVideoTracks()[0]
    if (!track) return false
    track.enabled = !track.enabled
    return track.enabled
  }

  private async handleCallControl(msg: Record<string, unknown>) {
    const pc = this.pc
    if (!pc) return
    try {
      switch (msg.k) {
        case "call-invite":
          this.callMeta = { video: !!msg.video }
          this.setCallState("incoming")
          break
        case "call-accept": {
          // Caller: attach media and send the renegotiation offer.
          this.addLocalTracks()
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          this.setCallState("active")
          this.sendCall({ k: "call-sdp", sdp: pc.localDescription })
          break
        }
        case "call-decline":
        case "call-end":
          this.cleanupCall()
          break
        case "call-sdp": {
          const sdp = (msg.sdp as RTCSessionDescriptionInit | undefined) ?? undefined
          if (!sdp) break
          await pc.setRemoteDescription(sdp)
          if (sdp.type === "offer") {
            // Callee: attach media and answer.
            this.addLocalTracks()
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            this.sendCall({ k: "call-sdp", sdp: pc.localDescription })
          }
          this.callRemoteReady = true
          const buffered = this.pendingCallCandidates.splice(0)
          for (const c of buffered) await pc.addIceCandidate(c).catch(() => {})
          break
        }
        case "call-ice": {
          const candidate = msg.candidate as RTCIceCandidateInit | undefined
          if (!candidate) break
          if (this.callRemoteReady) await pc.addIceCandidate(candidate).catch(() => {})
          else this.pendingCallCandidates.push(candidate)
          break
        }
      }
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err.message : "call error")
    }
  }

  close() {
    this.closedByUser = true
    this.cleanupCall(false)
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
