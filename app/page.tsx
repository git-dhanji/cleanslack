import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/landing/hero"
import { FlowSection } from "@/components/landing/flow-section"
import { CreateUse } from "@/components/landing/create-use"
import { Features } from "@/components/landing/features"
import { Faq } from "@/components/landing/faq"
import { Cta } from "@/components/landing/cta"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FlowSection />
        <CreateUse />
        <Features />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
