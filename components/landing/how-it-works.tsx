"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useInView, useReducedMotion } from "motion/react"
import { Check } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

// A narrated, looping explainer of the whole connection flow. Each beat
// advances automatically and updates the caption, so a viewer *watches the
// architecture happen* rather than seeing decorative motion.
const STEPS = [
  { t: "You create a private code", d: "No account — a code, generated or your own." },
  { t: "Your peer enters the same code", d: "Share it any way you like; they type it in." },
  { t: "The server introduces you", d: "It passes only the connection handshake between the two devices." },
  { t: "A direct, encrypted link opens", d: "The two devices connect straight to each other." },
  { t: "Everything flows directly", d: "Messages, files & calls — end-to-end, server out of the loop." },
]
const BEAT_MS = 2800

// Coordinates in the 400×210 viewBox.
const YOU = { x: 56, y: 135 }
const PEER = { x: 344, y: 135 }
const SRV = { x: 200, y: 52 }
const DIRECT = "M64 148 Q200 186 336 148" // downward arc that bypasses the server

export function HowItWorks() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduce) {
      setStep(4)
      return
    }
    if (!inView) return
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), BEAT_MS)
    return () => clearInterval(id)
  }, [inView, reduce])

  const youActive = step === 0 || step >= 3
  const peerActive = step >= 1
  const serverActive = step === 2
  const serverGone = step >= 3
  const linked = step >= 3
  const signalingOn = step === 2
  const directOn = step >= 3

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Watch how a connection works
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          The server only introduces the two of you. Then it steps away — and everything flows
          directly, device to device.
        </p>
      </Reveal>

      <Reveal delay={0.05} className="mx-auto mt-12 max-w-3xl">
        <div ref={ref} className="rounded-3xl border border-border bg-card p-4 sm:p-8">
          <svg viewBox="0 0 400 210" className="w-full" role="img" aria-label="Connection flow diagram">
            {/* --- signaling lines (You → Server → Peer) --- */}
            <motion.g
              animate={{ opacity: signalingOn ? 1 : serverGone ? 0.12 : 0.3 }}
              transition={{ duration: 0.5 }}
              stroke="var(--border)"
              strokeWidth={1.5}
            >
              <line x1={YOU.x} y1={YOU.y} x2={SRV.x} y2={SRV.y + 12} />
              <line x1={SRV.x} y1={SRV.y + 12} x2={PEER.x} y2={PEER.y} />
            </motion.g>

            {/* --- direct link (draws in on step 3) --- */}
            <motion.path
              d={DIRECT}
              fill="none"
              stroke="var(--success)"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: directOn ? 1 : 0, opacity: directOn ? 1 : 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />

            {/* --- handshake packets through the server (step 2) --- */}
            {serverActive && !reduce && (
              <>
                <Packet
                  from={YOU}
                  via={{ x: SRV.x, y: SRV.y + 8 }}
                  to={PEER}
                  color="var(--primary)"
                  delay={0}
                />
                <Packet
                  from={PEER}
                  via={{ x: SRV.x, y: SRV.y + 8 }}
                  to={YOU}
                  color="var(--primary)"
                  delay={0.8}
                />
              </>
            )}

            {/* --- data flowing directly (step 4) --- */}
            {step === 4 && !reduce && (
              <>
                <FlowDot path={DIRECT} color="var(--success)" delay={0} />
                <FlowDot path={DIRECT} color="var(--success)" delay={0.6} />
                <FlowDot path={DIRECT} color="var(--success)" delay={1.2} reverse />
              </>
            )}

            {/* --- nodes --- */}
            <Server cx={SRV.x} cy={SRV.y} active={serverActive} gone={serverGone} />
            <Device cx={YOU.x} cy={YOU.y} label="You" active={youActive} linked={linked} />
            <Device cx={PEER.x} cy={PEER.y} label="Peer" active={peerActive} linked={linked} />

            {/* lock on the direct link when encrypted */}
            {linked && (
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                transform={`translate(${(YOU.x + PEER.x) / 2 - 7}, 176)`}
              >
                <rect width="14" height="14" rx="3" fill="var(--success)" />
                <path d="M4 6 V4.5 a3 3 0 0 1 6 0 V6" fill="none" stroke="var(--card)" strokeWidth="1.3" />
                <circle cx="7" cy="9.5" r="1.4" fill="var(--card)" />
              </motion.g>
            )}
          </svg>

          {/* --- caption --- */}
          <div className="mt-4 min-h-16 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <p className="font-medium">
                  <span className="text-primary">{step + 1}.</span> {STEPS[step].t}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{STEPS[step].d}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* --- auto progress (fills over each beat, no clicking) --- */}
          <div className="mx-auto mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-border">
            <motion.div
              key={step}
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: reduce ? 0 : BEAT_MS / 1000, ease: "linear" }}
            />
          </div>
        </div>
      </Reveal>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        <Fact ok label="Handshake is relayed briefly" />
        <Fact ok label="Messages stay between devices" />
        <Fact label="No message ever stored on the server" />
        <Fact label="No account, no identity collected" />
      </div>
    </section>
  )
}

