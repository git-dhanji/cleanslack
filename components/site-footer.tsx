import Link from "next/link"
import { Brand } from "@/components/brand"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Brand href={null} />
          <p className="text-sm text-muted-foreground">
            Direct, private, peer-to-peer. No accounts, no stored data.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/connect" className="hover:text-foreground">Connect</Link>
          <Link href="/guide" className="hover:text-foreground">Guide</Link>
          <Link href="/tutorial" className="hover:text-foreground">Tutorial</Link>
        </nav>
      </div>
    </footer>
  )
}
