// Message shapes exchanged with the signaling server.
// The server only ever carries these tiny handshake notes — never chat or files.

export type SignalRole = "host" | "guest"

// Internal event stream the browser peer engine reacts to. The poll response
// (below) is translated into a sequence of these so the WebRTC logic stays the
// same whether signaling arrives via polling or any future transport.
export type ServerEvent =
  | { t: "ready"; role: SignalRole } // you are connected; here is your role
  | { t: "peer-present" } // the other side is already waiting
  | { t: "peer-joined" } // the other side just arrived (host: create the offer)
  | { t: "peer-left" } // the other side disconnected
  | { t: "full" } // this code already has two people
  | { t: "signal"; data: unknown } // relayed WebRTC offer/answer/ICE from the peer
  | { t: "ping" } // keepalive

// GET /api/signal response — a single poll snapshot.
export interface SignalPoll {
  role: SignalRole | null // your assigned role, or null when the room is full
  full: boolean // true when a third peer tried to join
  others: string[] // ephemeral ids of the other peer(s) currently present
  msgs: unknown[] // handshake notes (SDP / ICE) the other peer left for you
}

// Body posted to POST /api/signal: relay a handshake payload, or leave the room.
export interface SignalPost {
  code: string
  peer: string // sender's ephemeral id, so the server routes to the other one
  data?: unknown // SDP or ICE candidate (omitted when leaving)
  leave?: boolean // true to drop our presence immediately
}
