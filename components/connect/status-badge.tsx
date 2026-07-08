import type { PeerStatus } from "@/hooks/use-peer"
import { cn } from "@/lib/utils"

const MAP: Record<PeerStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "Idle", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  waiting: { label: "Waiting for peer", dot: "bg-warning animate-pulse", text: "text-muted-foreground" },
  connecting: { label: "Connecting", dot: "bg-warning animate-pulse", text: "text-muted-foreground" },
  connected: { label: "Direct & encrypted", dot: "bg-success", text: "text-success" },
  disconnected: { label: "Disconnected", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  failed: { label: "Connection failed", dot: "bg-destructive", text: "text-destructive" },
  full: { label: "Code already in use", dot: "bg-destructive", text: "text-destructive" },
}

export function StatusBadge({ status }: { status: PeerStatus }) {
  const s = MAP[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
