import { Suspense } from "react"
import { ConnectPanel } from "@/components/connect/connect-panel"

export const metadata = {
  title: "Connect — Wisp",
  // Invite links carry a connection code in the URL — keep them out of search indexes.
  robots: { index: false, follow: false },
}

export default function ConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center text-muted-foreground">Loading…</div>
      }
    >
      <ConnectPanel />
    </Suspense>
  )
}
