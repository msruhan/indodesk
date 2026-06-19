'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { DashboardMonthFilter, DashboardPageHeader, MetricCard, TabPills, FilterSelect } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import {
  CheckCircle,
  Clock,
  Laptop,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  X,
  Zap,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import type { PublicTopupOrderDto } from '@/lib/topup-order-serializer'
import { topupStatusLabelForUi } from '@/lib/user-riwayat-topup'
import {
  fetchUserImeiRiwayatOrders,
  fetchUserServerRiwayatOrders,
} from '@/lib/user-riwayat-orders'
import type { ImeiOrderStatusUi, PublicImeiOrder, PublicServerOrder } from '@/lib/imei-public'
import { formatImeiDate, formatImeiPrice, isSystemComment } from '@/lib/imei-public'
import { ServerOrderDetailSheet } from '@/components/imei/server-order-history'

type OrdersTab = 'shop' | 'topup' | 'imei' | 'server'
type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const shopStatusVariant: Record<
  MarketplaceOrderDto['status'],
  'success' | 'warning' | 'default' | 'danger'
> = {
  awaiting_payment: 'warning',
  pending: 'warning',
  paid: 'warning',
  processing: 'default',
  shipped: 'default',
  disputed: 'warning',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
}

const topupStatusVariant: Record<
  PublicTopupOrderDto['status'],
  'success' | 'warning' | 'default' | 'danger'
> = {
  'pending-payment': 'warning',
  paid: 'warning',
  processing: 'default',
  fulfilling: 'default',
  completed: 'success',
  failed: 'danger',
}

const imeiStatusVariant: Record<
  ImeiOrderStatusUi,
  'success' | 'warning' | 'default' | 'danger'
> = {
  PENDING: 'warning',
  IN_PROCESS: 'default',
  SUCCESS: 'success',
  REJECTED: 'danger',
  CANCELLED: 'danger',
}

const imeiStatusLabel: Record<ImeiOrderStatusUi, string> = {
  PENDING: 'Pending',
  IN_PROCESS: 'Diproses',
  SUCCESS: 'Berhasil',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
}

const imeiStatusIcon = {
  PENDING: Clock,
  IN_PROCESS: RefreshCw,
  SUCCESS: CheckCircle,
  REJECTED: X,
  CANCELLED: X,
} as const

const SHOP_ACTIVE = ['paid', 'processing', 'shipped', 'disputed'] as const
const TOPUP_ACTIVE = ['pending-payment', 'paid', 'processing', 'fulfilling'] as const
const IMEI_ACTIVE = ['PENDING', 'IN_PROCESS'] as const

function parseOrdersTab(value: string | null): OrdersTab {
  if (value === 'topup' || value === 'imei' || value === 'server') return value
  return 'shop'
}

function matchesShopFilter(status: MarketplaceOrderDto['status'], filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'active') return (SHOP_ACTIVE as readonly string[]).includes(status)
  if (filter === 'completed') return status === 'completed'
  return status === 'cancelled' || status === 'refunded'
}

function matchesTopupFilter(status: PublicTopupOrderDto['status'], filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'active') return (TOPUP_ACTIVE as readonly string[]).includes(status)
  if (filter === 'completed') return status === 'completed'
  return status === 'failed'
}

function matchesImeiFilter(status: ImeiOrderStatusUi, filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'active') return (IMEI_ACTIVE as readonly string[]).includes(status)
  if (filter === 'completed') return status === 'SUCCESS'
  return status === 'REJECTED' || status === 'CANCELLED'
}

type MyOrdersViewProps = {
  /** Base path for list and detail routes, e.g. `/user/orders` or `/teknisi/orders` */
  basePath: string
}

function statusIconClass(status: ImeiOrderStatusUi) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-600'
    case 'IN_PROCESS':
      return 'bg-blue-50 text-blue-600'
    case 'SUCCESS':
      return 'bg-primary-50 text-primary-600'
    default:
      return 'bg-red-50 text-red-600'
  }
}

