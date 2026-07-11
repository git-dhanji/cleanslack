// Friendly connection-code generator, shared by the browser (lobby) and the
// server (uniqueness endpoint). Pure and dependency-free so it runs in both.

const ADJECTIVES = [
  "brave", "calm", "clever", "swift", "quiet", "bright", "bold", "warm",
  "cool", "keen", "mellow", "noble", "vivid", "amber", "azure", "cosmic",
]
const NOUNS = [
  "otter", "falcon", "cedar", "harbor", "meadow", "comet", "river", "lynx",
  "willow", "ember", "pixel", "cobalt", "summit", "orbit", "quartz", "raven",
]

// Cryptographically-strong random in [0, max). Falls back to Math.random only
// where WebCrypto is unavailable (it isn't, in any browser or Node we target).
function secureInt(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Rejection-sample to avoid modulo bias.
    const limit = Math.floor(0xffffffff / max) * max
    const buf = new Uint32Array(1)
    let x = 0
    do {
      crypto.getRandomValues(buf)
      x = buf[0]
    } while (x >= limit)
    return x % max
  }
  return Math.floor(Math.random() * max)
}

// e.g. "brave-otter-4821" — the PUBLIC part of a room code. It only names the
// room on the server (reservation + signaling mailbox); the security comes from
// the secret after "#", which the server never sees.
export function generateCode(): string {
  const pick = <T,>(arr: T[]) => arr[secureInt(arr.length)]
  const num = 1000 + secureInt(9000)
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${num}`
}

// The room secret: 12 chars of [a-z0-9] ≈ 62 bits of entropy. Shared only
// between the two people (URL fragment / the text after "#") — never sent to
// the server. It keys the AES-GCM encryption of all signaling payloads.
const SECRET_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"
export function generateSecret(): string {
  let out = ""
  for (let i = 0; i < 12; i++) out += SECRET_CHARS[secureInt(SECRET_CHARS.length)]
  return out
}

// A full shareable code is "public#secret". Split it into the server-visible
// room name and the private secret (null when the code has no secret).
export function splitFullCode(raw: string): { code: string; secret: string | null } {
  const [pub, ...rest] = raw.trim().toLowerCase().split("#")
  const code = pub.replace(/[^a-z0-9-]/g, "").slice(0, 64)
  const secret = rest.join("").replace(/[^a-z0-9]/g, "").slice(0, 64) || null
  return { code, secret }
}
