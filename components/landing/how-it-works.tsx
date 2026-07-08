import { Server, Smartphone, Check, X } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          What the server actually sees
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          For a brief moment the server passes tiny "how do I reach you" notes between the two
          devices. Then it steps away and the two of you talk directly.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
        {/* Phase 1 */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase 1 · Introduction
          </span>
          <div className="mt-6 flex items-center justify-between gap-2">
            <Node label="You" />
            <div className="flex flex-1 flex-col items-center">
              <Server className="h-6 w-6 text-primary" />
              <span className="mt-1 text-[11px] text-muted-foreground">signaling</span>
              <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            <Node label="Peer" />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            The server relays only the connection handshake — network addresses and encryption
            setup. It never sees a single message.
          </p>
        </div>

        {/* Phase 2 */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase 2 · Direct link
          </span>
          <div className="mt-6 flex items-center justify-between gap-2">
            <Node label="You" active />
            <div className="flex flex-1 flex-col items-center opacity-40">
              <div className="relative">
                <Server className="h-6 w-6" />
                <X className="absolute -right-2 -top-2 h-4 w-4 text-destructive" />
              </div>
              <span className="mt-1 text-[11px]">out of the loop</span>
            </div>
            <Node label="Peer" active />
          </div>
          <div className="mt-2 -mx-1 h-px bg-gradient-to-r from-success via-success to-success" />
          <p className="mt-4 text-sm text-muted-foreground">
            Chat and files now flow straight between devices, end-to-end encrypted. The server
            carries none of it.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        <Fact ok label="Handshake is relayed briefly" />
        <Fact ok label="Messages stay between devices" />
        <Fact label="No message ever stored on the server" />
        <Fact label="No account, no identity collected" />
      </div>
    </section>
  )
}

function Node({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={
          "grid h-12 w-12 place-items-center rounded-xl border " +
          (active
            ? "border-success/40 bg-success/10 text-success"
            : "border-border bg-secondary text-foreground")
        }
      >
        <Smartphone className="h-5 w-5" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Fact({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Check className={"h-4 w-4 " + (ok ? "text-primary" : "text-success")} />
      {label}
    </span>
  )
}