function ImeiOrderDetailSheet({ order, onClose }: { order: PublicImeiOrder; onClose: () => void }) {
  const systemNote = isSystemComment(order.comments) ? order.comments : null
  const adminComment = order.comments && !isSystemComment(order.comments) ? order.comments : null
  const codeBoxClass =
    order.status === 'SUCCESS'
      ? 'border-primary-100 bg-primary-50/50'
      : order.status === 'REJECTED' || order.status === 'CANCELLED'
        ? 'border-red-100 bg-red-50/40'
        : 'border-surface-200 bg-surface-50'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-surface-200/70 bg-white p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-200 sm:hidden" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{order.orderCode}</p>
            <Badge variant={imeiStatusVariant[order.status]} className="mt-0.5 text-[9px]">
              {imeiStatusLabel[order.status]}
            </Badge>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl bg-surface-50 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-surface-500">{order.serialNumber ? 'Serial Number' : 'Digital'}</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-ink">{order.serialNumber ?? order.imei}</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-500">Harga</p>
                <p className="mt-0.5 text-xs font-bold text-primary-600">{formatImeiPrice(order.price)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-surface-500">Service</p>
                <p className="mt-0.5 text-xs font-medium text-ink">{order.serviceName}</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-500">Dibuat</p>
                <p className="mt-0.5 text-[11px] text-ink">{formatImeiDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-500">Update terakhir</p>
                <p className="mt-0.5 text-[11px] text-ink">{formatImeiDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>
          {order.code && (
            <div className={cn('rounded-xl border p-3', codeBoxClass)}>
              <p className="text-[10px] font-medium text-ink">
                {order.status === 'SUCCESS' ? 'Hasil (CODE supplier)' : 'CODE supplier'}
              </p>
              <pre className="mt-1.5 whitespace-pre-wrap rounded-lg bg-white/70 p-2 text-[11px] leading-relaxed text-ink">
                {order.code}
              </pre>
            </div>
          )}
          {systemNote && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
              <p className="text-[10px] font-medium text-surface-600">Catatan sistem</p>
              <p className="mt-0.5 text-xs text-ink">{systemNote}</p>
            </div>
          )}
          {adminComment && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-[10px] font-medium text-amber-700">Komentar dari admin</p>
              <p className="mt-0.5 text-xs text-ink">{adminComment}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function MyOrdersViewContent({ basePath }: MyOrdersViewProps) {
  const { period } = useDashboardPeriod()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseOrdersTab(searchParams.get('tab'))
  const requestedOrderCode = searchParams.get('q')?.trim() ?? ''

  const [shopOrders, setShopOrders] = useState<MarketplaceOrderDto[]>([])
  const [topupOrders, setTopupOrders] = useState<PublicTopupOrderDto[]>([])
  const [imeiOrders, setImeiOrders] = useState<PublicImeiOrder[]>([])
  const [serverOrders, setServerOrders] = useState<PublicServerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null)
  const [query, setQuery] = useState(() => requestedOrderCode)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedImeiOrder, setSelectedImeiOrder] = useState<PublicImeiOrder | null>(null)
  const [selectedServerOrder, setSelectedServerOrder] = useState<PublicServerOrder | null>(null)
  const [didAutoOpenFromQuery, setDidAutoOpenFromQuery] = useState(false)

  useEffect(() => {
    setQuery(requestedOrderCode)
    setDidAutoOpenFromQuery(false)
  }, [requestedOrderCode])

  const setTab = (tab: OrdersTab) => {
    setStatusFilter('all')
    if (tab === 'shop') {
      router.push(basePath)
      return
    }
    router.push(`${basePath}?tab=${tab}`)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [shopRes, topupRes, imeiList, serverList] = await Promise.all([
        fetch('/api/user/marketplace/orders'),
        fetch('/api/user/topup/orders'),
        fetchUserImeiRiwayatOrders(),
        fetchUserServerRiwayatOrders(),
      ])
      const shopJson = await shopRes.json()
      const topupJson = await topupRes.json()
      if (!shopRes.ok || !shopJson.success) {
        setError(shopJson.error ?? 'Gagal memuat pesanan shop')
        return
      }
      if (!topupRes.ok || !topupJson.success) {
        setError(topupJson.error ?? 'Gagal memuat pesanan top up')
        return
      }
      setShopOrders(shopJson.data ?? [])
      setTopupOrders(topupJson.data ?? [])
      setImeiOrders(imeiList)
      setServerOrders(serverList)
    } catch {
      setError('Gagal memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const periodShopOrders = useMemo(
    () => shopOrders.filter((o) => isDateInPeriod(o.createdAt, period)),
    [shopOrders, period],
  )
  const periodTopupOrders = useMemo(
    () => topupOrders.filter((o) => isDateInPeriod(o.createdAt, period)),
    [topupOrders, period],
  )
  const periodImeiOrders = useMemo(
    () => imeiOrders.filter((o) => isDateInPeriod(o.createdAt, period)),
    [imeiOrders, period],
  )
  const periodServerOrders = useMemo(
    () => serverOrders.filter((o) => isDateInPeriod(o.createdAt, period)),
    [serverOrders, period],
  )

  const combinedStats = useMemo(() => {
    const shopActive = periodShopOrders.filter((o) =>
      (SHOP_ACTIVE as readonly string[]).includes(o.status),
    ).length
    const topupActive = periodTopupOrders.filter((o) =>
      (TOPUP_ACTIVE as readonly string[]).includes(o.status),
    ).length
    const imeiActive = periodImeiOrders.filter((o) =>
      (IMEI_ACTIVE as readonly string[]).includes(o.status),
    ).length
    const serverActive = periodServerOrders.filter((o) =>
      (IMEI_ACTIVE as readonly string[]).includes(o.status),
    ).length
    return {
      total:
        periodShopOrders.length +
        periodTopupOrders.length +
        periodImeiOrders.length +
        periodServerOrders.length,
      active: shopActive + topupActive + imeiActive + serverActive,
      completed:
        periodShopOrders.filter((o) => o.status === 'completed').length +
        periodTopupOrders.filter((o) => o.status === 'completed').length +
        periodImeiOrders.filter((o) => o.status === 'SUCCESS').length +
        periodServerOrders.filter((o) => o.status === 'SUCCESS').length,
    }
  }, [periodShopOrders, periodTopupOrders, periodImeiOrders, periodServerOrders])

  const filteredShop = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodShopOrders.filter((order) => {
      if (!matchesShopFilter(order.status, statusFilter)) return false
      if (!q) return true
      const haystack = [
        order.orderCode,
        order.sellerName,
        order.statusLabel,
        ...order.items.map((i) => i.name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [periodShopOrders, query, statusFilter])

  const filteredTopup = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodTopupOrders.filter((order) => {
      if (!matchesTopupFilter(order.status, statusFilter)) return false
      if (!q) return true
      const haystack = [
        order.orderCode,
        order.productName,
        order.denominationLabel,
        order.accountId,
        order.serverId ?? '',
        topupStatusLabelForUi(order.status),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [periodTopupOrders, query, statusFilter])

  const filteredImei = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodImeiOrders.filter((order) => {
      if (!matchesImeiFilter(order.status, statusFilter)) return false
      if (!q) return true
      const haystack = [order.orderCode, order.serviceName, order.imei, imeiStatusLabel[order.status]]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [periodImeiOrders, query, statusFilter])

  const filteredServer = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodServerOrders.filter((order) => {
      if (!matchesImeiFilter(order.status, statusFilter)) return false
      if (!q) return true
      const haystack = [
        order.orderCode,
        order.serviceName,
        order.boxName ?? '',
        order.email,
        imeiStatusLabel[order.status],
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [periodServerOrders, query, statusFilter])

  useEffect(() => {
    if (!requestedOrderCode || didAutoOpenFromQuery || loading) return
    if (activeTab === 'imei') {
      const match = imeiOrders.find((order) => order.orderCode.toLowerCase() === requestedOrderCode.toLowerCase())
      if (match) {
        setSelectedImeiOrder(match)
        setDidAutoOpenFromQuery(true)
      }
      return
    }
    if (activeTab === 'server') {
      const match = serverOrders.find((order) => order.orderCode.toLowerCase() === requestedOrderCode.toLowerCase())
      if (match) {
        setSelectedServerOrder(match)
        setDidAutoOpenFromQuery(true)
      }
    }
  }, [activeTab, didAutoOpenFromQuery, imeiOrders, loading, requestedOrderCode, serverOrders])

  const list =
    activeTab === 'topup'
      ? filteredTopup
      : activeTab === 'imei'
        ? filteredImei
        : activeTab === 'server'
          ? filteredServer
          : filteredShop
  const listCount = list.length

  const statusOptions = [
    { id: 'all' as const, label: 'Semua status' },
    { id: 'active' as const, label: 'Aktif / diproses' },
    { id: 'completed' as const, label: 'Selesai' },
    {
      id: 'cancelled' as const,
      label:
        activeTab === 'shop'
          ? 'Dibatalkan / refund'
          : activeTab === 'topup'
            ? 'Gagal'
            : 'Ditolak / batal',
    },
  ]

  const searchPlaceholder =
    activeTab === 'shop'
      ? 'Cari order (kode, produk, penjual)...'
      : activeTab === 'topup'
        ? 'Cari order (kode, game, akun)...'
        : activeTab === 'imei'
          ? 'Cari order (kode, layanan, digital)...'
          : 'Cari order (kode, layanan, email)...'

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pesanan"
        description="Pesanan marketplace, top up, digital services, dan server services."
        actions={
          <>
            <DashboardMonthFilter />
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            {activeTab === 'topup' && (
              <Link href="/topup">
                <Button size="sm">Top up lagi</Button>
              </Link>
            )}
            {(activeTab === 'imei' || activeTab === 'server') && (
              <Link href="/imei">
                <Button size="sm">Order layanan</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={combinedStats.total.toString()}
          icon={Package}
          footnote="Semua pesanan"
          tone="primary"
          compact
        />
        <MetricCard
          title="Aktif"
          value={combinedStats.active.toString()}
          icon={Clock}
          footnote="Sedang berjalan"
          tone={combinedStats.active > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Selesai"
          value={combinedStats.completed.toString()}
          icon={CheckCircle}
          footnote="Pesanan tuntas"
          tone="primary"
          compact
        />
      </div>

      <div>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <TabPills
          options={[
            { id: 'shop', label: 'Shop', count: periodShopOrders.length },
            { id: 'topup', label: 'Top Up', count: periodTopupOrders.length },
            { id: 'imei', label: 'Digital Services', count: periodImeiOrders.length },
            { id: 'server', label: 'Server Services', count: periodServerOrders.length },
          ]}
          value={activeTab}
          onChange={(id) => setTab(id)}
          className="mb-4"
        />

        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
            />
          </div>
          <FilterSelect
            options={statusOptions}
            value={statusFilter}
            onChange={(id) => setStatusFilter(id)}
            ariaLabel="Filter status"
            label="Status"
            className="w-full sm:w-[11.5rem]"
          />
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat...' : `${listCount} order`}
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20 p-4" />
              </Card>
            ))}
          </div>
        ) : activeTab === 'shop' ? (
          filteredShop.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-surface-300" />
                <p className="text-sm text-surface-600">Belum ada pesanan marketplace.</p>
                <Link href="/marketplace" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    Jelajahi marketplace
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredShop.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-ink">
                            {order.orderCode}
                          </span>
                          <Badge variant={shopStatusVariant[order.status]}>{order.statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-surface-600">
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                        </p>
                        <p className="mt-1 text-xs text-surface-500">
                          Penjual: {order.sellerName} · {order.dateLabel}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary-700 tabular-nums">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    {order.tracking && (
                      <div className="mt-3 border-t border-surface-100 pt-3">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8"
                            onClick={() => router.push(`${basePath}/${order.id}`)}
                          >
                            <Package className="h-3.5 w-3.5" />
                            Lacak Paket
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              setExpandedTrackingId((id) => (id === order.id ? null : order.id))
                            }
                          >
                            {expandedTrackingId === order.id ? 'Sembunyikan' : 'Riwayat cepat'}
                          </Button>
                        </div>
                        {expandedTrackingId === order.id && (
                          <OrderTrackingTimeline
                            orderId={order.id}
                            apiBase="/api/user/marketplace/orders"
                          />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'topup' ? (
          filteredTopup.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-violet-300" />
                <p className="text-sm text-surface-600">Belum ada order top up.</p>
                <Link href="/topup" className="mt-4 inline-block">
                  <Button variant="primary" size="sm" className="bg-violet-600 hover:bg-violet-700">
                    Top up sekarang
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTopup.map((order) => (
                <Link key={order.id} href={`/topup/order/${order.orderCode}`} className="block">
                  <Card className="transition-all hover:border-violet-200/70 hover:shadow-soft-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-ink">
                              {order.orderCode}
                            </span>
                            <Badge variant={topupStatusVariant[order.status]}>
                              {topupStatusLabelForUi(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-ink">
                            {order.productName} · {order.denominationLabel}
                          </p>
                          <p className="mt-1 text-xs text-surface-500">
                            ID: {order.accountId}
                            {order.serverId ? ` · Server ${order.serverId}` : ''}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-violet-700 tabular-nums">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : activeTab === 'imei' ? (
          filteredImei.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Smartphone className="mx-auto mb-4 h-12 w-12 text-primary-300" />
                <p className="text-sm text-surface-600">Belum ada order digital services.</p>
                <Link href="/imei" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    Order layanan perangkat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredImei.map((order) => (
                <button key={order.id} type="button" className="block w-full text-left" onClick={() => setSelectedImeiOrder(order)}>
                  <Card className="transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-ink">
                              {order.orderCode}
                            </span>
                            <Badge variant={imeiStatusVariant[order.status]}>
                              {imeiStatusLabel[order.status]}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-ink">{order.serviceName}</p>
                          <p className="mt-1 text-xs text-surface-500">
                            Digital {order.imei} · {formatImeiDate(order.createdAt)}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary-700 tabular-nums">
                          {formatPrice(order.price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )
        ) : filteredServer.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Laptop className="mx-auto mb-4 h-12 w-12 text-blue-300" />
              <p className="text-sm text-surface-600">Belum ada order server services.</p>
              <Link href="/imei" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Order layanan server
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredServer.map((order) => (
              <button
                key={order.id}
                type="button"
                className="block w-full text-left"
                onClick={() => setSelectedServerOrder(order)}
              >
                <Card className="transition-all hover:border-blue-200/70 hover:shadow-soft-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-ink">
                            {order.orderCode}
                          </span>
                          <Badge variant={imeiStatusVariant[order.status]}>
                            {imeiStatusLabel[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-ink">{order.serviceName}</p>
                        <p className="mt-1 text-xs text-surface-500">
                          {order.boxName ? `${order.boxName} · ` : ''}
                          {order.email} · {formatImeiDate(order.createdAt)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-700 tabular-nums">
                        {formatPrice(order.price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedImeiOrder && (
          <ImeiOrderDetailSheet order={selectedImeiOrder} onClose={() => setSelectedImeiOrder(null)} />
        )}
        {selectedServerOrder && (
          <ServerOrderDetailSheet
            order={selectedServerOrder}
            onClose={() => setSelectedServerOrder(null)}
            statusIconClass={statusIconClass}
            StatusIcon={imeiStatusIcon[selectedServerOrder.status]}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function MyOrdersView({ basePath }: MyOrdersViewProps) {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-surface-500">Memuat pesanan…</p>}>
      <MyOrdersViewContent basePath={basePath} />
    </Suspense>
  )
}
