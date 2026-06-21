'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Eye,
  MessageCircle,
  ShoppingCart,
  Star,
  Wallet,
} from '@/lib/icons'
import {
  DashboardPageHeader,
  DashboardPanel,
  EmptyState,
  MetricCard,
  ProfileCompletionBanner,
  StatusBadge,
  TeknisiEarningsChart,
  TeknisiServiceChart,
} from '@/components/dashboard'
import { ChartSlider } from '@/components/dashboard/chart-slider'
import { TeknisiWelcomeCard } from '@/components/teknisi/teknisi-welcome-card'
import { TeknisiDigitalIdCard } from '@/components/teknisi/teknisi-digital-id-card'
import { TeknisiTrustBadges } from '@/components/teknisi/teknisi-trust-badges'
import type { TeknisiDashboardDto } from '@/lib/teknisi-dashboard-data'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { canAccessKonsultasiService } from '@/lib/platform-settings-shared'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

export default function TeknisiDashboardPage() {
  const { flags } = useFeatureFlags()
  const canSeeKonsultasi = canAccessKonsultasiService('TEKNISI', flags)
  const [data, setData] = useState<TeknisiDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/dashboard')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat dashboard')
        return
      }
      setData(json.data)
    } catch {
      setError('Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="py-16 text-center text-sm text-surface-500">Memuat dashboard…</p>
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error ?? 'Data tidak tersedia'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  const {
    digitalId,
    trust,
    profile,
    serviceMix,
    earningsWeekly,
    earningsWowPercent,
    recentOrders,
    marketplacePending,
    profileCompletion,
  } = data
  const conversionRate =
    profile.totalView > 0
      ? ((profile.totalKonsultasi / profile.totalView) * 100).toFixed(1)
      : '0'

  const earningsChartData = {
    weeks: earningsWeekly.map((w) => w.week),
    earnings: earningsWeekly.map((w) => Math.round(w.earnings / 1000)),
    consultations: earningsWeekly.map((w) => w.consultations),
    remote: earningsWeekly.map((w) => w.remote),
    wowPercent: earningsWowPercent,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileCompletionBanner status={profileCompletion} />

      <p className="text-sm text-surface-600 sm:hidden">
        Halo, <span className="font-semibold text-ink">{profile.name}</span>
      </p>

      <TeknisiWelcomeCard name={profile.name} className="hidden sm:block" />

      <DashboardPageHeader
        compact
        eyebrow="Ruang Kerja Teknisi"
        title="Dashboard Teknisi"
        description="Pantau performa profil, konsultasi, saldo, dan order yang perlu ditindaklanjuti."
        actions={
          <Link href="/teknisi/saldo" className="max-sm:hidden">
            <Button variant="primary">Kelola Saldo</Button>
          </Link>
        }
        meta={
          <div className="flex flex-col gap-1.5 text-[10px] text-surface-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:text-xs">
            <Link
              href="/teknisi/pesanan"
              className={cn(
                'inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors sm:px-2.5 sm:py-1',
                marketplacePending > 0
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  marketplacePending > 0 ? 'bg-amber-500' : 'bg-primary-500',
                )}
              />
              <span className="min-w-0 truncate">
                {marketplacePending > 0
                  ? `${marketplacePending} pesanan perlu diproses`
                  : 'Tidak ada pesanan aktif'}
              </span>
            </Link>
            <span className="hidden sm:inline">
              Rating {profile.rating.toFixed(1)} dari {profile.reviewCount} review
            </span>
          </div>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-6">
        <aside className="order-2 min-w-0 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <TeknisiDigitalIdCard teknisi={digitalId} />
        </aside>

        <div className="order-1 min-w-0 space-y-4 sm:space-y-6 lg:order-1">
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            <MetricCard
              title="Total Terjual"
              value={profile.totalProductSold.toLocaleString('id-ID')}
              icon={ShoppingCart}
              footnote="Semua produk iklan"
              tone="primary"
              dense
            />
            <MetricCard
              title="Iklan Dilihat"
              value={profile.totalProductViews.toLocaleString('id-ID')}
              icon={Eye}
              footnote="Semua waktu"
              tone="primary"
              dense
            />
            <MetricCard
              title="Rating"
              value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
              icon={Star}
              trend={{ value: `${profile.reviewCount} review`, label: '', direction: 'neutral' }}
              footnote="Ulasan terverifikasi"
              tone="warning"
              dense
            />
            <MetricCard
              title="Saldo"
              value={formatPrice(profile.saldo)}
              icon={Wallet}
              footnote="Saldo tersedia"
              tone="primary"
              dense
            />
          </div>

          <ChartSlider>
        <TeknisiEarningsChart data={earningsChartData} />
        <TeknisiServiceChart data={serviceMix.length > 0 ? serviceMix : undefined} />
          </ChartSlider>

          <DashboardPanel
            title="Order & Sesi Terbaru"
        description="Riwayat order dan sesi yang perlu dipantau."
        action={
          canSeeKonsultasi ? (
            <Link href="/teknisi/konsultasi">
              <Button variant="outline" size="sm">
                Lihat semua
              </Button>
            </Link>
          ) : undefined
        }
      >
        {recentOrders.length > 0 ? (
          <>
            <div className="space-y-2 sm:hidden">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-ink">{order.orderCode}</p>
                      <p className="mt-0.5 truncate text-[11px] text-surface-600">{order.service}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-surface-500">{order.user}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink">
                      {order.amount > 0 ? formatPrice(order.amount) : '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-surface-400">{order.date}</p>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderCode}</TableCell>
                      <TableCell>{order.service}</TableCell>
                      <TableCell>{order.user}</TableCell>
                      <TableCell>{order.amount > 0 ? formatPrice(order.amount) : '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-surface-500">{order.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Belum ada order"
            description="Order konsultasi, remote, dan marketplace akan tampil di sini."
          />
        )}
      </DashboardPanel>

      <DashboardPanel title="Badge & Achievements" description="Status kepercayaan yang tampil ke pelanggan.">
        <TeknisiTrustBadges
          badge={trust.badge}
          isVerified={trust.isVerified}
          isOnline={trust.isOnline}
          showOnlineStatus={false}
          showCriteriaHint
        />
      </DashboardPanel>
        </div>
      </div>
    </div>
  )
}
