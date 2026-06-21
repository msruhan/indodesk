'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { canAccessTopupService } from '@/lib/platform-settings-shared'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { Zap } from '@/lib/icons'

export function TopupAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const loading = authLoading || flagsLoading
  const allowed = canAccessTopupService(role, flags)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <p className="text-sm text-surface-500">Memeriksa akses…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-surface-50">
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <section className="relative flex min-h-[60vh] items-center justify-center px-4 lg:pt-28">
          <div className="max-w-md rounded-2xl border border-surface-200/70 bg-white/90 p-8 text-center shadow-soft-md backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Layanan Top Up tidak tersedia</h2>
            <p className="mt-2 text-sm text-surface-600">
              Menu top up game sedang dinonaktifkan oleh admin. Silakan cek kembali nanti.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button variant="primary" size="sm" onClick={() => router.push('/')}>
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </section>
        <MobileSafeAreaSpacer />
        <BottomNav />
      </div>
    )
  }

  return children
}
