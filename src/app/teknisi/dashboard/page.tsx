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
    <div className="space-y-6">
      <TeknisiWelcomeCard name={profile.name} />

      <DashboardPageHeader
        eyebrow="Ruang Kerja Teknisi"
        title="Dashboard Teknisi"
        description="Pantau performa profil, konsultasi, saldo, dan order yang perlu ditindaklanjuti."
        actions={
          <Link href="/teknisi/saldo">
            <Button variant="primary">Kelola Saldo</Button>
          </Link>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <Link
              href="/teknisi/pesanan"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors',
                marketplacePending > 0
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  marketplacePending > 0 ? 'bg-amber-500' : 'bg-primary-500',
                )}
              />
              {marketplacePending > 0
                ? `${marketplacePending} pesanan perlu diproses — buka Pesanan Masuk`
                : 'Tidak ada pesanan aktif — lihat Pesanan Masuk'}
            </Link>
            <span>
              Rating {profile.rating.toFixed(1)} dari {profile.reviewCount} review
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <TeknisiDigitalIdCard teknisi={digitalId} />
        </aside>

        <div className="order-2 space-y-6 lg:order-1">
          <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Total Terjual"
          value={profile.totalProductSold.toLocaleString('id-ID')}
          icon={ShoppingCart}
          footnote="Semua produk iklan"
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Iklan Dilihat"
          value={profile.totalProductViews.toLocaleString('id-ID')}
          icon={Eye}
          footnote="Semua waktu"
          tone="primary"
          compact
        />
        <MetricCard
          title="Rating"
          value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
          icon={Star}
          trend={{ value: `${profile.reviewCount} review`, label: '', direction: 'neutral' }}
          footnote="Berdasarkan ulasan terverifikasi"
          tone="warning"
          compact
        />
        <MetricCard
          title="Saldo"
          value={formatPrice(profile.saldo)}
          icon={Wallet}
          footnote="Saldo tersedia"
          tone="primary"
          compact
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
