'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { SectionTabs } from '@/components/mobile/section-tabs'
import { marketplaceTabs } from '@/lib/section-tab-config'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Reveal, AuroraBackground } from '@/components/motion'
import {
  Search,
  Clock,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  Copy,
  FileText,
  AlertCircle,
  Package,
} from '@/lib/icons'
import {
  formatImeiDate,
  formatImeiPrice,
  isSystemComment,
  mapApiOrder,
  mapApiServerOrder,
  type ImeiOrderStatusUi,
  type PublicImeiOrder,
  type PublicServerOrder,
} from '@/lib/imei-public'
import {
  ServerOrderDetailSheet,
  serverOrderSummary,
} from '@/components/imei/server-order-history'
import { CatalogTabs, type CatalogTab } from '@/components/imei/catalog-tabs'

type StatusFilter = ImeiOrderStatusUi | 'all'

const statusConfig: Record<
  ImeiOrderStatusUi,
  { label: string; variant: 'warning' | 'info' | 'success' | 'danger'; icon: typeof Clock }
> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  IN_PROCESS: { label: 'Diproses', variant: 'info', icon: RefreshCw },
  SUCCESS: { label: 'Berhasil', variant: 'success', icon: Check },
  REJECTED: { label: 'Ditolak', variant: 'danger', icon: X },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger', icon: X },
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

