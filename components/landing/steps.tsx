import { KeyRound, Share2, Wifi } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

const STEPS = [
  {
    icon: KeyRound,
    title: "1 · Create a code",
    body: "Open Wisp and get a unique connection code — or type your own number. Nothing is registered anywhere.",
  },
  {
    icon: Share2,
    title: "2 · Share it",
    body: "Send that code (or the invite link) to the person you want to talk to, through any channel you like.",
  },
  {
    icon: Wifi,
    title: "3 · Connect directly",
    body: "They enter the code and your two devices link up directly. From that moment the server is out of the picture.",
  },
]

export function Steps() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Three steps. No sign-up.
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          The server only introduces the two of you. Once you are connected, every message and
          file travels straight between your devices.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 0.1}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
