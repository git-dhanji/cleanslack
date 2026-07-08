import { Lock, ServerOff, FileUp, EyeOff, Gauge, UserX } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

const FEATURES = [
  {
    icon: Lock,
    title: "End-to-end encrypted",
    body: "Every connection is secured with WebRTC's built-in DTLS encryption. Only the two devices hold the keys.",
  },
  {
    icon: ServerOff,
    title: "Nothing through the server",
    body: "The server only helps you find each other. Messages and files never pass through it — zero relay, zero load.",
  },
  {
    icon: UserX,
    title: "No accounts, ever",
    body: "No email, no password, no profile. You are never asked who you are, so there is nothing to leak.",
  },
  {
    icon: EyeOff,
    title: "Nothing is stored",
    body: "No message history, no logs, no server-side copy of anything you say. Close the tab and the conversation is gone.",
  },
  {
    icon: FileUp,
    title: "Large files, direct",
    body: "Send files of any size straight to the other device. Transfers are chunked and reliable — nothing gets lost.",
  },
  {
    icon: Gauge,
    title: "Fast & minimal",
    body: "A direct link means low latency and no upload-then-download round trip. Clean, distraction-free interface.",
  },
]

export function Features() {
  return (
    <section className="border-y border-border/70 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for privacy, by design
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Cove is not "private because we promise". It is private because the data
            physically never reaches us.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.08}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
