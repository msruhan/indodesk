'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Laptop,
  MessageCircle,
  Shield,
  ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
} from '@/lib/icons'
import { UserWalletBalanceCard } from '@/components/user/user-wallet-balance-card'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

/* ---------- Mock data ---------- */
const stats = {
  totalSpent: 10432000,
  totalOrders: 8,
  activeRekber: 1,
  totalKonsultasi: 5,
}

const spendingByMonth = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 2400 },
  { month: 'Mar', amount: 3800 },
  { month: 'Apr', amount: 1900 },
  { month: 'Mei', amount: 4200 },
  { month: 'Jun', amount: 2800 },
]

const recentActivity = [
  { id: '1', type: 'belanja', title: 'iPhone 13 Pro Max', subtitle: 'TechSolution Store', amount: 5000000, status: 'completed' as const, date: '2 hari lalu' },
  { id: '2', type: 'konsultasi', title: 'Konsultasi Unlock', subtitle: 'Ahmad Hidayat', amount: 50000, status: 'completed' as const, date: '3 hari lalu' },
  { id: '3', type: 'rekber', title: 'Samsung S21 via Rekber', subtitle: 'HandPhone Center', amount: 2500000, status: 'in-progress' as const, date: '5 hari lalu' },
  { id: '4', type: 'remote', title: 'Remote Flashing', subtitle: 'Budi Santoso', amount: 150000, status: 'pending' as const, date: '1 minggu lalu' },
]

const statusConfig = {
  completed: { label: 'Selesai', color: 'text-primary-600', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-600', icon: Clock },
  'in-progress': { label: 'Proses', color: 'text-accent-600', icon: Clock },
  failed: { label: 'Gagal', color: 'text-rose-600', icon: XCircle },
}

const typeConfig: Record<string, { icon: typeof ShoppingBag; bg: string; text: string }> = {
  belanja: { icon: ShoppingBag, bg: 'bg-primary-50', text: 'text-primary-700' },
  konsultasi: { icon: MessageCircle, bg: 'bg-accent-50', text: 'text-accent-700' },
  rekber: { icon: Shield, bg: 'bg-violet-50', text: 'text-violet-700' },
  remote: { icon: Laptop, bg: 'bg-amber-50', text: 'text-amber-700' },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const heroActionBtn =
  'h-8 gap-1.5 border-0 px-3.5 text-xs font-semibold shadow-soft-md transition-[background-color,transform] hover:-translate-y-px'

/* ---------- Chart config ---------- */
const chartOptions: ApexOptions = {
  chart: { toolbar: { show: false }, foreColor: '#71717a', sparkline: { enabled: false } },
  colors: ['#10b981'],
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 4, right: 4 } },
  xaxis: { categories: spendingByMonth.map((d) => d.month), axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
  yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v) => `${v / 1000}rb` } },
  tooltip: { theme: 'light', y: { formatter: (v) => formatPrice(v * 1000) } },
}

export default function UserDashboardPage() {
  return (
    <div className="space-y-5">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-5 text-white shadow-glow-primary"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%)] bg-[length:20px_20px] opacity-30" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
            Selamat datang kembali
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Halo, User! 👋
          </h1>
          <p className="mt-1 text-[13px] text-white/80">
            Berikut ringkasan aktivitas dan transaksi Anda.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
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
          </div>
        </div>
      </motion.div>

      <UserWalletBalanceCard />

      {/* Quick stats — compact horizontal */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: 'Total Belanja', value: formatPrice(stats.totalSpent), icon: ShoppingBag, color: 'primary' },
          { label: 'Order', value: String(stats.totalOrders), icon: CheckCircle, color: 'accent' },
          { label: 'Konsultasi', value: String(stats.totalKonsultasi), icon: MessageCircle, color: 'violet' },
          { label: 'Rekber Aktif', value: String(stats.activeRekber), icon: Shield, color: 'amber' },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-xl border p-3',
              item.color === 'primary' && 'border-primary-200/60 bg-gradient-to-br from-primary-50/60 to-white',
              item.color === 'accent' && 'border-accent-200/60 bg-gradient-to-br from-accent-50/60 to-white',
              item.color === 'violet' && 'border-violet-200/60 bg-gradient-to-br from-violet-50/60 to-white',
              item.color === 'amber' && 'border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-white',
            )}
          >
            <item.icon className={cn(
              'mb-1 h-4 w-4',
              item.color === 'primary' && 'text-primary-600',
              item.color === 'accent' && 'text-accent-600',
              item.color === 'violet' && 'text-violet-600',
              item.color === 'amber' && 'text-amber-600',
            )} />
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">{item.label}</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Spending chart */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Pengeluaran Bulanan</h2>
              <p className="text-[10px] text-surface-500">6 bulan terakhir (dalam ribuan)</p>
            </div>
            <Badge variant="primary" className="text-[9px]">
              <TrendingUp className="h-2.5 w-2.5" />
              +18%
            </Badge>
          </div>
          <Chart
            options={chartOptions}
            series={[{ name: 'Pengeluaran', data: spendingByMonth.map((d) => d.amount) }]}
            type="area"
            height={160}
          />
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Aktivitas Terakhir</h2>
          <Link href="/user/riwayat" className="flex items-center gap-1 text-[11px] font-medium text-primary-700 hover:underline">
            Lihat semua
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentActivity.map((tx, idx) => {
            const cfg = statusConfig[tx.status]
            const typeCfg = typeConfig[tx.type]
            const TypeIcon = typeCfg.icon
            const StatusIcon = cfg.icon

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-3 transition-all duration-300 hover:border-primary-200/70 hover:shadow-soft-sm">
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', typeCfg.bg)}>
                    <TypeIcon className={cn('h-4 w-4', typeCfg.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{tx.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-surface-500">
                      <span className="truncate">{tx.subtitle}</span>
                      <span className="flex-shrink-0">·</span>
                      <span className="flex-shrink-0">{tx.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                    <p className="text-[12px] font-bold text-ink tabular-nums">{formatPrice(tx.amount)}</p>
                    <span className={cn('flex items-center gap-0.5 text-[9px] font-medium', cfg.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
