'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import { MetricCard } from '@/components/dashboard'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import { MarketplaceOrderDetailModal } from '@/components/marketplace/marketplace-order-detail-modal'
import { SHIPPING_COURIER_OPTIONS } from '@/lib/shipping-courier'
import type { ShippingCourier } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import {
  Check,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  User,
  X,
} from '@/lib/icons'

// We need a Truck icon — use Package as fallback since Truck isn't in icons
const TruckIcon = Package

type StatusFilter = 'all' | 'active' | 'shipped' | 'completed' | 'cancelled'

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'active', label: 'Perlu Aksi' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

const statusConfig: Record<MarketplaceOrderDto['status'], { label: string; variant: 'warning' | 'info' | 'success' | 'danger' | 'default'; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Bayar', variant: 'warning', icon: Clock },
  paid: { label: 'Dibayar', variant: 'warning', icon: CheckCircle },
  processing: { label: 'Diproses', variant: 'info', icon: RefreshCw },
  shipped: { label: 'Dikirim', variant: 'info', icon: TruckIcon },
  completed: { label: 'Selesai', variant: 'success', icon: Check },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: X },
  refunded: { label: 'Refund', variant: 'danger', icon: X },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch { return iso }
}

export default function TeknisiPesananPage() {
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<MarketplaceOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<MarketplaceOrderDto | null>(null)
  const [shipmentForms, setShipmentForms] = useState<Record<string, { courier: ShippingCourier; trackingNumber: string }>>({})
  const [toast, setToast] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedQ(q), 200)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/marketplace/orders')
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.error ?? 'Gagal memuat pesanan'); return }
      setItems(json.data?.items ?? [])
    } catch { setError('Gagal memuat pesanan') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => {
    const active = items.filter((o) => ['paid', 'processing'].includes(o.status)).length
    const shipped = items.filter((o) => o.status === 'shipped').length
    const completed = items.filter((o) => o.status === 'completed').length
    const revenue = items.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0)
    return { total: items.length, active, shipped, completed, revenue }
  }, [items])

  const filtered = useMemo(() => {
    let list = items
    if (statusFilter === 'active') list = list.filter((o) => ['paid', 'processing'].includes(o.status))
    else if (statusFilter === 'shipped') list = list.filter((o) => o.status === 'shipped')
    else if (statusFilter === 'completed') list = list.filter((o) => o.status === 'completed')
    else if (statusFilter === 'cancelled') list = list.filter((o) => ['cancelled', 'refunded'].includes(o.status))

    if (debouncedQ.trim()) {
      const term = debouncedQ.toLowerCase()
      list = list.filter((o) =>
        o.orderCode.toLowerCase().includes(term) ||
        o.items.some((i) => i.name.toLowerCase().includes(term)) ||
        o.buyerName.toLowerCase().includes(term) ||
        (o.tracking?.trackingNumber ?? '').toLowerCase().includes(term),
      )
    }
    return list
  }, [items, statusFilter, debouncedQ])

  const getShipmentForm = (id: string) => shipmentForms[id] ?? { courier: 'JNE' as ShippingCourier, trackingNumber: '' }
  const setShipmentField = (id: string, patch: Partial<{ courier: ShippingCourier; trackingNumber: string }>) => {
    setShipmentForms((prev) => ({ ...prev, [id]: { ...getShipmentForm(id), ...patch } }))
  }

  const advance = async (id: string) => {
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'advance' }) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.error ?? 'Gagal'); return }
      setToast('Status pesanan berhasil diperbarui')
      await load()
    } catch { setError('Gagal memperbarui') }
    finally { setActingId(null) }
  }

  const cancelOrder = async (order: MarketplaceOrderDto) => {
    const confirmed = await confirmDialog({
      title: 'Batalkan pesanan?',
      description: `Batalkan pesanan ${order.orderCode}?\n\nSaldo pembeli (Rp ${order.total.toLocaleString('id-ID')}) akan dikembalikan ke wallet mereka. Stok produk dikembalikan.`,
      variant: 'warning',
      confirmLabel: 'Batalkan',
      cancelLabel: 'Batal',
    })
    if (!confirmed) return
    setActingId(order.id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      setToast('Pesanan dibatalkan. Saldo pembeli telah dikembalikan.')
      setExpandedId(null)
      await load()
    } catch {
      setError('Gagal membatalkan pesanan')
    } finally {
      setActingId(null)
    }
  }

  const submitShipment = async (id: string) => {
    const form = getShipmentForm(id)
    if (!form.trackingNumber.trim()) { setError('Nomor resi wajib diisi'); return }
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_shipment', courier: form.courier, trackingNumber: form.trackingNumber.trim() }) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.error ?? 'Gagal menyimpan resi'); return }
      setToast('Resi berhasil disimpan, paket ditandai dikirim')
      setExpandedId(id)
      await load()
    } catch { setError('Gagal menyimpan resi') }
    finally { setActingId(null) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Pesanan Masuk</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">Kelola pesanan dari pembeli: proses, kirim, dan selesaikan.</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard title="Total Pesanan" value={stats.total.toLocaleString('id-ID')} icon={ShoppingBag} footnote="Semua waktu" tone="primary" compact />
        <MetricCard title="Perlu Aksi" value={stats.active.toLocaleString('id-ID')} icon={Clock} footnote="Dibayar & diproses" tone={stats.active > 0 ? 'warning' : 'neutral'} compact />
        <MetricCard title="Dikirim" value={stats.shipped.toLocaleString('id-ID')} icon={TruckIcon} footnote="Dalam pengiriman" tone="primary" compact />
        <MetricCard title="Revenue" value={formatPrice(stats.revenue)} icon={TrendingUp} footnote={`${stats.completed} pesanan selesai`} tone="primary" compact />
      </div>

      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-700">
          <CheckCircle className="mr-1 inline h-3.5 w-3.5" />
          {toast}
          <button onClick={() => setToast(null)} className="float-right text-xs underline">tutup</button>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
          <button onClick={() => setError(null)} className="float-right text-xs underline">tutup</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="-mx-1 shrink-0 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusFilter(t.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  statusFilter === t.id
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-surface-600 hover:text-primary-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari order, produk, resi..."
          className="min-w-0 w-full flex-1 sm:min-w-[16rem]"
          inputClassName="h-9 text-xs"
        />
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${filtered.length} pesanan ditampilkan`}
      </p>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Card className="shadow-soft-xs">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-surface-400" />
            <p className="text-sm font-semibold text-ink">Belum ada pesanan</p>
            <p className="mt-1 text-xs text-surface-500">Pesanan dari pembeli akan muncul di sini.</p>
          </CardContent>
        </Card>
      )}

      {/* Order List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((order, idx) => {
            const cfg = statusConfig[order.status]
            const StatusIcon = cfg.icon
            const isExpanded = expandedId === order.id
            const form = getShipmentForm(order.id)
            const showTracking = order.tracking && (order.status === 'shipped' || order.status === 'completed')
            const needsAction = order.status === 'paid' || order.status === 'processing'

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
              >
                <Card className={cn(
                  'transition-all duration-300 hover:shadow-soft-md',
                  needsAction && 'border-amber-200/70 bg-amber-50/20',
                  order.status === 'shipped' && 'border-blue-200/50',
                )}>
                  <CardContent className="p-4 sm:p-5">
                    {/* Top row — klik untuk detail */}
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl text-left transition-colors hover:bg-surface-50/80 -m-1 p-1"
                      onClick={() => setDetailOrder(order)}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                          order.status === 'paid' && 'bg-amber-50 text-amber-700 ring-amber-200/70',
                          order.status === 'processing' && 'bg-blue-50 text-blue-700 ring-blue-200/70',
                          order.status === 'shipped' && 'bg-accent-50 text-accent-700 ring-accent-200/70',
                          order.status === 'completed' && 'bg-primary-50 text-primary-700 ring-primary-200/70',
                          (order.status === 'cancelled' || order.status === 'refunded') && 'bg-red-50 text-red-700 ring-red-200/70',
                          order.status === 'pending' && 'bg-surface-100 text-surface-600 ring-surface-200/70',
                        )}>
                          <StatusIcon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[13px] font-semibold text-ink">{order.orderCode}</span>
                            <Badge variant={cfg.variant} className="px-2 py-0.5 text-[10px]">
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[12px] text-surface-600">
                            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-500">
                            <span className="inline-flex items-center gap-1 font-medium text-surface-600">
                              <User className="h-3 w-3" />
                              {order.buyerName}
                            </span>
                            <span>{formatDate(order.createdAt)}</span>
                            {order.tracking && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.tracking.courierLabel} · <span className="font-mono">{order.tracking.trackingNumber}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-primary-700 tabular-nums">{formatPrice(order.total)}</p>
                        {order.tracking?.summaryStatus && (
                          <p className="mt-0.5 text-[10px] font-medium text-primary-600">{order.tracking.summaryStatus}</p>
                        )}
                      </div>
                    </button>

                    {/* Actions */}
                    <div
                      className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-100 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.canAdvanceStatus && order.nextStatus && !order.requiresShipmentInput && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-8"
                          disabled={actingId === order.id}
                          onClick={() => void advance(order.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {order.nextStatus === 'PROCESSING' ? 'Proses Pesanan' : 'Tandai Selesai'}
                        </Button>
                      )}
                      {order.requiresShipmentInput && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-8"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          <TruckIcon className="h-3.5 w-3.5" />
                          Input Resi & Kirim
                        </Button>
                      )}
                      {order.canCancelOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={actingId === order.id}
                          onClick={() => void cancelOrder(order)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Batalkan
                        </Button>
                      )}
                      {showTracking && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {isExpanded ? 'Tutup Tracking' : 'Lacak Paket'}
                        </Button>
                      )}
                    </div>

                    {/* Shipment Input Form */}
                    <AnimatePresence>
                      {isExpanded && order.requiresShipmentInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3 rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50/60 to-accent-50/30 p-4">
                            <div className="flex items-center gap-2">
                              <TruckIcon className="h-4 w-4 text-primary-700" />
                              <p className="text-[12px] font-semibold text-ink">Input Data Pengiriman</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">Kurir</label>
                                <select
                                  className="h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-ink shadow-soft-xs focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                  value={form.courier}
                                  onChange={(e) => setShipmentField(order.id, { courier: e.target.value as ShippingCourier })}
                                >
                                  {SHIPPING_COURIER_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">Nomor Resi / AWB</label>
                                <Input
                                  placeholder="Contoh: JNE1234567890"
                                  value={form.trackingNumber}
                                  onChange={(e) => setShipmentField(order.id, { trackingNumber: e.target.value })}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="h-9 w-full"
                              disabled={actingId === order.id || !form.trackingNumber.trim()}
                              onClick={() => void submitShipment(order.id)}
                            >
                              {actingId === order.id ? 'Memvalidasi resi…' : 'Simpan Resi & Tandai Dikirim'}
                            </Button>
                            <p className="text-[10px] text-surface-500">
                              Resi akan divalidasi ke kurir. Pembaruan lokasi otomatis setiap beberapa jam.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tracking Timeline */}
                    <AnimatePresence>
                      {isExpanded && showTracking && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <OrderTrackingTimeline
                            orderId={order.id}
                            apiBase="/api/teknisi/marketplace/orders"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <MarketplaceOrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  )
}
