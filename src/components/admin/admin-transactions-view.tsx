'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { useSyncPeriodToDateInputs } from '@/hooks/use-sync-period-to-date-inputs'
import { DataPagination } from '@/components/ui/data-pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useClientPagination } from '@/hooks/use-client-pagination'
import { cn } from '@/lib/utils'
import { formatIdr, formatDateTime } from '@/lib/format'
import { marketplaceOrderCancelActorLabel } from '@/lib/marketplace-order-cancel-labels'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Laptop,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from '@/lib/icons'

type TransactionType = 'marketplace' | 'imei' | 'server' | 'topup' | 'rekber'
type NormalizedStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'

type TransactionItem = {
  id: string
  type: TransactionType
  orderCode: string
  user: { id: string; name: string; email: string; role: string }
  seller: { id: string; name: string; email: string } | null
  title: string
  amount: string
  platformRevenue: string | null
  status: string
  normalizedStatus: NormalizedStatus
  createdAt: string
  updatedAt: string
  meta: Record<string, string | null>
  cancelReason: string | null
  cancelledBy: string | null
}

type TransactionStats = {
  totalAll: number
  totalMarketplace: number
  totalImei: number
  totalServer: number
  totalTopup: number
  totalRekber: number
  pendingCount: number
  successCount: number
  revenueToday: string
}

type TabKey = 'all' | TransactionType

const tabConfig: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
  { key: 'all', label: 'Semua', icon: Sparkles },
  { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { key: 'imei', label: 'Digital', icon: Smartphone },
  { key: 'server', label: 'Server', icon: Laptop },
  { key: 'topup', label: 'Top Up', icon: Zap },
  { key: 'rekber', label: 'Transaksi Aman', icon: Shield },
]

