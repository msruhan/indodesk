'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { buildServiceTabs } from '@/lib/section-tab-config'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { canAccessRekberService } from '@/lib/platform-settings-shared'
import { PageHero } from '@/components/shared/page-hero'
import { Shield, Plus } from '@/lib/icons'
import { RekberCreateForm } from '@/components/rekber/rekber-create-form'
import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { useRekberList } from '@/hooks/use-rekber-list'

export default function RekberPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { user, isLoading: authLoading } = useAuth()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const allowed = canAccessRekberService(role, flags)
  const guardLoading = authLoading || flagsLoading
  const tabs = buildServiceTabs(role, flags)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const isAuthed = sessionStatus === 'authenticated'
  const { items, stats, loading, error, actingId, load, userAction } = useRekberList(
    '/api/rekber',
    isAuthed,
  )

  if (guardLoading) {
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Layanan Transaksi Aman tidak tersedia</h2>
            <p className="mt-2 text-sm text-surface-600">
              Menu Transaksi Aman sedang dinonaktifkan oleh admin. Silakan cek kembali nanti.
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs, layoutId: 'service-section-tab' }}
        badge={{ icon: Shield, label: 'Transaksi Aman' }}
        title={
          <>
            Transaksi aman
            <span className="block">
              <span className="gradient-text-static">& transparan</span>.
            </span>
          </>
        }
        description="Escrow untuk transaksi di luar marketplace — antar member atau deal custom dengan teknisi. Dana ditahan sampai barang/layanan diterima."
        right={
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-primary-600 to-accent-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Transaksi Aman
          </Button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        {showCreateForm && (
          <RekberCreateForm
            onSuccess={() => {
              setShowCreateForm(false)
              if (isAuthed) void load()
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <Card className="mb-6 border-primary-200 bg-gradient-to-r from-primary-50 to-accent-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 h-8 w-8 shrink-0 text-primary-600" />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Bagaimana Transaksi Aman Bekerja?</h3>
                <ul className="space-y-1 text-sm text-surface-700">
                  <li>1. Pembeli buat transaksi aman — pilih penjual (member via email atau teknisi terdaftar)</li>
                  <li>2. Pembeli membayar — dana ditahan di escrow</li>
                  <li>3. Penjual mengirim barang / menyelesaikan layanan</li>
                  <li>4. Pembeli konfirmasi penerimaan — dana dilepas ke penjual</li>
                  <li>5. Jika ada sengketa, admin dapat memediasi (release atau refund)</li>
                </ul>
                <p className="mt-3 text-xs text-surface-600">
                  Produk resmi dari toko teknisi? Beli lewat{' '}
                  <a href="/marketplace" className="font-semibold text-primary-700 underline underline-offset-2">
                    Marketplace
                  </a>{' '}
                  — checkout sudah pakai escrow otomatis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!isAuthed && sessionStatus !== 'loading' ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-surface-300" />
              <p className="text-sm text-surface-600">
                Masuk untuk melihat dan mengelola transaksi aman Anda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <RekberTransactionList
            items={items}
            stats={stats}
            loading={loading || sessionStatus === 'loading'}
            actingId={actingId}
            onRefresh={() => void load()}
            onUserAction={userAction}
          />
        )}
      </main>
      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
