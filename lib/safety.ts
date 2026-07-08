// Short Authentication String (SAS).
//
// The connection code is the ONLY thing deciding who becomes the second peer, so
// anyone who learns or guesses it could take that slot — and WebRTC would then
// faithfully encrypt your channel *to them*. Encryption alone can't tell you
// *who* is on the other end.
//
// The fix is the same trick Signal/ZRTP use: both devices independently derive
// the SAME sequence of emoji from the two DTLS certificate fingerprints that
// were exchanged during the handshake. Read them aloud (or compare on screen).
// If they match, no impostor slipped in between — the fingerprints they'd need
// to forge are bound to keys they don't hold. If they DON'T match, stop.
//
// It's symmetric by construction: each side sorts [ownFingerprint, peerFingerprint]
// before hashing, so both compute an identical value regardless of who is host.

// 64 distinct, easy-to-name emoji → each byte maps to one with no modulo bias
// (256 % 64 === 0). Five emoji ≈ 30 bits, plenty for a human compare.
const EMOJI = [
  "🐙", "🦊", "🐢", "🦉", "🐳", "🦋", "🐝", "🦀",
  "🐬", "🦁", "🐼", "🦩", "🐧", "🦜", "🐛", "🦄",
  "🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "🍑",
  "🥝", "🥥", "🌵", "🌻", "🍄", "🌲", "🍀", "🌸",
  "⚓", "🔑", "🔔", "⭐", "🌙", "🔥", "❄️", "⚡",
  "🎈", "🎁", "🎸", "🎺", "🎨", "🚀", "🛸", "🚲",
  "⚽", "🏀", "🎲", "🧩", "♟️", "🎯", "🧭", "⏰",
  "💎", "🔮", "🧲", "🔧", "🔒", "📌", "🪁", "🧸",
]

// Pull the SHA-256 DTLS fingerprint out of an SDP blob.
function fingerprint(sdp: string): string | null {
  const m = sdp.match(/a=fingerprint:sha-256\s+([0-9A-Fa-f:]+)/)
  return m ? m[1].toUpperCase() : null
}

/**
 * Derive the shared emoji safety string from the local and remote SDP.
 * Returns null if fingerprints aren't present yet or WebCrypto is unavailable.
 */
export async function deriveSafety(localSdp: string, remoteSdp: string): Promise<string | null> {
  const a = fingerprint(localSdp)
  const b = fingerprint(remoteSdp)
  if (!a || !b || typeof crypto === "undefined" || !crypto.subtle) return null

  // Sort so both peers hash the identical string.
  const pair = [a, b].sort().join("|")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pair))
  const bytes = new Uint8Array(digest)

  const out: string[] = []
  for (let i = 0; i < 5; i++) out.push(EMOJI[bytes[i] % EMOJI.length])
  return out.join(" ")
}