function Device({
  cx,
  cy,
  label,
  active,
  linked,
}: {
  cx: number
  cy: number
  label: string
  active?: boolean
  linked?: boolean
}) {
  const color = linked ? "var(--success)" : active ? "var(--primary)" : "var(--muted-foreground)"
  return (
    <g>
      {active && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={26}
          fill="none"
          stroke={color}
          strokeWidth={1}
          initial={{ opacity: 0.6, r: 20 }}
          animate={{ opacity: 0, r: 32 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.rect
        x={cx - 12}
        y={cy - 18}
        width={24}
        height={36}
        rx={5}
        fill="var(--card)"
        stroke={color}
        strokeWidth={2}
        animate={{ stroke: color }}
        transition={{ duration: 0.4 }}
      />
      <line x1={cx - 5} y1={cy + 12} x2={cx + 5} y2={cy + 12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <text x={cx} y={cy + 34} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
        {label}
      </text>
    </g>
  )
}

function Server({ cx, cy, active, gone }: { cx: number; cy: number; active?: boolean; gone?: boolean }) {
  const color = gone ? "var(--muted-foreground)" : active ? "var(--primary)" : "var(--muted-foreground)"
  return (
    <motion.g animate={{ opacity: gone ? 0.35 : 1 }} transition={{ duration: 0.5 }}>
      <motion.g
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.4, repeat: active ? Infinity : 0 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <rect x={cx - 16} y={cy - 12} width={32} height={11} rx={3} fill="var(--card)" stroke={color} strokeWidth={1.8} />
        <rect x={cx - 16} y={cy + 2} width={32} height={11} rx={3} fill="var(--card)" stroke={color} strokeWidth={1.8} />
        <circle cx={cx - 10} cy={cy - 6.5} r={1.3} fill={color} />
        <circle cx={cx - 10} cy={cy + 7.5} r={1.3} fill={color} />
      </motion.g>
      <text x={cx} y={cy - 18} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
        server
      </text>
      {gone && (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <line x1={cx + 10} y1={cy - 16} x2={cx + 20} y2={cy - 6} stroke="var(--destructive)" strokeWidth={2} strokeLinecap="round" />
          <line x1={cx + 20} y1={cy - 16} x2={cx + 10} y2={cy - 6} stroke="var(--destructive)" strokeWidth={2} strokeLinecap="round" />
        </motion.g>
      )}
    </motion.g>
  )
}

// A packet that hops from → via → to (used for the server relay handshake).
function Packet({
  from,
  via,
  to,
  color,
  delay,
}: {
  from: { x: number; y: number }
  via: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  delay: number
}) {
  return (
    <motion.circle
      r={3.5}
      fill={color}
      initial={{ cx: from.x, cy: from.y, opacity: 0 }}
      animate={{ cx: [from.x, via.x, to.x], cy: [from.y, via.y, to.y], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}

// A dot that rides along the direct SVG path via CSS offset-path.
function FlowDot({ path, color, delay, reverse }: { path: string; color: string; delay: number; reverse?: boolean }) {
  return (
    <motion.circle
      r={3.5}
      fill={color}
      style={{ offsetPath: `path("${path}")` }}
      initial={{ offsetDistance: reverse ? "100%" : "0%", opacity: 0 }}
      animate={{ offsetDistance: reverse ? "0%" : "100%", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay }}
    />
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
