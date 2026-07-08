import Link from "next/link"
import { ArrowRight, ShieldCheck, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            No accounts · No storage · No server in the middle
          </span>

          <h1 className="animate-fade-in-up animation-delay-100 mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Talk directly.
            <br />
            <span className="text-primary">Leave no trace.</span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            Cove links two devices directly, browser to browser. Share a code, connect, and
            chat or send files end-to-end encrypted — with nothing passing through, or stored on,
            any server.
          </p>

          <div className="animate-fade-in-up animation-delay-300 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/connect">
                Start a private chat
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/tutorial">See how it works</Link>
            </Button>
          </div>

          <p className="animate-fade-in animation-delay-400 mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Encrypted end-to-end by default
          </p>
        </div>
      </div>
    </section>
  )
}
