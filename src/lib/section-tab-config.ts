import { ShoppingBag, Zap, Smartphone, Users, Laptop, Shield, Store, Briefcase } from '@/lib/icons'
import type { SectionTab } from '@/components/mobile/section-tabs'

/** Marketplace group: Shop ↔ Top Up ↔ IMEI */
export const marketplaceTabs: SectionTab[] = [
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag, matchPrefixes: ['/marketplace'] },
  { href: '/topup', label: 'Top Up', icon: Zap, matchPrefixes: ['/topup'] },
  { href: '/imei', label: 'Layanan', icon: Smartphone, matchPrefixes: ['/imei'] },
]

/** Service group: Teknisi ↔ Remote ↔ Rekber */
export const serviceTabs: SectionTab[] = [
  { href: '/teknisi', label: 'Teknisi', icon: Users },
  { href: '/remote', label: 'Remote', icon: Laptop, matchPrefixes: ['/remote'] },
  { href: '/rekber', label: 'Rekber', icon: Shield, matchPrefixes: ['/rekber'] },
]

/** Mitra group: Toko ↔ Lowongan */
export const mitraTabs: SectionTab[] = [
  { href: '/toko', label: 'Toko', icon: Store, matchPrefixes: ['/toko'] },
  { href: '/lowongan', label: 'Lowongan', icon: Briefcase, matchPrefixes: ['/lowongan'] },
]
