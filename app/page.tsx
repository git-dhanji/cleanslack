import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/landing/hero"
import { Steps } from "@/components/landing/steps"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Faq } from "@/components/landing/faq"
import { Cta } from "@/components/landing/cta"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Steps />
        <Features />
        <HowItWorks />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