function truncateCode(text: string, max = 72) {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function OrderDetailSheet({ order, onClose }: { order: PublicImeiOrder; onClose: () => void }) {
  const config = statusConfig[order.status]
  const StatusIcon = config.icon
  const systemNote = isSystemComment(order.comments) ? order.comments : null
  const adminComment =
    order.comments && !isSystemComment(order.comments) ? order.comments : null
  const codeBoxClass =
    order.status === 'SUCCESS'
      ? 'border-primary-100 bg-primary-50/50'
      : order.status === 'REJECTED' || order.status === 'CANCELLED'
        ? 'border-red-100 bg-red-50/40'
        : 'border-surface-200 bg-surface-50'

  const copyCode = () => {
    if (order.code) navigator.clipboard.writeText(order.code)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-surface-200/70 bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-200 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', statusIconClass(order.status))}>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{order.orderCode}</p>
              <Badge variant={config.variant} className="text-[9px] mt-0.5">
                {config.label}
              </Badge>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl bg-surface-50 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-surface-500">Nomor perangkat</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-ink">{order.imei}</p>
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

          {order.note && (
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500">Catatan</p>
              <p className="mt-0.5 text-xs text-ink">{order.note}</p>
            </div>
          )}

          {order.code && (
            <div className={cn('rounded-xl border p-3', codeBoxClass)}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-ink">
                  {order.status === 'SUCCESS' ? 'Hasil (CODE supplier)' : 'CODE supplier'}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-white/80"
                >
                  <Copy className="h-2.5 w-2.5" />
                  Copy
                </button>
              </div>
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
            <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3">
              <p className="text-[10px] font-medium text-amber-700">Komentar dari admin</p>
              <p className="mt-0.5 text-xs text-ink">{adminComment}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ImeiOrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderTab: CatalogTab = searchParams.get('tab') === 'server' ? 'server' : 'imei'

  const [query, setQuery] = useState(() => searchParams.get('q')?.trim() ?? '')

  useEffect(() => {
    const q = searchParams.get('q')?.trim()
    if (q) setQuery(q)
  }, [searchParams])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<PublicImeiOrder | null>(null)
  const [selectedServerOrder, setSelectedServerOrder] = useState<PublicServerOrder | null>(null)
  const [orders, setOrders] = useState<PublicImeiOrder[]>([])
  const [serverOrders, setServerOrders] = useState<PublicServerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const setOrderTab = (tab: CatalogTab) => {
    setSelectedOrder(null)
    setSelectedServerOrder(null)
    if (tab === 'server') {
      router.push('/imei/orders?tab=server')
    } else {
      router.push('/imei/orders')
    }
  }

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setFetchError(null)
    setNeedsLogin(false)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (query.trim()) params.set('q', query.trim())

      if (orderTab === 'server') {
        const res = await fetch(`/api/imei/server-orders?${params}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.status === 401) {
          setNeedsLogin(true)
          setServerOrders([])
          return
        }
        if (!res.ok || !json.success) {
          setFetchError(json.error ?? 'Gagal memuat order server')
          setServerOrders([])
          return
        }
        setServerOrders((json.data ?? []).map(mapApiServerOrder))
        return
      }

      const res = await fetch(`/api/imei/orders?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 401) {
        setNeedsLogin(true)
        setOrders([])
        return
      }
      if (!res.ok || !json.success) {
        setFetchError(json.error ?? 'Gagal memuat order')
        setOrders([])
        return
      }
      setOrders((json.data ?? []).map(mapApiOrder))
    } catch {
      if (!silent) setFetchError('Koneksi gagal. Coba lagi.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [orderTab, query, statusFilter])

  useEffect(() => {
    const t = setTimeout(() => loadOrders(false), query ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadOrders, query, orderTab])

  const activeList = orderTab === 'server' ? serverOrders : orders
  const hasActiveOrders = activeList.some(
    (o) => o.status === 'PENDING' || o.status === 'IN_PROCESS',
  )

  useEffect(() => {
    if (!hasActiveOrders || needsLogin) return
    const id = setInterval(() => loadOrders(true), 60_000)
    return () => clearInterval(id)
  }, [hasActiveOrders, needsLogin, loadOrders])

  const filteredImei = useMemo(() => orders, [orders])
  const filteredServer = useMemo(() => serverOrders, [serverOrders])
  const listCount = orderTab === 'server' ? filteredServer.length : filteredImei.length

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <section className="relative overflow-hidden pb-4 lg:pt-28">
        <AuroraBackground intensity="subtle" />
        <SectionTabs tabs={marketplaceTabs} layoutId="marketplace-section-tab" variant="merged" />

        <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8">
          <Reveal noBlur>
            <div className="flex items-center gap-3">
              <Link
                href="/imei"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200/70 bg-white/70 text-surface-600 backdrop-blur-md hover:bg-white hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
                  Riwayat Order
                </h1>
                <p className="text-xs text-surface-500">Lacak status order dan lihat hasil</p>
                {hasActiveOrders && (
                  <p className="mt-1 text-[10px] text-primary-600">
                    Status order diperbarui otomatis dari server (~1–2 menit).
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <CatalogTabs value={orderTab} onChange={setOrderTab} className="mb-4" />

        {needsLogin && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Link href="/login" className="font-semibold underline">
              Login
            </Link>{' '}
            untuk melihat riwayat order kamu.
          </div>
        )}

        {fetchError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{fetchError}</span>
            <Button variant="ghost" size="sm" onClick={() => loadOrders()}>
              Coba lagi
            </Button>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className={cn(searchInputIconClass, 'left-3')} strokeWidth={2} aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari order (nomor, kode, service)..."
              className="h-9 pl-9 text-xs"
              disabled={needsLogin}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {(['all', 'PENDING', 'IN_PROCESS', 'SUCCESS', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                disabled={needsLogin}
                className={cn(
                  'flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'border border-surface-200/70 bg-white/70 text-surface-700 hover:bg-white',
                )}
              >
                {status === 'all' ? 'Semua' : statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat...' : `${listCount} order`}
        </p>

        <div className="space-y-2 pb-20 lg:pb-0">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20 p-4" />
                </Card>
              ))
            : orderTab === 'imei'
              ? filteredImei.map((order, idx) => {
                const config = statusConfig[order.status]
                const StatusIcon = config.icon
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer transition-all hover:border-primary-200/70 hover:shadow-soft-sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                              statusIconClass(order.status),
                            )}
                          >
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold text-ink">{order.orderCode}</p>
                              <Badge variant={config.variant} className="text-[8px] px-1.5 py-0">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-surface-600">{order.serviceName}</p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-surface-400">
                              <span className="font-mono">{order.imei}</span>
                              <span>·</span>
                              <span className="font-semibold text-primary-700">{formatImeiPrice(order.price)}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[10px] text-surface-400">
                              {formatImeiDate(order.createdAt).split(',')[0]}
                            </p>
                            {order.code && (
                              <p className="mt-1 max-w-[140px] truncate text-[9px] text-surface-600 sm:max-w-[200px]">
                                {truncateCode(order.code)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
              : filteredServer.map((order, idx) => {
                  const config = statusConfig[order.status]
                  const StatusIcon = config.icon
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.3 }}
                    >
                      <Card
                        className="cursor-pointer transition-all hover:border-amber-200/70 hover:shadow-soft-sm"
                        onClick={() => setSelectedServerOrder(order)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                                order.status === 'PENDING' || order.status === 'IN_PROCESS'
                                  ? 'bg-amber-50 text-amber-600'
                                  : statusIconClass(order.status),
                              )}
                            >
                              {order.status === 'PENDING' || order.status === 'IN_PROCESS' ? (
                                <Package className="h-4 w-4" />
                              ) : (
                                <StatusIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[12px] font-semibold text-ink">{order.orderCode}</p>
                                <Badge variant={config.variant} className="text-[8px] px-1.5 py-0">
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-surface-600">
                                {order.serviceName}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-surface-400">
                                <span className="truncate">{serverOrderSummary(order)}</span>
                                <span>·</span>
                                <span className="font-semibold text-amber-700">
                                  {formatImeiPrice(order.price)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-[10px] text-surface-400">
                                {formatImeiDate(order.createdAt).split(',')[0]}
                              </p>
                              {order.code && (
                                <p className="mt-1 max-w-[140px] truncate text-[9px] text-surface-600 sm:max-w-[200px]">
                                  {truncateCode(order.code)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
        </div>

        {!loading && !needsLogin && listCount === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
            {orderTab === 'server' ? (
              <Package className="mx-auto h-6 w-6 text-amber-400" />
            ) : (
              <FileText className="mx-auto h-6 w-6 text-surface-300" />
            )}
            <p className="mt-3 text-sm font-semibold text-ink">Belum ada order</p>
            <p className="mt-1 text-xs text-surface-500">
              {orderTab === 'server'
                ? 'Order server service pertamamu akan muncul di sini.'
                : 'Order layanan pertamamu dan lacak statusnya di sini.'}
            </p>
            <Link href="/imei">
              <Button
                variant="primary"
                size="sm"
                className={cn('mt-4', orderTab === 'server' && 'bg-amber-600 hover:bg-amber-700')}
              >
                {orderTab === 'server' ? 'Order Server Services' : 'Lihat Layanan'}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedOrder && <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        {selectedServerOrder && (
          <ServerOrderDetailSheet
            order={selectedServerOrder}
            onClose={() => setSelectedServerOrder(null)}
            statusIconClass={statusIconClass}
            StatusIcon={statusConfig[selectedServerOrder.status].icon}
          />
        )}
      </AnimatePresence>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}

export default function ImeiOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-50 text-sm text-surface-500">
          Memuat riwayat order...
        </div>
      }
    >
      <ImeiOrdersPageContent />
    </Suspense>
  )
}
