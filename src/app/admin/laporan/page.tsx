'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Laptop,
  MessageCircle,
  MessageSquare,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from '@/lib/icons'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type LaporanData = {
  overview: {
    totalUsers: number
    totalTeknisi: number
    totalTransactions: number
    totalRevenue: string
    totalWalletBalance: string
    successRate: number
    ordersToday: number
    chatMessagesToday: number
    depositsToday: number
  }
  orders: {
    imei: { total: number; success: number; pending: number; revenue: string }
    server: { total: number; success: number; pending: number; revenue: string }
    marketplace: { total: number; revenue: string }
    topup: { total: number }
    rekber: { total: number }
  }
  communication: {
    chat: { total: number; messages: number; messagesToday: number }
    konsultasi: { total: number; last7d: number }
    remote: { total: number; last7d: number }
  }
  products: {
    total: number
    published: number
    totalViews: number
    totalSold: number
  }
  deposits: {
    total: number
    today: number
    last30d: number
  }
  charts: {
    transactionMix: Array<{ name: string; value: number; count: number; color: string }>
    communicationMix: Array<{ name: string; value: number; count: number; color: string }>
    daily: {
      labels: string[]
      imei: number[]
      server: number[]
      chat: number[]
      konsultasi: number[]
      remote: number[]
      deposit: number[]
      revenue: number[]
    }
    orderStatusBreakdown: {
      categories: string[]
      series: Array<{ name: string; data: number[] }>
    }
    topProducts: Array<{ name: string; sold: number; views: number; price: number }>
  }
  period: {
    orders7d: number
    orders30d: number
  }
}

