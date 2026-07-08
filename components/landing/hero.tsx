"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { ArrowRight, ShieldCheck, Lock, UserX, ServerOff, Infinity as InfinityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const TRUST = [
  { icon: UserX, label: "No accounts" },
  { icon: ServerOff, label: "No server in the middle" },
  { icon: Lock, label: "End-to-end encrypted" },
  { icon: InfinityIcon, label: "Files of any size" },
]

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-fade" aria-hidden="true">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 grid-beam" />
      </div>
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Private by design · Nothing stored, anywhere
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          >
            Talk directly.
            <br />
            <span className="text-primary">Leave no trace.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
          >
            Wisp links two devices directly, browser to browser. Share a code, connect, and chat,
            call, or send files — end-to-end encrypted, with nothing passing through, or stored on,
            any server.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/connect">
                Create a connection
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/tutorial">See how it works</Link>
            </Button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}
