// Message shapes exchanged with the signaling server.
// The server only ever carries these tiny handshake notes — never chat or files.

export type ServerEvent =
  | { t: "ready"; role: SignalRole } // you are connected; here is your role
  | { t: "peer-present" } // the other side is already waiting
  | { t: "peer-joined" } // the other side just arrived (host: create the offer)
  | { t: "peer-left" } // the other side disconnected
  | { t: "full" } // this code already has two people
  | { t: "signal"; data: unknown } // relayed WebRTC offer/answer/ICE from the peer
  | { t: "ping" } // keepalive

export type SignalRole = "host" | "guest"

// Body posted to relay a handshake payload to the other peer.
export interface SignalPost {
  code: string
  peer: string // sender's ephemeral id, so the server forwards to the other one
  data: unknown // SDP or ICE candidate
}