function formatIdr(value: number | string) {
  const num = typeof value === 'string' ? Number(value) : value
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`
  return `Rp ${num.toLocaleString('id-ID')}`
}

export default function AdminLaporanPage() {
  const [data, setData] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/laporan')
      const json = await res.json()
      if (!json.success) { setError(json.error || 'Gagal memuat laporan'); return }
      setData(json.data)
    } catch { setError('Gagal memuat laporan') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error || 'Data tidak tersedia'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>Coba lagi</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Laporan</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">Analitik komprehensif seluruh aktivitas platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview metrics — row 1 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard title="Total Revenue" value={formatIdr(data.overview.totalRevenue)} icon={DollarSign} footnote="Digital + Server + Marketplace" tone="primary" compact />
        <MetricCard title="Total Transaksi" value={data.overview.totalTransactions.toLocaleString('id-ID')} icon={Package} footnote="Seluruh platform" tone="primary" compact />
        <MetricCard title="Success Rate" value={`${data.overview.successRate}%`} icon={CheckCircle} footnote="Digital & Server orders" tone={data.overview.successRate >= 80 ? 'primary' : 'warning'} compact />
        <MetricCard title="Saldo Platform" value={formatIdr(data.overview.totalWalletBalance)} icon={Wallet} footnote="Akumulasi semua wallet" tone="neutral" compact />
      </div>

      {/* Overview metrics — row 2 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard title="Total User" value={data.overview.totalUsers.toLocaleString('id-ID')} icon={Users} footnote="Registered users" tone="primary" compact />
        <MetricCard title="Total Teknisi" value={data.overview.totalTeknisi.toLocaleString('id-ID')} icon={Sparkles} footnote="Verified & pending" tone="primary" compact />
        <MetricCard title="Order Hari Ini" value={data.overview.ordersToday.toLocaleString('id-ID')} icon={TrendingUp} footnote="Digital + Server" tone="primary" compact />
        <MetricCard title="Chat Hari Ini" value={data.overview.chatMessagesToday.toLocaleString('id-ID')} icon={MessageSquare} footnote="Pesan terkirim" tone="neutral" compact />
      </div>

      {/* Charts row — Transaction Mix + Communication Mix */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="Distribusi Transaksi"
          subtitle="Breakdown per jenis layanan"
          data={data.charts.transactionMix}
        />
        <DonutChart
          title="Distribusi Komunikasi"
          subtitle="Chat vs Konsultasi vs Remote"
          data={data.charts.communicationMix}
        />
      </div>

      {/* Revenue Line Chart (7 days) */}
      <RevenueLineChart labels={data.charts.daily.labels} revenue={data.charts.daily.revenue} />

      {/* Orders Area Chart (7 days) — IMEI + Server stacked */}
      <OrdersAreaChart labels={data.charts.daily.labels} imei={data.charts.daily.imei} server={data.charts.daily.server} />

      {/* Communication Bar Chart (7 days) */}
      <CommunicationBarChart labels={data.charts.daily.labels} chat={data.charts.daily.chat} konsultasi={data.charts.daily.konsultasi} remote={data.charts.daily.remote} />

      {/* Deposit Line Chart (7 days) */}
      <DepositLineChart labels={data.charts.daily.labels} deposit={data.charts.daily.deposit} />

      {/* Order Status Stacked Bar */}
      <OrderStatusStackedBar data={data.charts.orderStatusBreakdown} />

      {/* Top Products Horizontal Bar */}
      <TopProductsBarChart data={data.charts.topProducts} />

      {/* Order breakdown cards */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Detail Order per Kategori</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <OrderCategoryCard
            icon={Smartphone}
            label="Digital Service"
            tone="bg-blue-50 text-blue-700 ring-blue-200/70"
            total={data.orders.imei.total}
            success={data.orders.imei.success}
            pending={data.orders.imei.pending}
            revenue={data.orders.imei.revenue}
          />
          <OrderCategoryCard
            icon={Laptop}
            label="Server Service"
            tone="bg-amber-50 text-amber-700 ring-amber-200/70"
            total={data.orders.server.total}
            success={data.orders.server.success}
            pending={data.orders.server.pending}
            revenue={data.orders.server.revenue}
          />
          <OrderCategoryCard
            icon={ShoppingBag}
            label="Marketplace"
            tone="bg-violet-50 text-violet-700 ring-violet-200/70"
            total={data.orders.marketplace.total}
            revenue={data.orders.marketplace.revenue}
          />
          <OrderCategoryCard
            icon={Zap}
            label="Top Up"
            tone="bg-emerald-50 text-emerald-700 ring-emerald-200/70"
            total={data.orders.topup.total}
          />
          <OrderCategoryCard
            icon={Shield}
            label="Transaksi Aman"
            tone="bg-pink-50 text-pink-700 ring-pink-200/70"
            total={data.orders.rekber.total}
          />
          <OrderCategoryCard
            icon={CreditCard}
            label="Deposit Saldo"
            tone="bg-primary-50 text-primary-700 ring-primary-200/70"
            total={data.deposits.total}
            extra={[
              { label: 'Hari ini', value: data.deposits.today.toString() },
              { label: '30 hari', value: data.deposits.last30d.toString() },
            ]}
          />
        </div>
      </div>

      {/* Communication stats */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Komunikasi & Layanan</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CommCard
            icon={MessageSquare}
            label="Chat"
            tone="bg-primary-50 text-primary-700 ring-primary-200/70"
            stats={[
              { label: 'Percakapan', value: data.communication.chat.total.toLocaleString('id-ID') },
              { label: 'Total pesan', value: data.communication.chat.messages.toLocaleString('id-ID') },
              { label: 'Pesan hari ini', value: data.communication.chat.messagesToday.toLocaleString('id-ID') },
            ]}
          />
          <CommCard
            icon={MessageCircle}
            label="Konsultasi"
            tone="bg-accent-50 text-accent-700 ring-accent-200/70"
            stats={[
              { label: 'Total sesi', value: data.communication.konsultasi.total.toLocaleString('id-ID') },
              { label: '7 hari terakhir', value: data.communication.konsultasi.last7d.toLocaleString('id-ID') },
            ]}
          />
          <CommCard
            icon={Laptop}
            label="Remote Support"
            tone="bg-amber-50 text-amber-700 ring-amber-200/70"
            stats={[
              { label: 'Total sesi', value: data.communication.remote.total.toLocaleString('id-ID') },
              { label: '7 hari terakhir', value: data.communication.remote.last7d.toLocaleString('id-ID') },
            ]}
          />
        </div>
      </div>

      {/* Product & Ads stats */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Produk & Iklan</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <MetricCard title="Total Produk" value={data.products.total.toLocaleString('id-ID')} icon={Package} footnote="Semua produk" tone="neutral" compact />
          <MetricCard title="Iklan Tayang" value={data.products.published.toLocaleString('id-ID')} icon={Eye} footnote="Published & approved" tone="primary" compact />
          <MetricCard title="Total Views" value={data.products.totalViews.toLocaleString('id-ID')} icon={BarChart3} footnote="Orang melihat iklan" tone="primary" compact />
          <MetricCard title="Terjual" value={data.products.totalSold.toLocaleString('id-ID')} icon={ShoppingBag} footnote="Unit terjual" tone="primary" compact />
        </div>
      </div>

      {/* Period comparison */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Perbandingan Periode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PeriodCard label="Order 7 Hari" value={data.period.orders7d} icon={Calendar} />
          <PeriodCard label="Order 30 Hari" value={data.period.orders30d} icon={Calendar} />
          <PeriodCard label="Deposit 30 Hari" value={data.deposits.last30d} icon={Wallet} />
        </div>
      </div>

      {/* Quick insights */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Insight Cepat</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <InsightChip
            label="Conversion Rate"
            value={data.products.totalViews > 0 ? `${((data.products.totalSold / data.products.totalViews) * 100).toFixed(1)}%` : '—'}
            desc="Dari view ke terjual"
          />
          <InsightChip
            label="Avg Order (Digital)"
            value={data.orders.imei.total > 0 ? formatIdr(Number(data.orders.imei.revenue) / data.orders.imei.total) : '—'}
            desc="Rata-rata per order digital"
          />
          <InsightChip
            label="Chat per Percakapan"
            value={data.communication.chat.total > 0 ? `${Math.round(data.communication.chat.messages / data.communication.chat.total)} pesan` : '—'}
            desc="Rata-rata pesan per chat"
          />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function DonutChart({ title, subtitle, data }: { title: string; subtitle: string; data: Array<{ name: string; value: number; count: number; color: string }> }) {
  const options: ApexOptions = {
    chart: { toolbar: { show: false }, foreColor: '#71717a', animations: { enabled: true, speed: 800 } },
    colors: data.map((d) => d.color),
    labels: data.map((d) => `${d.name} (${d.count})`),
    dataLabels: { enabled: true, formatter: (val) => `${(val as number).toFixed(0)}%`, style: { fontSize: '11px', fontWeight: 600 }, dropShadow: { enabled: false } },
    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, name: { fontSize: '11px', color: '#18181b' }, value: { fontSize: '16px', fontWeight: 700, color: '#18181b', formatter: (v) => `${v}%` }, total: { show: true, label: 'Total', fontSize: '10px', color: '#71717a', formatter: () => `${data.reduce((s, d) => s + d.count, 0)}` } } } } },
    stroke: { width: 2, colors: ['#fff'] },
    legend: { position: 'bottom', fontSize: '11px', markers: { size: 6 }, itemMargin: { horizontal: 8, vertical: 4 } },
    tooltip: { theme: 'light', y: { formatter: (v) => `${v}%` } },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>{title}</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">{subtitle}</p>
        </CardHeader>
        <CardContent className="pt-4">
          {data.every((d) => d.value === 0) ? (
            <p className="py-12 text-center text-sm text-surface-500">Belum ada data</p>
          ) : (
            <Chart options={options} series={data.map((d) => d.value)} type="donut" height={280} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OrderCategoryCard({ icon: Icon, label, tone, total, success, pending, revenue, extra }: {
  icon: typeof Smartphone
  label: string
  tone: string
  total: number
  success?: number
  pending?: number
  revenue?: string
  extra?: Array<{ label: string; value: string }>
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tone)}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-surface-500">{label}</p>
              <p className="text-xl font-bold text-ink tabular-nums">{total.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {success !== undefined && (
              <div className="rounded-lg bg-primary-50/60 px-2 py-1.5 text-center">
                <p className="font-bold text-primary-700 tabular-nums">{success}</p>
                <p className="text-[9px] text-primary-600">Sukses</p>
              </div>
            )}
            {pending !== undefined && (
              <div className="rounded-lg bg-amber-50/60 px-2 py-1.5 text-center">
                <p className="font-bold text-amber-700 tabular-nums">{pending}</p>
                <p className="text-[9px] text-amber-600">Pending</p>
              </div>
            )}
            {revenue && (
              <div className="col-span-2 rounded-lg bg-surface-50 px-2 py-1.5 text-center">
                <p className="font-bold text-ink tabular-nums">{formatIdr(revenue)}</p>
                <p className="text-[9px] text-surface-500">Revenue</p>
              </div>
            )}
            {extra?.map((e) => (
              <div key={e.label} className="rounded-lg bg-surface-50 px-2 py-1.5 text-center">
                <p className="font-bold text-ink tabular-nums">{e.value}</p>
                <p className="text-[9px] text-surface-500">{e.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CommCard({ icon: Icon, label, tone, stats }: {
  icon: typeof MessageSquare
  label: string
  tone: string
  stats: Array<{ label: string; value: string }>
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tone)}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-ink">{label}</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-[12px]">
                <span className="text-surface-500">{s.label}</span>
                <span className="font-bold text-ink tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PeriodCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Calendar }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-xs">
      <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/70">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-medium text-surface-500">{label}</p>
        <p className="text-xl font-bold text-ink tabular-nums">{value.toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

function InsightChip({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="rounded-xl border border-surface-200/70 bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold text-ink tabular-nums">{value}</span>
      </div>
      <p className="mt-0.5 text-[10px] text-surface-500">{desc}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* NEW CHARTS — Line, Area, Bar, Stacked Bar                                  */
/* -------------------------------------------------------------------------- */

const chartBase: ApexOptions = {
  chart: { toolbar: { show: false }, foreColor: '#71717a', animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 50 } } },
  grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 8, right: 8 } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'light' },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', markers: { size: 4 } },
}

function RevenueLineChart({ labels, revenue }: { labels: string[]; revenue: number[] }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#10b981'],
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}` } },
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Revenue Harian (7 Hari)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Pendapatan dari order Digital & Server yang sukses</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={[{ name: 'Revenue', data: revenue }]} type="area" height={260} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OrdersAreaChart({ labels, imei, server }: { labels: string[]; imei: number[]; server: number[] }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#10b981', '#06b6d4'],
    stroke: { curve: 'smooth', width: [3, 2] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' } } },
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Order Harian (7 Hari)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Jumlah order Digital & Server per hari</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={[{ name: 'Digital', data: imei }, { name: 'Server', data: server }]} type="area" height={260} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CommunicationBarChart({ labels, chat, konsultasi, remote }: { labels: string[]; chat: number[]; konsultasi: number[]; remote: number[] }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#10b981', '#06b6d4', '#f59e0b'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' } } },
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Aktivitas Komunikasi (7 Hari)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Pesan chat, sesi konsultasi, dan remote per hari</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={[{ name: 'Chat', data: chat }, { name: 'Konsultasi', data: konsultasi }, { name: 'Remote', data: remote }]} type="bar" height={260} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DepositLineChart({ labels, deposit }: { labels: string[]; deposit: number[] }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#8b5cf6'],
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' } } },
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Deposit Harian (7 Hari)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Jumlah deposit (top up saldo) per hari</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={[{ name: 'Deposit', data: deposit }]} type="area" height={220} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OrderStatusStackedBar({ data }: { data: { categories: string[]; series: Array<{ name: string; data: number[] }> } }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#94a3b8'],
    chart: { ...chartBase.chart, stacked: true },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '55%' } },
    xaxis: { categories: data.categories, labels: { style: { colors: '#71717a', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#52525b', fontSize: '11px', fontWeight: 500 } } },
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Status Order (Digital vs Server)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Breakdown status per kategori layanan</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={data.series} type="bar" height={200} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TopProductsBarChart({ data }: { data: Array<{ name: string; sold: number; views: number; price: number }> }) {
  if (data.length === 0) return null
  const options: ApexOptions = {
    ...chartBase,
    colors: ['#10b981', '#06b6d4'],
    chart: { ...chartBase.chart, stacked: false },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '55%' } },
    xaxis: {
      categories: data.map((d) => d.name),
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#52525b', fontSize: '10px', fontWeight: 500 },
      },
    },
    yaxis: [
      {
        seriesName: 'Terjual',
        title: { text: 'Terjual', style: { color: '#71717a', fontSize: '10px', fontWeight: 500 } },
        labels: { style: { colors: '#71717a', fontSize: '10px' } },
      },
      {
        seriesName: 'Views',
        opposite: true,
        title: { text: 'Views', style: { color: '#71717a', fontSize: '10px', fontWeight: 500 } },
        labels: {
          style: { colors: '#71717a', fontSize: '10px' },
          formatter: (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`),
        },
      },
    ],
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Produk Terlaris</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Unit terjual & views produk teratas</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={[
              { name: 'Terjual', data: data.map((d) => d.sold) },
              { name: 'Views', data: data.map((d) => d.views) },
            ]}
            type="bar"
            height={280}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
