import {
  Navbar,
  Hero,
  Features,
  ServicesShowcase,
  Benefits,
  Pricing,
  Testimonials,
  CTA,
  Footer,
} from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { getLandingPricingSectionWithFallback } from '@/lib/pricing-plans-server'

export default async function Home() {
  const pricingData = await getLandingPricingSectionWithFallback()

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <Navbar />
      <Hero />
      <Features />
      <ServicesShowcase />
      <Benefits />
      <Pricing data={pricingData} />
      <Testimonials />
      <CTA />
      <Footer />
      <MobileSafeAreaSpacer />
      <BottomNav />
    </main>
  )
}
