import type { PeerStatus } from "@/hooks/use-peer"
import { cn } from "@/lib/utils"

const MAP: Record<PeerStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "Idle", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  waiting: { label: "Waiting for peer", dot: "bg-chart-4 animate-pulse", text: "text-muted-foreground" },
  connecting: { label: "Connecting", dot: "bg-chart-4 animate-pulse", text: "text-muted-foreground" },
  connected: { label: "Connected · direct & encrypted", dot: "bg-success", text: "text-success" },
  disconnected: { label: "Disconnected", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  failed: { label: "Connection failed", dot: "bg-destructive", text: "text-destructive" },
  full: { label: "Code already in use", dot: "bg-destructive", text: "text-destructive" },
}

export function StatusBadge({ status }: { status: PeerStatus }) {
  const s = MAP[status]
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", s.text)}>
      <span className={cn("h-2 w-2 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
