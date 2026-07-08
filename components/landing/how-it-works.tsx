"use client"

import { motion } from "motion/react"
import { Server, Smartphone, Check, X } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          What the server actually sees
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          For a brief moment the server passes tiny &quot;how do I reach you&quot; notes between the two
          devices. Then it steps away and the two of you talk directly.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
        {/* Phase 1 — packets relayed through the server */}
        <Reveal delay={0.05} className="rounded-2xl border border-border bg-card p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase 1 · Introduction
          </span>
          <div className="mt-8 flex items-center gap-3">
            <Node label="You" />
            <Wire>
              <CenterServer />
              <Packet color="bg-primary" delay={0} />
              <Packet color="bg-primary" delay={0.9} />
              <Packet color="bg-primary" delay={1.5} reverse />
            </Wire>
            <Node label="Peer" />
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            The server relays only the connection handshake — network addresses and encryption
            setup. It never sees a single message.
          </p>
        </Reveal>

        {/* Phase 2 — data flows directly, server out of the loop */}
        <Reveal delay={0.12} className="rounded-2xl border border-border bg-card p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase 2 · Direct link
          </span>
          <div className="mt-8 flex items-center gap-3">
            <Node label="You" active />
            <Wire success>
              <CrossedServer />
              <Packet color="bg-success" delay={0} success />
              <Packet color="bg-success" delay={0.7} success reverse />
              <Packet color="bg-success" delay={1.4} success />
            </Wire>
            <Node label="Peer" active />
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Chat, files and calls now flow straight between devices, end-to-end encrypted. The
            server carries none of it.
          </p>
        </Reveal>
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
    <div className="flex shrink-0 flex-col items-center gap-1">
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={
          "grid h-12 w-12 place-items-center rounded-xl border " +
          (active
            ? "border-success/40 bg-success/10 text-success"
            : "border-border bg-secondary text-foreground")
        }
      >
        <Smartphone className="h-5 w-5" />
      </motion.span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// The connecting "wire": a track with a flowing gradient sheen + animated packets.
function Wire({ children, success }: { children: React.ReactNode; success?: boolean }) {
  return (
    <div className="relative h-12 flex-1">
      <div
        className={
          "absolute top-1/2 h-0.5 w-full -translate-y-1/2 overflow-hidden rounded-full " +
          (success ? "bg-success/20" : "bg-border")
        }
      >
        <motion.div
          className={
            "h-full w-1/3 rounded-full " +
            (success
              ? "bg-linear-to-r from-transparent via-success to-transparent"
              : "bg-linear-to-r from-transparent via-primary to-transparent")
          }
          initial={{ x: "-120%" }}
          animate={{ x: "360%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {children}
    </div>
  )
}

function Packet({
  color,
  delay,
  reverse,
  success,
}: {
  color: string
  delay: number
  reverse?: boolean
  success?: boolean
}) {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${color} ${
        success ? "shadow-[0_0_8px_var(--success)]" : "shadow-[0_0_8px_var(--primary)]"
      }`}
      initial={{ left: reverse ? "100%" : "0%", opacity: 0 }}
      animate={{ left: reverse ? "0%" : "100%", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay }}
    />
  )
}

// Phase 1: the server sits on the wire and pulses as it relays.
function CenterServer() {
  return (
    <motion.span
      className="absolute left-1/2 top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border border-primary/30 bg-card text-primary"
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <Server className="h-4 w-4" />
    </motion.span>
  )
}

// Phase 2: the server is faded and crossed out — out of the loop.
function CrossedServer() {
  return (
    <span className="absolute left-1/2 top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border border-border bg-card text-muted-foreground opacity-40">
      <Server className="h-4 w-4" />
      <X className="absolute -right-1 -top-1 h-3.5 w-3.5 text-destructive" />
    </span>
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
