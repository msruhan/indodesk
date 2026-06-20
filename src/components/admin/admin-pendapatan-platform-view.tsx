'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/dashboard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  type PlatformRevenueChannel,
  type PlatformRevenueSummary,
} from '@/lib/platform-revenue-types'
import {
  ArrowRight,
  CheckSquare,
  Clock,
  DollarSign,
  MessageCircle,
  RefreshCw,
  Shield,
  ShoppingBag,
  TrendingUp,
} from '@/lib/icons'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

function formatIdr(value: number | string) {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) return 'Rp 0'
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const channelIcons: Record<PlatformRevenueChannel, typeof ShoppingBag> = {
  marketplace: ShoppingBag,
  rekber: Shield,
  inspeksi: CheckSquare,
  konsultasi: MessageCircle,
}

const channelTones: Record<PlatformRevenueChannel, string> = {
  marketplace: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  rekber: 'bg-pink-50 text-pink-700 ring-pink-200/70',
  inspeksi: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  konsultasi: 'bg-accent-50 text-accent-700 ring-accent-200/70',
}

export function AdminPendapatanPlatformView() {
  const [data, setData] = useState<PlatformRevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pendapatan-platform')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat data')
        return
      }
      setData(json.data)
    } catch {
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (!data) return null

  const mixSeries = data.charts.mix.map((m) => Number(m.amount))
  const mixTotal = mixSeries.reduce((s, n) => s + n, 0)
  const mixPercents = mixTotal > 0 ? mixSeries.map((n) => Math.round((n / mixTotal) * 100)) : mixSeries

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
            Pendapatan Platform
          </h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Fee owner dari marketplace, rekber, inspeksi, dan konsultasi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/admin/keuangan-marketplace">
              Pengaturan fee marketplace
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Total Terealisasi"
          value={formatIdr(data.realized.total)}
          icon={DollarSign}
          footnote="Fee final semua kanal"
          tone="primary"
          compact
        />
        <MetricCard
          title="Terealisasi Hari Ini"
          value={formatIdr(data.realized.today)}
          icon={TrendingUp}
          footnote="Selesai / release hari ini"
          tone="primary"
          compact
        />
        <MetricCard
          title="Terealisasi 30 Hari"
          value={formatIdr(data.realized.last30d)}
          icon={TrendingUp}
          footnote="30 hari terakhir"
          compact
        />
        <MetricCard
          title="Estimasi Belum Final"
          value={formatIdr(data.estimated.total)}
          icon={Clock}
          footnote="Bisa berubah jika dibatalkan"
          tone={Number(data.estimated.total) > 0 ? 'warning' : 'neutral'}
          compact
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Per Kanal</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(CHANNEL_LABELS) as PlatformRevenueChannel[]).map((channel) => {
            const ch = data.byChannel[channel]
            const Icon = channelIcons[channel]
            return (
              <Card key={channel} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                        channelTones[channel],
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{CHANNEL_LABELS[channel]}</p>
                      {ch.note ? (
                        <Badge variant="warning" className="mt-1 text-[9px]">
                          {ch.note}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-primary-50/60 px-2 py-1.5 text-center">
                      <p className="font-bold text-primary-700 tabular-nums">{formatIdr(ch.realized)}</p>
                      <p className="text-[9px] text-primary-600">Terealisasi</p>
                    </div>
                    <div className="rounded-lg bg-amber-50/60 px-2 py-1.5 text-center">
                      <p className="font-bold text-amber-700 tabular-nums">{formatIdr(ch.estimated)}</p>
                      <p className="text-[9px] text-amber-600">Estimasi</p>
                    </div>
                    <div className="rounded-lg bg-surface-50 px-2 py-1.5 text-center">
                      <p className="font-bold text-ink tabular-nums">{ch.countRealized}</p>
                      <p className="text-[9px] text-surface-500">Transaksi final</p>
                    </div>
                    <div className="rounded-lg bg-surface-50 px-2 py-1.5 text-center">
                      <p className="font-bold text-ink tabular-nums">{ch.countEstimated}</p>
                      <p className="text-[9px] text-surface-500">Belum final</p>
                    </div>
                    {ch.gmvRealized != null && Number(ch.gmvRealized) > 0 && (
                      <div className="col-span-2 rounded-lg bg-surface-50 px-2 py-1.5 text-center">
                        <p className="font-bold text-ink tabular-nums">{formatIdr(ch.gmvRealized)}</p>
                        <p className="text-[9px] text-surface-500">GMV sesi selesai (informatif)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MixDonutChart mix={data.charts.mix} percents={mixPercents} />
        <DailyRevenueChart daily={data.charts.daily} />
      </div>

      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle className="text-base">Riwayat Pendapatan Terbaru</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">
            Gabungan fee marketplace, rekber, dan inspeksi — max 20 entri
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {data.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-surface-500">Belum ada pendapatan tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kanal</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent.map((row) => (
                    <TableRow key={`${row.channel}-${row.id}`}>
                      <TableCell className="whitespace-nowrap text-xs text-surface-500">
                        {formatDateTime(row.occurredAt)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{CHANNEL_LABELS[row.channel]}</TableCell>
                      <TableCell>
                        <Link href={row.href} className="font-mono text-xs text-primary-700 hover:underline">
                          {row.orderCode}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-ink">
                        {formatIdr(row.fee)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.phase === 'realized' ? 'success' : 'warning'} className="text-[10px]">
                          {row.phase === 'realized' ? 'Terealisasi' : 'Estimasi'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MixDonutChart({
  mix,
  percents,
}: {
  mix: PlatformRevenueSummary['charts']['mix']
  percents: number[]
}) {
  const options: ApexOptions = {
    chart: { toolbar: { show: false }, foreColor: '#71717a' },
    colors: mix.map((m) => m.color),
    labels: mix.map((m, i) => `${m.label} (${formatIdr(m.amount)})`),
    dataLabels: {
      enabled: true,
      formatter: (_val, opts) => `${percents[opts?.seriesIndex ?? 0] ?? 0}%`,
      style: { fontSize: '11px', fontWeight: 600 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () =>
                formatIdr(mix.reduce((s, m) => s + Number(m.amount), 0)),
            },
          },
        },
      },
    },
    legend: { position: 'bottom', fontSize: '11px' },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle className="text-base">Mix Pendapatan Terealisasi</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Proporsi fee per kanal</p>
        </CardHeader>
        <CardContent className="pt-4">
          {mix.length === 0 ? (
            <p className="py-12 text-center text-sm text-surface-500">Belum ada data</p>
          ) : (
            <Chart options={options} series={percents} type="donut" height={280} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const chartBase: ApexOptions = {
  chart: { toolbar: { show: false }, foreColor: '#71717a' },
  grid: { borderColor: '#f4f4f5', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px' },
}

function DailyRevenueChart({ daily }: { daily: PlatformRevenueSummary['charts']['daily'] }) {
  const options: ApexOptions = {
    ...chartBase,
    colors: [CHANNEL_COLORS.marketplace, CHANNEL_COLORS.rekber, CHANNEL_COLORS.inspeksi],
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: daily.labels,
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${Math.round(v / 1000)}K` : `${v}`),
      },
    },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle className="text-base">Tren Fee Terealisasi (7 Hari)</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Marketplace, rekber, dan inspeksi per hari</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={[
              { name: 'Marketplace', data: daily.marketplace },
              { name: 'Transaksi Aman', data: daily.rekber },
              { name: 'Inspeksi', data: daily.inspeksi },
            ]}
            type="area"
            height={280}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
