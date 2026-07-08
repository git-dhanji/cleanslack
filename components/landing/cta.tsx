import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            No install, no account. Open a connection, share the code, and start talking privately
            in seconds.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/connect">
              Create a connection
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
