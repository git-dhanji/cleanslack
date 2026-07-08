import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="text-muted-foreground">Landing page coming next.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
