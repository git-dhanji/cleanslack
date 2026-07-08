import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"

// Deliberately not cards — two clean typographic moves: create, then use.
export function CreateUse() {
  return (
    <section className="border-y border-border/60 bg-secondary/20">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            It only takes two moves
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            No sign-up, no setup. Create a connection, then use it — everything happens directly
            between the two of you.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 md:grid-cols-2">
          <Reveal>
            <p className="font-mono text-sm text-primary">01 — Create</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Make a connection</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Generate a code or type your own, then share it however you like — a link, a QR code,
              or just the words. That is the entire &quot;setup&quot;.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="font-mono text-sm text-primary">02 — Use</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Talk, share, call</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              The moment they join, everything flows straight between your devices — messages, files
              of any size, and voice or video calls. End-to-end encrypted, stored nowhere, gone the
              moment you leave.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-14">
          <Button asChild size="lg">
            <Link href="/connect">
              Create a connection
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
