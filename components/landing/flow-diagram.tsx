"use client"

import { useRef, useState } from "react"
import {
  motion,
  useTime,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  useInView,
  AnimatePresence,
  type MotionValue,
} from "motion/react"

// A single, self-contained explainer of the whole connection, in the spirit of
// Clerk's diagrams: glowing nodes, light flowing along the wires, one clean
// 3-second loop that plays automatically and forever.
//
// One driver (`p`, a 0→1 sawtooth over 3s) sequences everything, so every node,
// line and pulse stays perfectly in sync.

const DUR = 3000

// Geometry (viewBox 0 0 480 230)
const SIG = "M76 116 C 120 74, 170 72, 240 72 C 310 72, 360 74, 404 116"
const DIRECT = "M98 156 C 180 205, 300 205, 382 156"
const YOU = { x: 76, y: 148 }
const PEER = { x: 404, y: 148 }
const SRV = { x: 240, y: 52 }

const PHASES = ["Introducing the two devices", "Opening a direct link", "Flowing directly — encrypted"]

// The animated version runs a continuous rAF loop, so we only ever mount it
// while the diagram is on screen — off-screen it falls back to the static
// picture, which keeps scrolling smooth everywhere else on the page.
export function FlowDiagram() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "200px 0px" })

  return (
    <div ref={ref}>
      {reduce || !inView ? <StaticDiagram /> : <AnimatedDiagram />}
    </div>
  )
}

