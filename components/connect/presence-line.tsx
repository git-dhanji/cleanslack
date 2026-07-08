import type { PeerActivity, PeerStatus } from "@/hooks/use-peer"
import { StatusBadge } from "./status-badge"

// WhatsApp-style header line: shows "typing…" or "online" once connected,
// and falls back to the connection status otherwise.
export function PresenceLine({ status, activity }: { status: PeerStatus; activity: PeerActivity }) {
  if (status !== "connected") return <StatusBadge status={status} />

  if (activity === "typing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-primary">
        <span className="inline-flex gap-0.5">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
        typing…
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      online
    </span>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  )
}
