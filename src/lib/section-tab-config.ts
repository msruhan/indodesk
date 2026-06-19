import {
  ShoppingBag,
  Zap,
  Smartphone,
  Users,
  Laptop,
  Shield,
  Store,
  Briefcase,
  CheckSquare,
} from '@/lib/icons'
import type { SectionTab } from '@/components/mobile/section-tabs'
import type { PublicFeatureFlags } from '@/lib/platform-settings-shared'
import {
  canAccessImeiService,
  canAccessRemoteService,
  canAccessInspectionService,
  canAccessCariTeknisi,
  canAccessRekberService,
} from '@/lib/platform-settings-shared'

const IMEI_TAB: SectionTab = {
  href: '/imei',
  label: 'Digital',
  icon: Smartphone,
  matchPrefixes: ['/imei'],
}

const REMOTE_TAB: SectionTab = {
  href: '/remote',
  label: 'IndoDesk',
  icon: Laptop,
  matchPrefixes: ['/remote'],
}

const INSPEKSI_TAB: SectionTab = {
  href: '/inspeksi',
  label: 'Inspeksi',
  icon: CheckSquare,
  matchPrefixes: ['/inspeksi'],
}

/** Marketplace group: Shop ↔ Top Up ↔ (IMEI bila role & flag mengizinkan) */
export const marketplaceTabs: SectionTab[] = [
  { href: '/shop', label: 'Shop', icon: ShoppingBag, matchPrefixes: ['/shop', '/marketplace'] },
  { href: '/topup', label: 'Top Up', icon: Zap, matchPrefixes: ['/topup'] },
  IMEI_TAB,
]

/**
 * Versi marketplaceTabs yang menghormati role + feature flag.
 * Pakai ini di komponen client agar tab "Layanan" hanya muncul untuk
 * ADMIN/TEKNISI ketika `imeiServiceEnabled` aktif.
 */
export function buildMarketplaceTabs(
  role: 'ADMIN' | 'TEKNISI' | 'USER' | null | undefined,
  flags: PublicFeatureFlags,
): SectionTab[] {
  const base: SectionTab[] = [
    {
      href: '/shop',
      label: 'Shop',
      icon: ShoppingBag,
      matchPrefixes: ['/shop', '/marketplace'],
    },
    { href: '/topup', label: 'Top Up', icon: Zap, matchPrefixes: ['/topup'] },
  ]
  if (canAccessImeiService(role, flags)) base.push(IMEI_TAB)
  return base
}

/** Service group: Teknisi ↔ Remote ↔ Rekber ↔ Inspeksi */
export const serviceTabs: SectionTab[] = [
  { href: '/teknisi', label: 'Teknisi', icon: Users },
  REMOTE_TAB,
  { href: '/rekber', label: 'Rekber', icon: Shield, matchPrefixes: ['/rekber'] },
  INSPEKSI_TAB,
]

/**
 * Versi serviceTabs yang menghormati feature flag Remote & Inspeksi.
 * ADMIN selalu melihat semua tab; role lain mengikuti toggle admin.
 */
export function buildServiceTabs(
  role: 'ADMIN' | 'TEKNISI' | 'USER' | null | undefined,
  flags: PublicFeatureFlags,
): SectionTab[] {
  const tabs: SectionTab[] = []
  if (canAccessCariTeknisi(role, flags)) {
    tabs.push({ href: '/teknisi', label: 'Teknisi', icon: Users })
  }
  if (canAccessRemoteService(role, flags)) tabs.push(REMOTE_TAB)
  if (canAccessRekberService(role, flags)) {
    tabs.push({
      href: '/rekber',
      label: 'Rekber',
      icon: Shield,
      matchPrefixes: ['/rekber'],
    })
  }
  if (canAccessInspectionService(role, flags)) tabs.push(INSPEKSI_TAB)
  return tabs
}

/** Mitra group: Toko ↔ Lowongan */
export const mitraTabs: SectionTab[] = [
  { href: '/toko', label: 'Toko', icon: Store, matchPrefixes: ['/toko'] },
  { href: '/lowongan', label: 'Lowongan', icon: Briefcase, matchPrefixes: ['/lowongan'] },
]
