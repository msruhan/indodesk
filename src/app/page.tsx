import { 
  Navbar, 
  Hero, 
  Features, 
  ServicesShowcase,
  Benefits, 
  Pricing, 
  Testimonials, 
  CTA, 
  Footer 
} from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'

export default function Home() {
  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <Navbar />
      <Hero />
      <Features />
      <ServicesShowcase />
      <Benefits />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
      <MobileSafeAreaSpacer />
      <BottomNav />
    </main>
  )
}
