'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { BrandLogo } from '@/components/brand/brand-logo'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import {
  canAccessCariTeknisi,
  canAccessInspectionService,
  canAccessRekberService,
} from '@/lib/platform-settings-shared'
import { homePathForRole } from '@/lib/role-routes'
import { LEGAL_FOOTER_LINKS } from '@/lib/legal-content'
import type { UserRole } from '@prisma/client'

type FooterLink = {
  label: string
  href: string
  requireCariTeknisi?: boolean
  requireInspection?: boolean
  requireRekber?: boolean
}

const EXPLORE_LINKS: FooterLink[] = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Top Up', href: '/topup' },
  { label: 'Cari Teknisi', href: '/teknisi', requireCariTeknisi: true },
  { label: 'Inspeksi HP', href: '/inspeksi', requireInspection: true },
  { label: 'Transaksi Aman', href: '/rekber', requireRekber: true },
]

const MITRA_LINKS: FooterLink[] = [
  { label: 'Direktori Toko', href: '/toko' },
  { label: 'Karir', href: '/lowongan' },
  { label: 'Daftar Teknisi', href: '/register/teknisi' },
]

function helpPathForRole(role: UserRole | null): string {
  if (role === 'ADMIN') return '/admin/help/preview'
  if (role === 'TEKNISI') return '/teknisi/bantuan'
  if (role === 'USER') return '/user/bantuan'
  return '/login?callbackUrl=/user/bantuan'
}

function filterLinks(
  links: FooterLink[],
  gates: { canSeeCariTeknisi: boolean; canSeeInspection: boolean; canSeeRekber: boolean },
) {
  return links.filter((link) => {
    if (link.requireCariTeknisi && !gates.canSeeCariTeknisi) return false
    if (link.requireInspection && !gates.canSeeInspection) return false
    if (link.requireRekber && !gates.canSeeRekber) return false
    return true
  })
}

export function Footer() {
  const { user } = useAuth()
  const { flags } = useFeatureFlags()
  const role = (user?.role as UserRole | undefined) ?? null

  const gates = useMemo(
    () => ({
      canSeeCariTeknisi: canAccessCariTeknisi(role, flags),
      canSeeInspection: canAccessInspectionService(role, flags),
      canSeeRekber: canAccessRekberService(role, flags),
    }),
    [role, flags],
  )

  const exploreLinks = useMemo(() => filterLinks(EXPLORE_LINKS, gates), [gates])

  const bottomLinks = useMemo(() => {
    if (user && role) {
      return [
        { label: 'Dashboard', href: homePathForRole(role) },
        { label: 'Bantuan', href: helpPathForRole(role) },
      ]
    }
    return [
      { label: 'Masuk', href: '/login' },
      { label: 'Daftar', href: '/register' },
    ]
  }, [user, role])

  return (
    <footer className="relative overflow-hidden border-t border-surface-200/70 bg-gradient-to-b from-white to-surface-50/60">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex">
              <BrandLogo variant="wordmark" wordmarkClassName="h-9 sm:h-10" />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-surface-600">
              Ekosistem teknisi handphone — jual, beli, konsultasi, transaksi aman.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-500">
              Eksplor
            </h3>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-surface-600 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-500">
              Mitra
            </h3>
            <ul className="space-y-2">
              {MITRA_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-surface-600 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-500">
              Legal
            </h3>
            <ul className="space-y-2">
              {LEGAL_FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-surface-600 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-surface-200/70 pt-6 sm:flex-row">
          <p className="text-xs text-surface-500">© {new Date().getFullYear()} Bantoo</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-surface-500 sm:justify-end">
            <Link href="/#pricing" className="transition-colors hover:text-ink">
              Pricing
            </Link>
            {bottomLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
