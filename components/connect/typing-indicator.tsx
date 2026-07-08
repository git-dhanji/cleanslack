import type { PeerActivity } from "@/hooks/use-peer"

// Shows what the other person is doing in their composer:
//  - typing  → animated dots + "typing"
//  - present → a steady dot + "is here" (focused on the box but not writing)
//  - idle    → nothing (space is reserved to avoid layout shift)
export function TypingIndicator({ activity }: { activity: PeerActivity }) {
  return (
    <div className="flex h-4 items-center px-1 text-xs text-muted-foreground">
      {activity === "typing" && (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex gap-0.5">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
          typing
        </span>
      )}
      {activity === "present" && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          is here · not typing
        </span>
      )}
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  )
}
