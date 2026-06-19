'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { buildServiceTabs } from '@/lib/section-tab-config'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { PageHero } from '@/components/shared/page-hero'
import { Shield, Plus } from '@/lib/icons'
import { RekberCreateForm } from '@/components/rekber/rekber-create-form'
import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { useRekberList } from '@/hooks/use-rekber-list'

export default function RekberPage() {
  const { data: session, status: sessionStatus } = useSession()
  const { flags } = useFeatureFlags()
  const tabs = buildServiceTabs(
    (session?.user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null,
    flags,
  )
  const [showCreateForm, setShowCreateForm] = useState(false)
  const isAuthed = sessionStatus === 'authenticated'
  const { items, stats, loading, error, actingId, load, userAction } = useRekberList(
    '/api/rekber',
    isAuthed,
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs, layoutId: 'service-section-tab' }}
        badge={{ icon: Shield, label: 'Rekber (Escrow)' }}
        title={
          <>
            Jasa rekber untuk transaksi,
            <span className="block">
              <span className="gradient-text-static">aman</span> & transparan.
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
            Ajukan Rekber Baru
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
                <h3 className="mb-2 text-lg font-semibold">Bagaimana Rekber Bekerja?</h3>
                <ul className="space-y-1 text-sm text-surface-700">
                  <li>1. Pembeli buat rekber — pilih penjual (member via email atau teknisi terdaftar)</li>
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
                Masuk untuk melihat dan mengelola transaksi rekber Anda.
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
