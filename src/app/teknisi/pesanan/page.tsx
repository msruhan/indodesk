'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import { MarketplaceOrderDetailModal } from '@/components/marketplace/marketplace-order-detail-modal'
import { PackagingProofForm } from '@/components/marketplace/packaging-proof-form'
import { SellerShipmentCourierField } from '@/components/shipping/seller-shipment-courier-field'
import { CheckoutShippingOrderHint } from '@/components/shipping/checkout-shipping-order-hint'
import { ShippingLabelDownloadButton } from '@/components/shipping/shipping-label-download-button'
import type { ShippingCourier } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancellation'
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
  awaiting_payment: { label: 'Menunggu Bayar', variant: 'warning', icon: Clock },
  pending: { label: 'Menunggu Bayar', variant: 'warning', icon: Clock },
  paid: { label: 'Dibayar', variant: 'warning', icon: CheckCircle },
  processing: { label: 'Diproses', variant: 'info', icon: RefreshCw },
  shipped: { label: 'Dikirim', variant: 'info', icon: TruckIcon },
  disputed: { label: 'Komplain', variant: 'danger', icon: Clock },
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
  const searchParams = useSearchParams()
  const { period, label: periodLabel } = useDashboardPeriod()
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
  const [complaintResponses, setComplaintResponses] = useState<Record<string, string>>({})
  const [returnRejectReasons, setReturnRejectReasons] = useState<Record<string, string>>({})
  const [returnRejectPhotos, setReturnRejectPhotos] = useState<Record<string, File[]>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<MarketplaceOrderDto | null>(null)
  const [cancelAction, setCancelAction] = useState<'cancel' | 'reject_order'>('cancel')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelRejectResponses, setCancelRejectResponses] = useState<Record<string, string>>({})

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

  const focusHandled = useRef(false)
  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (!focusId || focusHandled.current || loading) return
    focusHandled.current = true
    setExpandedId(focusId)
    requestAnimationFrame(() => {
      document.getElementById(`order-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [searchParams, loading])

  const periodItems = useMemo(
    () => items.filter((o) => isDateInPeriod(o.createdAt, period)),
    [items, period],
  )

  const stats = useMemo(() => {
    const active = periodItems.filter((o) => ['paid', 'processing'].includes(o.status)).length
    const shipped = periodItems.filter((o) => o.status === 'shipped').length
    const completed = periodItems.filter((o) => o.status === 'completed').length
    const revenue = periodItems.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0)
    return { total: periodItems.length, active, shipped, completed, revenue }
  }, [periodItems])

  const filtered = useMemo(() => {
    let list = periodItems
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
  }, [periodItems, statusFilter, debouncedQ])

  const getShipmentForm = (order: MarketplaceOrderDto) =>
    shipmentForms[order.id] ?? {
      courier: order.checkoutShippingCourierEnum ?? ('JNE' as ShippingCourier),
      trackingNumber: '',
    }

  const setShipmentField = (
    order: MarketplaceOrderDto,
    patch: Partial<{ courier: ShippingCourier; trackingNumber: string }>,
  ) => {
    setShipmentForms((prev) => ({ ...prev, [order.id]: { ...getShipmentForm(order), ...patch } }))
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

  const cancelOrder = async () => {
    if (!cancelTarget) return
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setError(`Alasan pembatalan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }
    setActingId(cancelTarget.id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${cancelTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: cancelAction, reason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      setToast(
        cancelAction === 'reject_order'
          ? 'Pesanan ditolak. Dana pembeli telah dikembalikan ke Saldo Bantoo.'
          : 'Pesanan dibatalkan. Dana pembeli telah dikembalikan.',
      )
      setCancelTarget(null)
      setCancelReason('')
      setExpandedId(null)
      await load()
    } catch {
      setError('Gagal membatalkan pesanan')
    } finally {
      setActingId(null)
    }
  }

  const respondCancelRequest = async (
    orderId: string,
    action: 'approve_cancel_request' | 'reject_cancel_request',
  ) => {
    setActingId(orderId)
    setError(null)
    try {
      const body =
        action === 'reject_cancel_request'
          ? {
              action,
              response: (cancelRejectResponses[orderId] ?? '').trim() || undefined,
            }
          : { action }
      const res = await fetch(`/api/teknisi/marketplace/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal merespons pengajuan')
        return
      }
      setToast(
        action === 'approve_cancel_request'
          ? 'Pembatalan disetujui — dana dikembalikan ke Saldo Bantoo.'
          : 'Pengajuan pembatalan ditolak.',
      )
      await load()
    } catch {
      setError('Gagal merespons pengajuan')
    } finally {
      setActingId(null)
    }
  }

  const submitShipment = async (order: MarketplaceOrderDto) => {
    const form = getShipmentForm(order)
    if (!form.trackingNumber.trim()) { setError('Nomor resi wajib diisi'); return }
    setActingId(order.id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_shipment', courier: form.courier, trackingNumber: form.trackingNumber.trim() }) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.error ?? 'Gagal menyimpan resi'); return }
      setToast('Resi berhasil disimpan, paket ditandai dikirim')
      setExpandedId(order.id)
      await load()
    } catch { setError('Gagal menyimpan resi') }
    finally { setActingId(null) }
  }

  const submitComplaintResponse = async (orderId: string) => {
    const response = (complaintResponses[orderId] ?? '').trim()
    if (response.length < 10) {
      setError('Respons komplain minimal 10 karakter')
      return
    }
    setActingId(orderId)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${orderId}/complaint/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan respons')
        return
      }
      setToast('Respons komplain berhasil dikirim')
      await load()
    } catch {
      setError('Gagal menyimpan respons')
    } finally {
      setActingId(null)
    }
  }

  const confirmReturn = async (orderId: string) => {
    setActingId(orderId)
    setError(null)
    try {
      const res = await fetch(
        `/api/teknisi/marketplace/orders/${orderId}/complaint/return/confirm`,
        { method: 'POST' },
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengonfirmasi retur')
        return
      }
      setToast('Retur dikonfirmasi, refund diproses')
      await load()
    } catch {
      setError('Gagal mengonfirmasi retur')
    } finally {
      setActingId(null)
    }
  }

  const rejectReturn = async (orderId: string) => {
    const reason = (returnRejectReasons[orderId] ?? '').trim()
    if (reason.length < 20) {
      setError('Alasan penolakan minimal 20 karakter')
      return
    }
    const photos = returnRejectPhotos[orderId] ?? []
    if (photos.length < 1) {
      setError('Minimal 1 foto bukti penolakan wajib')
      return
    }
    setActingId(orderId)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('reason', reason)
      photos.forEach((f) => fd.append('rejectPhotos', f))
      const res = await fetch(
        `/api/teknisi/marketplace/orders/${orderId}/complaint/return/reject`,
        { method: 'POST', body: fd },
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menolak retur')
        return
      }
      setToast('Penolakan retur dieskalasi ke admin')
      await load()
    } catch {
      setError('Gagal menolak retur')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Pesanan Masuk</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">Kelola pesanan dari pembeli: proses, kirim, dan selesaikan.</p>
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
        <MetricCard title="Total Pesanan" value={stats.total.toLocaleString('id-ID')} icon={ShoppingBag} footnote={periodLabel} tone="primary" dense />
        <MetricCard title="Perlu Aksi" value={stats.active.toLocaleString('id-ID')} icon={Clock} footnote="Dibayar & diproses" tone={stats.active > 0 ? 'warning' : 'neutral'} dense />
        <MetricCard title="Dikirim" value={stats.shipped.toLocaleString('id-ID')} icon={TruckIcon} footnote="Dalam pengiriman" tone="primary" dense />
        <MetricCard title="Revenue" value={formatPrice(stats.revenue)} icon={TrendingUp} footnote={`${stats.completed} pesanan selesai`} tone="primary" dense />
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
                  'rounded-full px-2 py-1 text-[10px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-[11px]',
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
        <div className="space-y-2 sm:space-y-3">
          {filtered.map((order, idx) => {
            const cfg = statusConfig[order.status]
            const StatusIcon = cfg.icon
            const isExpanded = expandedId === order.id
            const form = getShipmentForm(order)
            const showTracking = order.tracking && (order.status === 'shipped' || order.status === 'completed')
            const needsAction = order.status === 'paid' || order.status === 'processing'

            return (
              <motion.div
                key={order.id}
                id={`order-${order.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
              >
                <Card className={cn(
                  'transition-all duration-300 hover:shadow-soft-md',
                  needsAction && 'border-amber-200/70 bg-amber-50/20',
                  order.status === 'shipped' && 'border-blue-200/50',
                )}>
                  <CardContent className="p-2.5 sm:p-5">
                    {/* Top row — klik untuk detail */}
                    <button
                      type="button"
                      className="-m-0.5 flex w-full cursor-pointer items-start justify-between gap-2 rounded-xl p-0.5 text-left transition-colors hover:bg-surface-50/80 sm:-m-1 sm:gap-3 sm:p-1"
                      onClick={() => setDetailOrder(order)}
                    >
                      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                        <span className={cn(
                          'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ring-inset sm:h-10 sm:w-10 sm:rounded-xl',
                          order.status === 'paid' && 'bg-amber-50 text-amber-700 ring-amber-200/70',
                          order.status === 'processing' && 'bg-blue-50 text-blue-700 ring-blue-200/70',
                          order.status === 'shipped' && 'bg-accent-50 text-accent-700 ring-accent-200/70',
                          order.status === 'completed' && 'bg-primary-50 text-primary-700 ring-primary-200/70',
                          (order.status === 'cancelled' || order.status === 'refunded') && 'bg-red-50 text-red-700 ring-red-200/70',
                          order.status === 'pending' && 'bg-surface-100 text-surface-600 ring-surface-200/70',
                        )}>
                          <StatusIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-mono text-[11px] font-semibold text-ink sm:text-[13px]">{order.orderCode}</span>
                            <Badge variant={cfg.variant} className="px-1.5 py-0 text-[9px] sm:px-2 sm:py-0.5 sm:text-[10px]">
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[10px] text-surface-600 sm:mt-1 sm:text-[12px]">
                            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-surface-500 sm:mt-1.5 sm:gap-x-3 sm:text-[11px]">
                            <span className="inline-flex items-center gap-0.5 font-medium text-surface-600 sm:gap-1">
                              <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {order.buyerName}
                            </span>
                            <span>{formatDate(order.createdAt)}</span>
                            {order.tracking && (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="truncate">{order.tracking.courierLabel}</span>
                                <span className="font-mono">{order.tracking.trackingNumber}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-primary-700 sm:text-base">{formatPrice(order.total)}</p>
                        {order.tracking?.summaryStatus && (
                          <p className="mt-0.5 text-[9px] font-medium text-primary-600 sm:text-[10px]">{order.tracking.summaryStatus}</p>
                        )}
                      </div>
                    </button>

                    {/* Actions */}
                    <div
                      className="mt-2 flex flex-wrap items-center gap-1 border-t border-surface-100 pt-2 sm:mt-3 sm:gap-2 sm:pt-3 [&_button]:h-7 [&_button]:px-2 [&_button]:text-[10px] sm:[&_button]:h-8 sm:[&_button]:text-xs"
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
                          {order.nextStatus === 'PROCESSING' ? 'Proses Pesanan' : 'Lanjutkan'}
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
                      {order.canDownloadShippingLabel && (
                        <ShippingLabelDownloadButton
                          orderId={order.id}
                          orderCode={order.orderCode}
                        />
                      )}
                      {order.canRejectNewOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={actingId === order.id}
                          onClick={() => {
                            setCancelAction('reject_order')
                            setCancelTarget(order)
                            setCancelReason('')
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          Tolak Pesanan
                        </Button>
                      )}
                      {order.canCancelOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={actingId === order.id}
                          onClick={() => {
                            setCancelAction('cancel')
                            setCancelTarget(order)
                            setCancelReason('')
                          }}
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

                    {(order.requiresPackagingProof ||
                      order.canSubmitPackagingProof ||
                      order.packagingProof) && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <PackagingProofForm
                          orderId={order.id}
                          proof={order.packagingProof}
                          canSubmit={order.canSubmitPackagingProof}
                          requiresProof={order.requiresPackagingProof}
                          onSuccess={() => {
                            setToast('Bukti packaging berhasil dikirim')
                            void load()
                          }}
                        />
                      </div>
                    )}

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
                            <CheckoutShippingOrderHint
                              courierLabel={order.checkoutShippingCourierLabel}
                              service={order.checkoutShippingService}
                              shippingCost={order.shippingCost}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">Kurir</label>
                                <SellerShipmentCourierField
                                  value={form.courier}
                                  lockedCourier={order.checkoutShippingCourierEnum}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">Nomor Resi / AWB</label>
                                <Input
                                  placeholder="Contoh: JNE1234567890"
                                  value={form.trackingNumber}
                                  onChange={(e) => setShipmentField(order, { trackingNumber: e.target.value })}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="h-9 w-full"
                              disabled={actingId === order.id || !form.trackingNumber.trim()}
                              onClick={() => void submitShipment(order)}
                            >
                              {actingId === order.id ? 'Memvalidasi resi…' : 'Simpan Resi & Tandai Dikirim'}
                            </Button>
                            <p className="text-[10px] text-surface-500">
                              Resi divalidasi ke kurir: harus baru dikirim (maks. 48 jam) dan belum sampai.
                              Resi lama atau yang sudah terkirim ditolak.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {order.canRespondToCancelRequest && order.cancellationRequest && (
                      <div className="mt-3 space-y-2 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
                        <p className="text-[12px] font-semibold text-ink">Pengajuan pembatalan pembeli</p>
                        <p className="text-[11px] text-surface-700">{order.cancellationRequest.reason}</p>
                        {order.cancellationRequest.sellerDeadline && (
                          <p className="text-[10px] text-surface-500">
                            Batas respons: {formatDate(order.cancellationRequest.sellerDeadline)}
                          </p>
                        )}
                        <textarea
                          value={cancelRejectResponses[order.id] ?? ''}
                          onChange={(e) =>
                            setCancelRejectResponses((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Alasan penolakan (opsional, min. 20 karakter jika diisi)"
                          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8"
                            disabled={actingId === order.id}
                            onClick={() => void respondCancelRequest(order.id, 'approve_cancel_request')}
                          >
                            Setujui Pembatalan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-rose-200 text-rose-700"
                            disabled={actingId === order.id}
                            onClick={() => void respondCancelRequest(order.id, 'reject_cancel_request')}
                          >
                            Tolak Pengajuan
                          </Button>
                        </div>
                      </div>
                    )}

                    {order.awaitingBuyerConfirmation && (
                      <p className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
                        Menunggu konfirmasi pembeli — penjual tidak dapat menandai selesai manual.
                      </p>
                    )}

                    {order.canRespondToComplaint && order.complaint && (
                      <div className="mt-3 space-y-2 rounded-2xl border border-rose-200/70 bg-rose-50/40 p-4">
                        <p className="text-[12px] font-semibold text-ink">Komplain pembeli</p>
                        <p className="text-[11px] text-surface-700">{order.complaint.reason}</p>
                        <textarea
                          value={complaintResponses[order.id] ?? ''}
                          onChange={(e) =>
                            setComplaintResponses((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Tulis respons Anda (min. 10 karakter)"
                          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-8"
                          disabled={actingId === order.id}
                          onClick={() => void submitComplaintResponse(order.id)}
                        >
                          Kirim Respons
                        </Button>
                      </div>
                    )}

                    {order.canConfirmReturn && order.complaint && (
                      <div className="mt-3 space-y-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4">
                        <p className="text-[12px] font-semibold text-ink">Konfirmasi barang retur</p>
                        <p className="text-[11px] text-surface-700">
                          Barang retur telah sampai. Konfirmasi jika kondisi sesuai untuk memproses refund,
                          atau tolak jika tidak sesuai.
                        </p>
                        {order.complaint.returnTrackingNumber && (
                          <p className="text-[10px] text-surface-500">
                            Resi retur: {order.complaint.returnCourier} ·{' '}
                            {order.complaint.returnTrackingNumber}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8"
                            disabled={actingId === order.id}
                            onClick={() => void confirmReturn(order.id)}
                          >
                            Konfirmasi Diterima
                          </Button>
                        </div>
                        <textarea
                          value={returnRejectReasons[order.id] ?? ''}
                          onChange={(e) =>
                            setReturnRejectReasons((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Alasan tolak kondisi retur (min. 20 karakter)"
                          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            setReturnRejectPhotos((prev) => ({
                              ...prev,
                              [order.id]: Array.from(e.target.files ?? []),
                            }))
                          }
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-rose-200 text-rose-700"
                          disabled={actingId === order.id}
                          onClick={() => void rejectReturn(order.id)}
                        >
                          Tolak Kondisi Retur
                        </Button>
                      </div>
                    )}

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

      <MarketplaceOrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        fullDetailHref={detailOrder ? `/teknisi/pesanan/${detailOrder.id}` : null}
        onOrderUpdated={(updated) => {
          setDetailOrder(updated)
          setItems((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
        }}
      />

      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setCancelTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-5 shadow-soft-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-ink">
                {cancelAction === 'reject_order' ? 'Tolak pesanan' : 'Batalkan pesanan'}
              </h3>
              <p className="mt-1 text-xs text-surface-600">
                {cancelTarget.orderCode} — dana pembeli akan dikembalikan ke Saldo Bantoo.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={`Tulis alasan pembatalan (min. ${CANCEL_REASON_MIN_LENGTH} karakter)`}
                className="mt-3 min-h-[100px] w-full rounded-xl border border-surface-200 px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {cancelReason.trim().length > 0 &&
                cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Alasan minimal {CANCEL_REASON_MIN_LENGTH} karakter (
                    {cancelReason.trim().length}/{CANCEL_REASON_MIN_LENGTH})
                  </p>
                )}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={
                    actingId === cancelTarget.id ||
                    cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH
                  }
                  onClick={() => void cancelOrder()}
                >
                  {actingId === cancelTarget.id
                    ? 'Memproses…'
                    : cancelAction === 'reject_order'
                      ? 'Tolak pesanan'
                      : 'Batalkan pesanan'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
