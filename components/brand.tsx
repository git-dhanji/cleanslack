import Link from "next/link"
import { cn } from "@/lib/utils"

/** The Wisp wordmark + mark. Minimal: two linked nodes. */
export function Brand({ className, href = "/" }: { className?: string; href?: string | null }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <LinkMark className="h-4 w-4" />
      </span>
      <span className="text-lg">Wisp</span>
    </span>
  )
  if (href === null) return inner
  return <Link href={href}>{inner}</Link>
}

export function LinkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="6" cy="12" r="2.4" fill="currentColor" />
      <circle cx="18" cy="12" r="2.4" fill="currentColor" />
      <path
        d="M8.4 12h7.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="link-mark-line"
      />
    </svg>
  )
}
