import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{intro}</p>
          <div className="mt-12">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-2xl font-semibold tracking-tight">{children}</h2>
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
}
