"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { ArrowRight, ShieldCheck, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            No accounts · No storage · No server in the middle
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            Talk directly.
            <br />
            <span className="text-primary">Leave no trace.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
          >
            Cove links two devices directly, browser to browser. Share a code, connect, and chat or
            send files end-to-end encrypted — with nothing passing through, or stored on, any server.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/connect">
                Start a private chat
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/tutorial">See how it works</Link>
            </Button>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Lock className="h-3.5 w-3.5" />
            Encrypted end-to-end by default
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
