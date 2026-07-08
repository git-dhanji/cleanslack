"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/guide", label: "Guide" },
  { href: "/tutorial", label: "Tutorial" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground",
                  pathname === item.href && "text-foreground",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1">
            <Link href="/connect">Start</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
