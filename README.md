<div align="center">

# 🔗 Peerlink — Private, peer-to-peer chat & file sharing

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/WebRTC-P2P-333?style=for-the-badge&logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

<p align="center">
  <strong>Two people connect directly, browser-to-browser. End-to-end encrypted chat and file
  transfer with no accounts, no stored data, and nothing passing through a server.</strong>
</p>

</div>

---

## What it is

Peerlink links two devices **directly** using WebRTC. You share a short code (generated or your
own), the other person enters it, and from that moment your two browsers talk to each other with
**no server in the middle**.

- **End-to-end encrypted** — every WebRTC connection is secured with DTLS. Only the two devices hold the keys.
- **No accounts** — no email, no password, no profile. Nothing about you is collected.
- **No storage** — there is no database. Messages and files live only in the two browsers and vanish when the tab closes.
- **Nothing through the server** — chat and files travel device-to-device. Zero relay, zero server load.
- **Large files, direct** — send files of any size, streamed in chunks over a reliable channel so nothing is lost.

## How it works

Peerlink has exactly **one** server responsibility: *introductions*.

1. **Introduction (signaling).** When you share a code and your peer enters it, the two browsers
   exchange a small handshake (network addresses + encryption setup). The server relays only these
   tiny notes — never a message or a file. This is the single API route, [`/api/signal`](app/api/signal/route.ts),
   and it keeps its state **in memory only** (no database, nothing persisted).
2. **Direct link.** Once a path is found, an encrypted data channel opens straight between the two
   devices and Peerlink **closes the signaling connection**. The server is now out of the loop; all
   data flows peer-to-peer.

```
Phase 1                          Phase 2
You ──▶ [ server ] ──▶ Peer      You ══════════════▶ Peer
   (handshake only)                 (direct, encrypted;
                                     server not involved)
```

## Project structure

```
app/
  page.tsx              Landing page (what / why / how)
  connect/page.tsx      The P2P connect + chat experience
  guide/page.tsx        Conceptual reference + honest limitations
  tutorial/page.tsx     Step-by-step walkthrough
  api/signal/route.ts   The only server code: in-memory signaling relay
lib/
  webrtc.ts             Peer engine: signaling, ICE, data channel, chunked files
  signaling-types.ts    Shared handshake message shapes
hooks/
  use-peer.ts           React hook over the peer engine (chat + file state)
components/
  connect/*             Lobby, waiting panel, chat room, file bubbles
  landing/*             Landing sections
  content/*             Guide/Tutorial shell
  ui/*                  shadcn/ui primitives
```

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **WebRTC** data channels for all peer-to-peer data
- **Server-Sent Events** for the brief signaling handshake
- **Tailwind CSS 4** + **shadcn/ui** · minimal palette · light & dark mode

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000 on two devices/tabs to try a connection
```

No database or secrets are required. The only optional configuration is a TURN relay (see below).

### Configuration (`.env.local`)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional TURN relay for the ~10-20% of connections behind strict NATs.
# It only ever carries DTLS-encrypted traffic, so it cannot read your data.
# NEXT_PUBLIC_TURN_URL=turn:your-turn-host:3478
# NEXT_PUBLIC_TURN_USERNAME=
# NEXT_PUBLIC_TURN_CREDENTIAL=
```

## Deployment note

The signaling relay keeps its state in the server process's memory. That works out of the box on a
single long-lived Node server (`next start`) or a VPS. On a horizontally-scaled or serverless
platform, both peers must reach the **same** instance — front the signaling route with a shared
pub/sub (e.g. Redis) if you deploy that way. This is deliberate: keeping signaling minimal is what
lets the server know nothing.

## Honest limitations

- **Both people must be online at once** — nothing is stored, so there is no offline delivery.
- **No history** — close the tab and the conversation is gone. That is the point.
- **A few strict networks need a TURN relay** to connect (see configuration above).
- **Very large received files** are assembled in browser memory before you save them.

---

<div align="center">
<sub>Built for privacy by design — because the safest data is the data that never reaches a server.</sub>
</div>
