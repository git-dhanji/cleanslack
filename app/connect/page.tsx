import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { ConnectPanel } from "@/components/connect/connect-panel"

export const metadata = {
  title: "Connect — Peerlink",
}

export default function ConnectPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="text-center text-muted-foreground">Loading…</div>}>
          <ConnectPanel />
        </Suspense>
      </main>
    </div>
  )
}