function AnimatedDiagram() {
  const time = useTime()
  const p = useTransform(time, (t) => (t % DUR) / DUR)
  const [phase, setPhase] = useState(0)

  useMotionValueEvent(p, "change", (v) => {
    const ph = v < 0.46 ? 0 : v < 0.58 ? 1 : 2
    setPhase((prev) => (prev === ph ? prev : ph))
  })

  return (
    <div className="mx-auto w-full max-w-3xl">
      <svg viewBox="0 0 480 230" className="w-full" role="img" aria-label="How a Wisp connection works">
        <defs>
          <radialGradient id="glowP" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowS" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- wires --- */}
        <path d={SIG} fill="none" stroke="var(--border)" strokeWidth={1.5} />
        <DirectWire p={p} />

        {/* --- signaling light (You → server → Peer) --- */}
        <Pulse p={p} path={SIG} range={[0.08, 0.42]} color="var(--primary)" />
        <Pulse p={p} path={SIG} range={[0.16, 0.5]} color="var(--primary)" reverse />

        {/* --- direct link: forming trace + continuous flow --- */}
        <Pulse p={p} path={DIRECT} range={[0.44, 0.6]} color="var(--success)" />
        <Pulse p={p} path={DIRECT} range={[0.6, 0.86]} color="var(--success)" />
        <Pulse p={p} path={DIRECT} range={[0.72, 0.98]} color="var(--success)" reverse />

        {/* --- server --- */}
        <ServerNode p={p} />

        {/* --- devices --- */}
        <DeviceNode p={p} x={YOU.x} y={YOU.y} label="You" earlyAt={0.04} />
        <DeviceNode p={p} x={PEER.x} y={PEER.y} label="Peer" earlyAt={0.16} />

        {/* --- lock on the encrypted link --- */}
        <Lock p={p} />
      </svg>

      {/* live phase label */}
      <div className="mt-3 h-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            {PHASES[phase]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

// A glowing light segment that travels along a path during [start,end] of the
// loop — the "light flowing down a wire" look, done with stroke-dash so it works
// on every modern browser (no offset-path needed).
function Pulse({
  p,
  path,
  range,
  color,
  reverse,
}: {
  p: MotionValue<number>
  path: string
  range: [number, number]
  color: string
  reverse?: boolean
}) {
  const [a, b] = range
  // dasharray "8 92" over pathLength 100 = one short lit segment; moving the
  // dash offset 0→92 slides it from start to end (reverse = end to start).
  const strokeDashoffset = useTransform(p, [a, b], reverse ? [92, 0] : [0, 92], { clamp: true })
  const opacity = useTransform(p, [a, a + 0.02, b - 0.03, b], [0, 1, 1, 0], { clamp: true })
  return (
    <motion.path
      d={path}
      pathLength={100}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeDasharray="8 92"
      style={{ strokeDashoffset, opacity, filter: `drop-shadow(0 0 3px ${color})` }}
    />
  )
}

// Direct wire fades in as the link forms.
function DirectWire({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.42, 0.56], [0, 1], { clamp: true })
  return <motion.path d={DIRECT} fill="none" stroke="var(--success)" strokeWidth={1.5} strokeOpacity={0.5} style={{ opacity }} />
}

function DeviceNode({
  p,
  x,
  y,
  label,
  earlyAt,
}: {
  p: MotionValue<number>
  x: number
  y: number
  label: string
  earlyAt: number
}) {
  // primary glow while being introduced; success glow once linked
  const glowP = useTransform(p, [earlyAt, earlyAt + 0.04, 0.42, 0.5], [0, 1, 1, 0], { clamp: true })
  const glowS = useTransform(p, [0.5, 0.58, 1], [0, 1, 1], { clamp: true })
  return (
    <g>
      <motion.circle cx={x} cy={y} r={40} fill="url(#glowP)" style={{ opacity: glowP }} />
      <motion.circle cx={x} cy={y} r={40} fill="url(#glowS)" style={{ opacity: glowS }} />
      <rect x={x - 22} y={y - 32} width={44} height={64} rx={11} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
      <rect x={x - 15} y={y - 24} width={30} height={40} rx={4} fill="var(--secondary)" />
      <circle cx={x} cy={y + 23} r={2.4} fill="var(--muted-foreground)" />
      <text x={x} y={y + 50} textAnchor="middle" className="fill-muted-foreground" fontSize="12" fontWeight="500">
        {label}
      </text>
    </g>
  )
}

function ServerNode({ p }: { p: MotionValue<number> }) {
  const glow = useTransform(p, [0.06, 0.14, 0.42, 0.5], [0, 1, 1, 0], { clamp: true })
  const dim = useTransform(p, [0.48, 0.58], [1, 0.3], { clamp: true })
  const cross = useTransform(p, [0.5, 0.6], [0, 1], { clamp: true })
  const { x, y } = SRV
  return (
    <g>
      <motion.circle cx={x} cy={y} r={44} fill="url(#glowP)" style={{ opacity: glow }} />
      <motion.g style={{ opacity: dim }}>
        <rect x={x - 44} y={y - 20} width={88} height={40} rx={11} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
        <rect x={x - 34} y={y - 11} width={68} height={7} rx={3.5} fill="var(--secondary)" />
        <rect x={x - 34} y={y + 3} width={68} height={7} rx={3.5} fill="var(--secondary)" />
        <circle cx={x + 26} cy={y - 7.5} r={2} fill="var(--primary)" />
        <circle cx={x + 26} cy={y + 6.5} r={2} fill="var(--success)" />
        <text x={x} y={y - 26} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          signaling server
        </text>
      </motion.g>
      <motion.g style={{ opacity: cross }}>
        <line x1={x + 34} y1={y - 22} x2={x + 48} y2={y - 8} stroke="var(--destructive)" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={x + 48} y1={y - 22} x2={x + 34} y2={y - 8} stroke="var(--destructive)" strokeWidth={2.5} strokeLinecap="round" />
      </motion.g>
    </g>
  )
}

function Lock({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.56, 0.64], [0, 1], { clamp: true })
  const cx = (YOU.x + PEER.x) / 2
  const cy = 196
  return (
    <motion.g style={{ opacity }}>
      <circle cx={cx} cy={cy} r={11} fill="var(--success)" />
      <path d={`M${cx - 3.5} ${cy - 1} V${cy - 2.5} a3.5 3.5 0 0 1 7 0 V${cy - 1}`} fill="none" stroke="var(--card)" strokeWidth={1.4} />
      <rect x={cx - 4.5} y={cy - 1} width={9} height={7} rx={1.5} fill="var(--card)" />
    </motion.g>
  )
}

// Static fallback (reduced motion): the final "connected" state.
function StaticDiagram() {
  const { x: sx, y: sy } = SRV
  return (
    <div className="mx-auto w-full max-w-3xl">
      <svg viewBox="0 0 480 230" className="w-full" role="img" aria-label="A direct, encrypted connection between two devices">
        <path d={DIRECT} fill="none" stroke="var(--success)" strokeWidth={2} />
        <g opacity={0.3}>
          <path d={SIG} fill="none" stroke="var(--border)" strokeWidth={1.5} />
          <rect x={sx - 44} y={sy - 20} width={88} height={40} rx={11} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
          <line x1={sx + 34} y1={sy - 22} x2={sx + 48} y2={sy - 8} stroke="var(--destructive)" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={sx + 48} y1={sy - 22} x2={sx + 34} y2={sy - 8} stroke="var(--destructive)" strokeWidth={2.5} strokeLinecap="round" />
        </g>
        {[YOU, PEER].map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={34} fill="var(--success)" fillOpacity={0.12} />
            <rect x={n.x - 22} y={n.y - 32} width={44} height={64} rx={11} fill="var(--card)" stroke="var(--success)" strokeWidth={1.5} />
            <rect x={n.x - 15} y={n.y - 24} width={30} height={40} rx={4} fill="var(--secondary)" />
          </g>
        ))}
      </svg>
    </div>
  )
}