const typeConfig: Record<TransactionType, { label: string; icon: typeof Sparkles; tone: string }> = {
  marketplace: { label: 'Marketplace', icon: ShoppingBag, tone: 'bg-primary-50 text-primary-700 ring-primary-200/70' },
  imei: { label: 'Digital', icon: Smartphone, tone: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  server: { label: 'Server', icon: Laptop, tone: 'bg-amber-50 text-amber-700 ring-amber-200/70' },
  topup: { label: 'Top Up', icon: Zap, tone: 'bg-violet-50 text-violet-700 ring-violet-200/70' },
  rekber: { label: 'Transaksi Aman', icon: Shield, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
}

const statusConfig: Record<NormalizedStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'danger' | 'default'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  processing: { label: 'Diproses', variant: 'info', icon: RefreshCw },
  success: { label: 'Sukses', variant: 'success', icon: Check },
  failed: { label: 'Gagal', variant: 'danger', icon: X },
  cancelled: { label: 'Dibatalkan', variant: 'default', icon: X },
}

const STATUS_FILTERS: Array<{ id: 'all' | NormalizedStatus; label: string }> = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Diproses' },
  { id: 'success', label: 'Sukses' },
  { id: 'failed', label: 'Gagal' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

function formatPrice(price: number | string) {
  return formatIdr(price)
}

const emptyStats: TransactionStats = { totalAll: 0, totalMarketplace: 0, totalImei: 0, totalServer: 0, totalTopup: 0, totalRekber: 0, pendingCount: 0, successCount: 0, revenueToday: '0' }

export function AdminTransactionsView() {
  const { period } = useDashboardPeriod()
  const [tab, setTab] = useState<TabKey>('all')
  const [items, setItems] = useState<TransactionItem[]>([])
  const [stats, setStats] = useState<TransactionStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)
  const [statusFilter, setStatusFilter] = useState<'all' | NormalizedStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useSyncPeriodToDateInputs(period, setFrom, setTo)
  const [selectedItem, setSelectedItem] = useState<TransactionItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('type', tab)
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim())
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', '200')
      const res = await fetch(`/api/admin/transactions?${params.toString()}`)
      const json = await res.json()
      if (!json.success) { setError(json.error || 'Gagal memuat transaksi'); return }
      setItems(json.data.items)
      setStats(json.data.stats)
    } catch { setError('Gagal memuat transaksi') }
    finally { setLoading(false) }
  }, [tab, debouncedQ, from, to])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((i) => i.normalizedStatus === statusFilter)
  }, [items, statusFilter])

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: items.length, marketplace: 0, imei: 0, server: 0, topup: 0, rekber: 0 }
    for (const i of items) c[i.type] += 1
    return c
  }, [items])

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
  } = useClientPagination(filtered, [tab, statusFilter, debouncedQ, from, to])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Transaksi</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Monitoring seluruh order dan transaksi platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMonthFilter />
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard title="Total Transaksi" value={stats.totalAll.toLocaleString('id-ID')} icon={Package} footnote="Seluruh platform" tone="primary" compact />
        <MetricCard title="Revenue Hari Ini" value={formatPrice(stats.revenueToday)} icon={DollarSign} footnote="Digital + Server" tone="primary" compact />
        <MetricCard title="Pending" value={stats.pendingCount.toLocaleString('id-ID')} icon={Clock} footnote="Menunggu diproses" tone={stats.pendingCount > 0 ? 'warning' : 'neutral'} compact />
        <MetricCard title="Sukses" value={stats.successCount.toLocaleString('id-ID')} icon={TrendingUp} footnote="Digital + Server berhasil" tone="primary" compact />
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {(['marketplace', 'imei', 'server', 'topup', 'rekber'] as TransactionType[]).map((t) => {
          const cfg = typeConfig[t]
          const Icon = cfg.icon
          const count = t === 'marketplace' ? stats.totalMarketplace : t === 'imei' ? stats.totalImei : t === 'server' ? stats.totalServer : t === 'topup' ? stats.totalTopup : stats.totalRekber
          return (
            <div key={t} className="flex items-center gap-2.5 rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
              <span className={cn('inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', cfg.tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-surface-500">{cfg.label}</p>
                <p className="text-base font-bold text-ink tabular-nums">{count.toLocaleString('id-ID')}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs + Filters */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
              {tabConfig.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="group/ttab shrink-0 px-3 text-xs sm:px-4">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-100 px-1 text-[9px] font-semibold text-surface-600 group-data-[state=active]/ttab:bg-white/20 group-data-[state=active]/ttab:text-white">
                    {counts[t.key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari order code, nama, email, produk..."
              className="flex-1 sm:max-w-md"
              inputClassName="h-9 text-xs"
            />
          </div>

          {/* Status chips */}
          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                    statusFilter === f.id ? 'bg-ink text-white shadow-soft-sm' : 'text-surface-600 hover:text-ink',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
            <Button size="sm" variant="outline" className="mt-2" onClick={() => void load()}>Coba lagi</Button>
          </div>
        )}

        {/* Content (same for all tabs since API handles filtering) */}
        {tabConfig.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <TransactionList items={paginatedItems} loading={loading} onSelect={setSelectedItem} />
            {!loading && (
              <DataPagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                className="mt-4"
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail drawer */}
      <TransactionDetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}


function formatPlatformRevenue(value: string | null, normalizedStatus: NormalizedStatus) {
  if (value == null) return '—'
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '—'
  const pending = normalizedStatus !== 'success'
  return pending ? `${formatPrice(num)}*` : formatPrice(num)
}

function TransactionList({ items, loading, onSelect }: { items: TransactionItem[]; loading: boolean; onSelect: (item: TransactionItem) => void }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-100" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="shadow-soft-xs">
        <CardContent className="p-8 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-surface-400" />
          <p className="text-sm font-semibold text-ink">Tidak ada transaksi ditemukan</p>
          <p className="mt-1 text-xs text-surface-500">Coba ubah filter atau kata kunci pencarian.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-200/70 bg-white shadow-soft-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[130px]">Tanggal</TableHead>
            <TableHead className="min-w-[120px]">Kode Order</TableHead>
            <TableHead className="min-w-[90px]">Tipe</TableHead>
            <TableHead className="min-w-[90px]">Status</TableHead>
            <TableHead className="min-w-[180px]">Produk / Layanan</TableHead>
            <TableHead className="min-w-[120px]">User</TableHead>
            <TableHead className="min-w-[120px]">Seller</TableHead>
            <TableHead className="min-w-[110px] text-right">Nominal</TableHead>
            <TableHead className="min-w-[110px] text-right">Pendapatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const type = typeConfig[item.type]
            const status = statusConfig[item.normalizedStatus]
            const StatusIcon = status.icon
            return (
              <TableRow
                key={`${item.type}-${item.id}`}
                className="cursor-pointer hover:bg-primary-50/40"
                onClick={() => onSelect(item)}
              >
                <TableCell className="align-top text-xs text-surface-600">
                  {formatDateTime(item.createdAt)}
                </TableCell>
                <TableCell className="align-top font-mono text-xs font-semibold text-ink">
                  {item.orderCode}
                </TableCell>
                <TableCell className="align-top">
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', type.tone)}>
                    {type.label}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant={status.variant} className="px-2 py-0.5 text-[10px]">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-xs text-surface-700">{item.title}</TableCell>
                <TableCell className="align-top text-xs">
                  <p className="font-semibold text-ink">{item.user.name}</p>
                  <p className="text-[10px] text-surface-500">{item.user.role}</p>
                </TableCell>
                <TableCell className="align-top text-xs text-surface-700">
                  {item.seller?.name ?? '—'}
                </TableCell>
                <TableCell className="align-top text-right text-xs font-bold tabular-nums text-primary-700">
                  {formatPrice(item.amount)}
                </TableCell>
                <TableCell
                  className={cn(
                    'align-top text-right text-xs font-semibold tabular-nums',
                    item.platformRevenue && Number(item.platformRevenue) > 0
                      ? 'text-emerald-700'
                      : 'text-surface-400',
                  )}
                  title={
                    item.platformRevenue && item.normalizedStatus !== 'success'
                      ? 'Estimasi — terkumpul penuh saat transaksi selesai'
                      : undefined
                  }
                >
                  {formatPlatformRevenue(item.platformRevenue, item.normalizedStatus)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <p className="border-t border-surface-100 px-4 py-2 text-[10px] text-surface-500">
        * Pendapatan estimasi — belum final sampai transaksi sukses/selesai.
      </p>
    </div>
  )
}

function TransactionDetailDrawer({ item, onClose }: { item: TransactionItem | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-surface-200/70 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-surface-200/70 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-surface-500">
                  Detail Transaksi
                </p>
                <h2 className="truncate font-mono text-base font-semibold text-ink">{item.orderCode}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <DrawerBody item={item} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerBody({ item }: { item: TransactionItem }) {
  const type = typeConfig[item.type]
  const status = statusConfig[item.normalizedStatus]
  const TypeIcon = type.icon
  const StatusIcon = status.icon
  const cancelActor = marketplaceOrderCancelActorLabel(
    item.cancelledBy as 'BUYER' | 'SELLER' | 'ADMIN' | 'SYSTEM' | null,
  )
  const cancelReasonTitle = cancelActor ? `Alasan pembatalan (${cancelActor})` : 'Alasan pembatalan'
  const showCancelReason =
    Boolean(item.cancelReason) &&
    (item.normalizedStatus === 'cancelled' || item.normalizedStatus === 'failed')

  return (
    <>
      {/* Status + Type */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status.variant} className="px-2.5 py-1 text-[11px]">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', type.tone)}>
          <TypeIcon className="h-3 w-3" />
          {type.label}
        </span>
        <span className="ml-auto text-[11px] text-surface-500">
          Status asli: <span className="font-semibold text-ink">{item.status}</span>
        </span>
      </div>

      {/* Amount */}
      <div className="rounded-2xl border border-primary-200/60 bg-primary-50/40 p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">Nominal</p>
        <p className="mt-1 text-2xl font-bold text-primary-700 tabular-nums">{formatPrice(item.amount)}</p>
      </div>

      {item.platformRevenue != null && Number(item.platformRevenue) > 0 && (
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Pendapatan Platform
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
            {formatPlatformRevenue(item.platformRevenue, item.normalizedStatus)}
          </p>
          {item.type === 'marketplace' && item.meta.buyerFee && item.meta.sellerFee && (
            <p className="mt-1 text-[10px] text-emerald-800">
              Fee pembeli {formatPrice(item.meta.buyerFee)} + fee penjual {formatPrice(item.meta.sellerFee)}
            </p>
          )}
        </div>
      )}

      {showCancelReason && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3 shadow-soft-xs">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-800">
              {cancelReasonTitle}
            </p>
            <p className="text-[13px] leading-relaxed text-rose-900">{item.cancelReason}</p>
          </div>
        )}

      {/* Title */}
      <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Produk / Layanan</p>
        <p className="text-[13px] font-semibold text-ink">{item.title}</p>
      </div>

      {/* User */}
      <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">User / Buyer</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <dt className="text-surface-500">Nama</dt>
          <dd className="font-semibold text-ink">{item.user.name}</dd>
          <dt className="text-surface-500">Email</dt>
          <dd className="font-semibold text-ink">{item.user.email}</dd>
          <dt className="text-surface-500">Role</dt>
          <dd className="font-semibold text-ink">{item.user.role}</dd>
        </dl>
      </div>

      {/* Seller */}
      {item.seller && (
        <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Seller / Teknisi</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <dt className="text-surface-500">Nama</dt>
            <dd className="font-semibold text-ink">{item.seller.name}</dd>
            <dt className="text-surface-500">Email</dt>
            <dd className="font-semibold text-ink">{item.seller.email}</dd>
          </dl>
        </div>
      )}

      {/* Timestamps */}
      <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Waktu</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <dt className="text-surface-500">Dibuat</dt>
          <dd className="font-semibold text-ink">{formatDateTime(item.createdAt)}</dd>
          <dt className="text-surface-500">Diperbarui</dt>
          <dd className="font-semibold text-ink">{formatDateTime(item.updatedAt)}</dd>
        </dl>
      </div>

      {/* Meta */}
      {item.meta && Object.keys(item.meta).filter((k) => item.meta[k]).length > 0 && (
        <div className="rounded-2xl border border-surface-200/70 bg-surface-50/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Metadata</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            {Object.entries(item.meta)
              .filter(([, v]) => v)
              .map(([key, value]) => (
                <span key={key} className="contents">
                  <dt className="text-surface-500 capitalize">{key}</dt>
                  <dd className="break-all font-semibold text-ink">{value}</dd>
                </span>
              ))}
          </dl>
        </div>
      )}
    </>
  )
}
