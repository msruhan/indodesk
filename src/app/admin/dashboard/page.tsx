'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ConversionFunnelChart,
  DashboardPageHeader,
  DashboardPanel,
  EmptyState,
  InsightCard,
  KonsultasiChart,
  MetricCard,
  StatusBadge,
  TopProductsChart,
  TransaksiChart,
} from '@/components/dashboard'
import { ChartSlider } from '@/components/dashboard/chart-slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Clock,
  MessageCircle,
  Shield,
  ShoppingBag,
  UserCheck,
  Users,
} from '@/lib/icons'
import type { AdminDashboardDto } from '@/lib/admin-dashboard-data'
import { cn } from '@/lib/utils'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

const insightIcons = {
  primary: Clock,
  warning: Shield,
  danger: AlertCircle,
  neutral: ShoppingBag,
} as const

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/dashboard')
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

  const updatedLabel = new Date(data.updatedAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Pusat Kontrol"
        title="Dashboard Admin"
        description="Ringkasan operasional platform, performa transaksi, approval, dan aktivitas ekosistem teknisi handphone."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Data live
            </span>
            <span>Diperbarui {updatedLabel}</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {data.insights.map((item) => {
          const Icon = insightIcons[item.tone] ?? Clock
          return <InsightCard key={item.title} {...item} icon={Icon} />
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total User"
          value={data.stats.totalUsers.toLocaleString('id-ID')}
          icon={Users}
          sparkline={data.sparklines.users}
          footnote="Pengguna terdaftar"
        />
        <MetricCard
          title="Total Teknisi"
          value={data.stats.totalTeknisi.toLocaleString('id-ID')}
          icon={UserCheck}
          sparkline={data.sparklines.teknisi}
          footnote={`${data.stats.pendingApprovals} menunggu approval`}
        />
        <MetricCard
          title="Total Transaksi"
          value={data.stats.totalTransaksi.toLocaleString('id-ID')}
          icon={ShoppingBag}
          sparkline={data.sparklines.transaksi}
          footnote="Semua kategori order"
        />
        <MetricCard
          title="Konsultasi & Remote"
          value={data.stats.totalKonsultasi.toLocaleString('id-ID')}
          icon={MessageCircle}
          sparkline={data.sparklines.konsultasi}
          footnote={`${data.stats.rekberHeld} rekber ditahan`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChartSlider>
          <TransaksiChart
            data={{
              labels: data.charts.revenueLabels,
              revenueJt: data.charts.revenueJt,
              transactionCounts: data.charts.transactionCounts,
            }}
          />
          <KonsultasiChart data={data.charts.transactionMix} />
        </ChartSlider>

        <DashboardPanel title="Perhatian" description="Ringkasan operasional hari ini.">
          <div className="space-y-3">
            {data.stats.pendingApprovals > 0 && (
              <InsightCard
                icon={UserCheck}
                title={`${data.stats.pendingApprovals} approval tertunda`}
                description="Buka halaman Approval untuk review produk, toko, dan teknisi."
                tone="primary"
              />
            )}
            {data.stats.rekberHeld > 0 && (
              <InsightCard
                icon={Shield}
                title={`${data.stats.rekberHeld} rekber aktif`}
                description="Dana escrow ditahan — pantau di modul Rekber."
                tone="warning"
              />
            )}
            {data.stats.pendingWithdraws > 0 && (
              <InsightCard
                icon={Clock}
                title={`${data.stats.pendingWithdraws} penarikan tertunda`}
                description="Proses di Manajemen → Saldo → Penarikan."
                tone="warning"
              />
            )}
            {data.stats.openSecurityAlerts > 0 && (
              <InsightCard
                icon={AlertCircle}
                title={`${data.stats.openSecurityAlerts} alert keamanan wallet`}
                description="Tinjau anomali saldo di Manajemen → Saldo → Keamanan."
                tone="danger"
              />
            )}
            {(data.stats.pendingWithdraws > 0 || data.stats.openSecurityAlerts > 0) && (
              <Link href="/admin/management?tab=saldo">
                <Button variant="outline" size="sm" className="w-full">
                  Buka Manajemen Saldo
                </Button>
              </Link>
            )}
            <Link href="/admin/transactions">
              <Button variant="outline" size="sm" className="w-full">
                Lihat semua transaksi
              </Button>
            </Link>
          </div>
        </DashboardPanel>
      </div>

      <ChartSlider>
        <ConversionFunnelChart data={data.charts.funnel} />
        <TopProductsChart data={data.charts.topProducts} />
      </ChartSlider>

      <DashboardPanel
        title="Order Terbaru"
        description="Transaksi terbaru lintas marketplace dan layanan."
        action={
          <Link href="/admin/transactions">
            <Button variant="outline" size="sm">
              Lihat semua
            </Button>
          </Link>
        }
      >
        {data.recentOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Order</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderCode}</TableCell>
                  <TableCell>{order.user}</TableCell>
                  <TableCell>{formatPrice(order.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-sm text-surface-500">{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Belum ada order"
            description="Order baru akan tampil di sini setelah transaksi pertama masuk."
          />
        )}
      </DashboardPanel>
    </div>
  )
}
