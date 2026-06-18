'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Laptop,
  MessageCircle,
  Shield,
  CheckSquare,
  ShoppingBag,
  Wallet,
  XCircle,
} from '@/lib/icons'
import { UserWalletBalanceCard } from '@/components/user/user-wallet-balance-card'
import { dashboardHeroCardClass, DashboardHeroSheen } from '@/components/dashboard'
import type { UserDashboardDto } from '@/lib/user-dashboard-data'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type DashboardPayload = UserDashboardDto & { userName: string }

const statusConfig = {
  completed: { label: 'Selesai', color: 'text-primary-600', icon: CheckCircle },
  pending: { label: 'Menunggu', color: 'text-amber-600', icon: Clock },
  'in-progress': { label: 'Proses', color: 'text-accent-600', icon: Clock },
  failed: { label: 'Gagal', color: 'text-rose-600', icon: XCircle },
}

const typeConfig: Record<string, { icon: typeof ShoppingBag; bg: string; text: string }> = {
  belanja: { icon: ShoppingBag, bg: 'bg-primary-50', text: 'text-primary-700' },
  konsultasi: { icon: MessageCircle, bg: 'bg-accent-50', text: 'text-accent-700' },
  rekber: { icon: Shield, bg: 'bg-violet-50', text: 'text-violet-700' },
  remote: { icon: Laptop, bg: 'bg-amber-50', text: 'text-amber-700' },
  inspeksi: { icon: CheckSquare, bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const heroActionBtn =
  'h-8 gap-1.5 border-0 px-3.5 text-xs font-semibold shadow-soft-md transition-[background-color,transform] hover:-translate-y-px'

export default function UserDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/dashboard')
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

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, foreColor: '#71717a', sparkline: { enabled: false } },
      colors: ['#10b981'],
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 4, right: 4 } },
      xaxis: {
        categories: data?.spendingByMonth.map((d) => d.month) ?? [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#71717a', fontSize: '11px' } },
      },
      yaxis: {
        labels: {
          style: { colors: '#71717a', fontSize: '11px' },
          formatter: (v) => `${Math.round(v)}rb`,
        },
      },
      tooltip: { theme: 'light', y: { formatter: (v) => formatPrice(v * 1000) } },
    }),
    [data?.spendingByMonth],
  )

  if (loading) {
    return <p className="py-16 text-center text-sm text-surface-500">Memuat dashboard…</p>
  }

  if (error || !data) {
    return (
      <motion.div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error ?? 'Data tidak tersedia'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          Coba lagi
        </Button>
      </motion.div>
    )
  }

  const { stats, spendingByMonth, recentActivity, userName } = data
  const chartSeries = spendingByMonth.map((d) => Math.round(d.amount / 1000))

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(dashboardHeroCardClass, 'p-5')}
      >
        <DashboardHeroSheen />

        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
            Selamat datang kembali
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Halo, {userName}! 👋
          </h1>
          <p className="mt-1 text-[13px] text-white/80">
            Berikut ringkasan aktivitas dan transaksi Anda.
          </p>

          {/* <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/marketplace">
              <Button
                size="sm"
                className={cn(heroActionBtn, 'bg-white text-primary-800 hover:bg-primary-50')}
              >
                <ShoppingBag className="h-3.5 w-3.5 text-primary-600" />
                Marketplace
              </Button>
            </Link>
            <Link href="/teknisi">
              <Button
                size="sm"
                className={cn(
                  heroActionBtn,
                  'bg-cyan-50 text-cyan-950 ring-1 ring-inset ring-cyan-200/80 hover:bg-cyan-100',
                )}
              >
                <MessageCircle className="h-3.5 w-3.5 text-cyan-700" />
                Cari Teknisi
              </Button>
            </Link>
            <Link href="/topup">
              <Button
                size="sm"
                className={cn(
                  heroActionBtn,
                  'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200/80 hover:bg-amber-100',
                )}
              >
                <Wallet className="h-3.5 w-3.5 text-amber-700" />
                Top Up
              </Button>
            </Link>
          </div> */}
        </div>
      </motion.div>

      <UserWalletBalanceCard />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
        {[
          { label: 'Total Belanja', value: formatPrice(stats.totalSpent), icon: ShoppingBag, color: 'primary' },
          { label: 'Order', value: String(stats.totalOrders), icon: CheckCircle, color: 'accent' },
          { label: 'Konsultasi Aktif', value: String(stats.activeKonsultasi), icon: MessageCircle, color: 'violet' },
          { label: 'Rekber Aktif', value: String(stats.activeRekber), icon: Shield, color: 'amber' },
          {
            label: 'Inspeksi Aktif',
            value: String(stats.activeInspeksi),
            icon: CheckSquare,
            color: 'emerald',
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-xl border p-3',
              item.color === 'primary' && 'border-primary-200/60 bg-gradient-to-br from-primary-50/60 to-white',
              item.color === 'accent' && 'border-accent-200/60 bg-gradient-to-br from-accent-50/60 to-white',
              item.color === 'violet' && 'border-violet-200/60 bg-gradient-to-br from-violet-50/60 to-white',
              item.color === 'amber' && 'border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-white',
              item.color === 'emerald' && 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white',
            )}
          >
            <item.icon
              className={cn(
                'mb-1 h-4 w-4',
                item.color === 'primary' && 'text-primary-600',
                item.color === 'accent' && 'text-accent-600',
                item.color === 'violet' && 'text-violet-600',
                item.color === 'amber' && 'text-amber-600',
              )}
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">{item.label}</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <motion.div className="mb-2">
            <h2 className="text-sm font-bold text-ink">Pengeluaran Bulanan</h2>
            <p className="text-[10px] text-surface-500">6 bulan terakhir (dalam ribuan Rp)</p>
          </motion.div>
          <Chart
            options={chartOptions}
            series={[{ name: 'Pengeluaran', data: chartSeries }]}
            type="area"
            height={160}
          />
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Aktivitas Terakhir</h2>
          <Link href="/user/riwayat" className="flex items-center gap-1 text-[11px] font-medium text-primary-700 hover:underline">
            Lihat semua
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500">
            Belum ada aktivitas. Mulai dari marketplace atau konsultasi teknisi.
          </p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((tx, idx) => {
              const cfg = statusConfig[tx.status]
              const typeCfg = typeConfig[tx.type]
              const TypeIcon = typeCfg.icon
              const StatusIcon = cfg.icon

              const row = (
                <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-3 transition-all duration-300 hover:border-primary-200/70 hover:shadow-soft-sm">
                  <motion.div
                    className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', typeCfg.bg)}
                  >
                    <TypeIcon className={cn('h-4 w-4', typeCfg.text)} />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{tx.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-surface-500">
                      <span className="truncate">{tx.subtitle}</span>
                      <span className="flex-shrink-0">·</span>
                      <span className="flex-shrink-0">{tx.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                    {tx.amount > 0 ? (
                      <p className="text-[12px] font-bold text-ink tabular-nums">{formatPrice(tx.amount)}</p>
                    ) : null}
                    <span className={cn('flex items-center gap-0.5 text-[9px] font-medium', cfg.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <Link href={tx.href} className="block">
                    {row}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
