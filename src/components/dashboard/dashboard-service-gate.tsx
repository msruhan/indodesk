'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import type { PublicFeatureFlags } from '@/lib/platform-settings-shared'
import { DashboardPageHeader } from '@/components/dashboard'
import { Button } from '@/components/ui/button'

type Role = 'ADMIN' | 'TEKNISI' | 'USER' | null | undefined

type DashboardServiceGateProps = {
  canAccess: (role: Role, flags: PublicFeatureFlags) => boolean
  title: string
  description: string
  dashboardHref: string
  children: ReactNode
}

export function DashboardServiceGate({
  canAccess,
  title,
  description,
  dashboardHref,
  children,
}: DashboardServiceGateProps) {
  const { user, isLoading: authLoading } = useAuth()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const loading = authLoading || flagsLoading
  const allowed = canAccess(role, flags)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-surface-500">Memeriksa akses…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title={title} />
        <div className="rounded-2xl border border-surface-200/70 bg-white/80 p-8 text-center">
          <h2 className="text-lg font-semibold text-ink">Layanan tidak tersedia</h2>
          <p className="mt-2 text-sm text-surface-600">{description}</p>
          <Button asChild variant="primary" size="sm" className="mt-5">
            <Link href={dashboardHref}>Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return children
}
