import Link from "next/link"
import { Check, X, Info, AlertTriangle } from "lucide-react"
import { PageShell, SectionTitle, Prose } from "@/components/content/page-shell"

export const metadata = {
  title: "Guide — Peerlink",
  description:
    "How Peerlink works, what makes it private, what the server can and cannot see, and its honest limitations.",
}

export default function GuidePage() {
  return (
    <PageShell
      eyebrow="Guide"
      title="How Peerlink works"
      intro="A plain-language explanation of the connection model, the privacy guarantees, and the trade-offs — so you know exactly what you are trusting."
    >
      <SectionTitle>The idea</SectionTitle>
      <Prose>
        <p>
          Most chat apps are a <em>middleman</em>: your messages travel to a company&apos;s servers,
          get stored in a database, and are forwarded to the other person. Peerlink removes the
          middleman. Two devices talk <strong>directly</strong> to each other using a browser
          technology called WebRTC.
        </p>
        <p>
          The only thing our server does is <strong>introduce</strong> the two devices. After that,
          it steps out completely.
        </p>
      </Prose>

      <SectionTitle>The two phases of a connection</SectionTitle>
      <Prose>
        <p>
          <strong>1 · Introduction (signaling).</strong> When you share a code and the other person
          enters it, the two browsers need to exchange a little technical information — network
          addresses and encryption setup — to find a path to each other. Our server relays just
          these small handshake notes. It never sees any message or file.
        </p>
        <p>
          <strong>2 · Direct link.</strong> Once the path is found, an encrypted channel opens
          straight between the two devices. Peerlink closes the signaling connection at this point.
          From here every message and file flows peer-to-peer, and the server carries none of it.
        </p>
      </Prose>

      <SectionTitle>What makes it private</SectionTitle>
      <Prose>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span>
              <strong>Always encrypted end-to-end.</strong> WebRTC connections are secured with DTLS
              by default. Only the two devices hold the keys.
            </span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span>
              <strong>No accounts.</strong> No email, phone, or password is ever requested, so there
              is no identity to store or leak.
            </span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span>
              <strong>No storage.</strong> There is no database. Messages and files exist only in
              the two browsers, and vanish when you close the tab.
            </span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span>
              <strong>Data never touches the server.</strong> Chat and files go device-to-device, so
              there is no server load and nothing to intercept in transit.
            </span>
          </li>
        </ul>
      </Prose>

      <SectionTitle>What the server can and cannot see</SectionTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4 text-primary" /> It briefly relays
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>The connection code (to match two people)</li>
            <li>Network addresses for the handshake</li>
            <li>Encryption setup messages (not the keys)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <X className="h-4 w-4 text-destructive" /> It never sees
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Any message you type</li>
            <li>Any file you send</li>
            <li>Who you are — no account, no identity</li>
          </ul>
        </div>
      </div>

      <SectionTitle>Choosing a good code</SectionTitle>
      <Prose>
        <p>
          A code is how the two devices find each other, so treat it like a one-time meeting point.
          Prefer the generated random codes, or invent something hard to guess. Share it over a
          channel you trust, and ideally use each code only once. If someone else guesses or reuses
          your code before your peer joins, they could land in the room instead — which is why a
          code links exactly two people and rejects a third.
        </p>
      </Prose>

      <SectionTitle>Good to know</SectionTitle>
      <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-chart-4" /> Honest limitations
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Both people must be online at once.</strong> Because
            nothing is stored, there is no offline delivery. It is a live connection, like a call.
          </li>
          <li>
            <strong className="text-foreground">No history.</strong> Close the tab and the
            conversation is gone. That is the point — but it means you cannot scroll back later.
          </li>
          <li>
            <strong className="text-foreground">A few strict networks need a relay.</strong> Most
            connections are fully direct via public STUN. A small share of locked-down corporate or
            mobile networks may need an optional TURN relay, which still only carries encrypted data
            it cannot read.
          </li>
          <li>
            <strong className="text-foreground">Very large files use device memory.</strong>{" "}
            Received files are assembled in the browser before you save them, so extremely large
            transfers depend on the receiving device having room.
          </li>
        </ul>
      </div>

      <div className="mt-12 text-sm text-muted-foreground">
        New here? The{" "}
        <Link href="/tutorial" className="text-primary hover:underline">
          step-by-step tutorial
        </Link>{" "}
        walks you through your first connection.
      </div>
    </PageShell>
  )
}
