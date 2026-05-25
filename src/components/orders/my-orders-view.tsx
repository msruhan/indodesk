'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { DashboardPageHeader, MetricCard, TabPills, FilterSelect } from '@/components/dashboard'
import {
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Zap,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import type { PublicTopupOrderDto } from '@/lib/topup-order-serializer'
import { topupStatusLabelForUi } from '@/lib/user-riwayat-topup'

type OrdersTab = 'shop' | 'topup'
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
  pending: 'warning',
  paid: 'warning',
  processing: 'default',
  shipped: 'default',
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

const SHOP_ACTIVE = ['paid', 'processing', 'shipped'] as const
const TOPUP_ACTIVE = ['pending-payment', 'paid', 'processing', 'fulfilling'] as const

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

type MyOrdersViewProps = {
  /** Base path for list and detail routes, e.g. `/user/orders` or `/teknisi/orders` */
  basePath: string
}

function MyOrdersViewContent({ basePath }: MyOrdersViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab: OrdersTab = searchParams.get('tab') === 'topup' ? 'topup' : 'shop'

  const [shopOrders, setShopOrders] = useState<MarketplaceOrderDto[]>([])
  const [topupOrders, setTopupOrders] = useState<PublicTopupOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const setTab = (tab: OrdersTab) => {
    setStatusFilter('all')
    if (tab === 'topup') {
      router.push(`${basePath}?tab=topup`)
    } else {
      router.push(basePath)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [shopRes, topupRes] = await Promise.all([
        fetch('/api/user/marketplace/orders'),
        fetch('/api/user/topup/orders'),
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
    } catch {
      setError('Gagal memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const combinedStats = useMemo(() => {
    const shopActive = shopOrders.filter((o) =>
      (SHOP_ACTIVE as readonly string[]).includes(o.status),
    ).length
    const topupActive = topupOrders.filter((o) =>
      (TOPUP_ACTIVE as readonly string[]).includes(o.status),
    ).length
    return {
      total: shopOrders.length + topupOrders.length,
      active: shopActive + topupActive,
      completed:
        shopOrders.filter((o) => o.status === 'completed').length +
        topupOrders.filter((o) => o.status === 'completed').length,
    }
  }, [shopOrders, topupOrders])

  const filteredShop = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shopOrders.filter((order) => {
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
  }, [shopOrders, query, statusFilter])

  const filteredTopup = useMemo(() => {
    const q = query.trim().toLowerCase()
    return topupOrders.filter((order) => {
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
  }, [topupOrders, query, statusFilter])

  const list = activeTab === 'shop' ? filteredShop : filteredTopup
  const listCount = list.length

  const statusOptions = [
    { id: 'all' as const, label: 'Semua status' },
    { id: 'active' as const, label: 'Aktif / diproses' },
    { id: 'completed' as const, label: 'Selesai' },
    {
      id: 'cancelled' as const,
      label: activeTab === 'shop' ? 'Dibatalkan / refund' : 'Gagal',
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Order Saya"
        description="Pesanan marketplace dan top up game."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            {activeTab === 'topup' && (
              <Link href="/topup">
                <Button size="sm">Top up lagi</Button>
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
            { id: 'shop', label: 'Shop', count: shopOrders.length },
            { id: 'topup', label: 'Top Up', count: topupOrders.length },
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
              placeholder={
                activeTab === 'shop'
                  ? 'Cari order (kode, produk, penjual)...'
                  : 'Cari order (kode, game, akun)...'
              }
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
        ) : filteredTopup.length === 0 ? (
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
        )}
      </div>
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
