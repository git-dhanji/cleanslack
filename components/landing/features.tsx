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
    <section>
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Private because the data never reaches us
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Not &quot;private because we promise&quot; — private by the way it is built.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.08} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
