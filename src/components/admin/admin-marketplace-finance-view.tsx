'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardPageHeader, DashboardPanel, MetricCard } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminMarketplaceFinanceForm } from '@/components/admin/admin-marketplace-finance-form'
import { DollarSign, RefreshCw, ShoppingBag, TrendingUp, Users } from '@/lib/icons'

type FinanceData = {
  settings: { buyerFeePercent: number; sellerFeePercent: number }
  stats: {
    totalBuyerFee: string
    totalSellerFee: string
    totalPlatformFee: string
    todayPlatformFee: string
    last30dPlatformFee: string
    completedOrderCount: number
  }
  recentOrders: Array<{
    id: string
    orderCode: string
    buyerFee: string
    sellerFee: string
    totalFee: string
    completedAt: string | null
  }>
}

function formatIdr(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) return 'Rp 0'
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminMarketplaceFinanceView() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/marketplace-finance')
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

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Analitik"
        title="Keuangan Marketplace"
        description="Pantau pendapatan fee pembeli dan penjual, serta atur persentase fee platform."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </Button>
        }
      />

      {error && !data ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Pendapatan Fee"
          value={data ? formatIdr(data.stats.totalPlatformFee) : '—'}
          icon={DollarSign}
          footnote="Dari order selesai"
          tone="primary"
          compact
        />
        <MetricCard
          title="Fee Pembeli"
          value={data ? formatIdr(data.stats.totalBuyerFee) : '—'}
          icon={Users}
          footnote="Akumulasi seluruh waktu"
          compact
        />
        <MetricCard
          title="Fee Penjual"
          value={data ? formatIdr(data.stats.totalSellerFee) : '—'}
          icon={ShoppingBag}
          footnote="Akumulasi seluruh waktu"
          compact
        />
        <MetricCard
          title="Fee 30 Hari Terakhir"
          value={data ? formatIdr(data.stats.last30dPlatformFee) : '—'}
          icon={TrendingUp}
          footnote={`Hari ini: ${data ? formatIdr(data.stats.todayPlatformFee) : '—'}`}
          compact
        />
      </div>

      <DashboardPanel
        title="Pengaturan Fee"
        description="Fee platform untuk pembeli (ditambahkan ke checkout) dan penjual (dipotong saat pesanan selesai)."
      >
        <AdminMarketplaceFinanceForm
          initialSettings={data?.settings ?? null}
          onSaved={() => void load()}
        />
      </DashboardPanel>

      <DashboardPanel
        title="Riwayat Fee Terbaru"
        description={`${data?.stats.completedOrderCount ?? 0} order marketplace telah selesai.`}
      >
        {loading && !data ? (
          <p className="text-sm text-surface-500">Memuat riwayat…</p>
        ) : !data?.recentOrders.length ? (
          <p className="text-sm text-surface-500">Belum ada fee tercatat dari order selesai.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Fee Pembeli</TableHead>
                  <TableHead>Fee Penjual</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Selesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.orderCode}</TableCell>
                    <TableCell>{formatIdr(row.buyerFee)}</TableCell>
                    <TableCell>{formatIdr(row.sellerFee)}</TableCell>
                    <TableCell className="font-semibold text-primary-700">
                      {formatIdr(row.totalFee)}
                    </TableCell>
                    <TableCell className="text-surface-500">{formatDateTime(row.completedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DashboardPanel>
    </div>
  )
}
