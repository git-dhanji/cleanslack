// Client-side encryption for signaling payloads (SDP + ICE).
//
// The room secret (the part of the code after "#") never reaches the server —
// it travels only in the URL fragment or by the users sharing it directly.
// Both peers derive the same AES-GCM key from it and seal every handshake
// payload, so the signaling server relays only opaque ciphertext. A server
// (or anyone who enumerates room codes) cannot read the handshake or
// man-in-the-middle the connection: without the secret, nothing decrypts.

const textEncoder = new TextEncoder()

export interface SealedSignal {
  e: 1 // envelope version
  iv: string // base64 12-byte GCM nonce
  ct: string // base64 ciphertext (JSON of the real payload)
}

export function isSealed(x: unknown): x is SealedSignal {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as SealedSignal).e === 1 &&
    typeof (x as SealedSignal).iv === "string" &&
    typeof (x as SealedSignal).ct === "string"
  )
}

function toBase64(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// Derive the shared signaling key. The public code goes into the salt so the
// same secret on a different code still yields a different key.
export async function deriveSignalKey(code: string, secret: string): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey("raw", textEncoder.encode(secret), "HKDF", false, [
    "deriveKey",
  ])
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode(`wisp/signal/${code}`),
      info: textEncoder.encode("aes-gcm-signaling-v1"),
    },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function sealSignal(key: CryptoKey, data: unknown): Promise<SealedSignal> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(JSON.stringify(data)),
  )
  return { e: 1, iv: toBase64(iv), ct: toBase64(new Uint8Array(ct)) }
}

// Returns the decrypted payload, or null if the ciphertext doesn't open with
// this key (wrong secret, tampering) — callers must drop such payloads.
export async function openSignal(key: CryptoKey, sealed: SealedSignal): Promise<unknown | null> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(sealed.iv) as BufferSource },
      key,
      fromBase64(sealed.ct) as BufferSource,
    )
    return JSON.parse(new TextDecoder().decode(pt))
  } catch {
    return null
  }
}
