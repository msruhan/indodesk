import { Package, MessageCircle, Shield } from '@/lib/icons'
import type { SectionTab } from '@/components/mobile/section-tabs'
import {
  canAccessKonsultasiService,
  canAccessRekberService,
  type PublicFeatureFlags,
} from '@/lib/platform-settings-shared'

export const TEKNISI_LAYANAN_BOTTOM_NAV_HREF = '/teknisi/pesanan'

const LAYANAN_PREFIXES = ['/teknisi/pesanan', '/teknisi/konsultasi', '/teknisi/rekber'] as const

export function isTeknisiLayananZone(pathname: string | null): boolean {
  if (!pathname) return false
  return LAYANAN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function getTeknisiLayananSectionTabs(flags: PublicFeatureFlags): SectionTab[] {
  const tabs: SectionTab[] = [
    {
      href: '/teknisi/pesanan',
      label: 'Pesanan Masuk',
      icon: Package,
      matchPrefixes: ['/teknisi/pesanan'],
    },
  ]

  if (canAccessKonsultasiService('TEKNISI', flags)) {
    tabs.push({
      href: '/teknisi/konsultasi',
      label: 'Konsultasi',
      icon: MessageCircle,
      matchPrefixes: ['/teknisi/konsultasi'],
    })
  }

  if (canAccessRekberService('TEKNISI', flags)) {
    tabs.push({
      href: '/teknisi/rekber',
      label: 'Transaksi Aman',
      icon: Shield,
      matchPrefixes: ['/teknisi/rekber'],
    })
  }

  return tabs
}

export function getTeknisiLayananActivePrefixes(flags: PublicFeatureFlags): string[] {
  return getTeknisiLayananSectionTabs(flags).flatMap((tab) => tab.matchPrefixes ?? [tab.href])
}
