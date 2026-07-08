import { Reveal } from "@/components/motion/reveal"
import { FlowDiagram } from "./flow-diagram"

export function FlowSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          The server introduces you, then disappears
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          It passes a brief handshake between the two devices — then steps out, and everything flows
          straight between you, end-to-end encrypted.
        </p>
      </Reveal>

      <Reveal delay={0.05} className="mt-10">
        <FlowDiagram />
      </Reveal>
    </section>
  )
}
