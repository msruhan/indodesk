'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Check,
  CheckCircle,
  MapPin,
  Package,
  RefreshCw,
} from '@/lib/icons'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import { MarketplaceOrderReviewForm } from '@/components/orders/marketplace-order-review-form'
import { MarketplaceOrderCancelReasonCard } from '@/components/marketplace/marketplace-order-cancel-reason'
import {
  MarketplaceComplaintForm,
  formatBuyerActionDeadline,
} from '@/components/orders/marketplace-complaint-form'
import { MarketplaceComplaintReturnForm } from '@/components/orders/marketplace-complaint-return-form'
import type { OrderTrackingDto } from '@/lib/order-tracking-sync'
import type { ReturnTrackingDto } from '@/lib/return-tracking-sync'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancellation'

type MarketplaceOrderDetailViewProps = {
  listHref?: string
}

export function MarketplaceOrderDetailView({
  listHref = '/user/orders',
}: MarketplaceOrderDetailViewProps) {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<MarketplaceOrderDto | null>(null)
  const [tracking, setTracking] = useState<OrderTrackingDto | null>(null)
  const [returnTracking, setReturnTracking] = useState<ReturnTrackingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, trackingRes, returnTrackingRes] = await Promise.all([
        fetch('/api/user/marketplace/orders').then((r) => r.json()),
        fetch(`/api/user/marketplace/orders/${orderId}/tracking`).then((r) => r.json()),
        fetch(`/api/user/marketplace/orders/${orderId}/complaint/return/tracking`).then((r) =>
          r.json(),
        ),
      ])
      if (ordersRes.success) {
        const found = (ordersRes.data as MarketplaceOrderDto[]).find((o) => o.id === orderId)
        setOrder(found ?? null)
      }
      if (trackingRes.success) {
        setTracking(trackingRes.data?.tracking ?? null)
      }
      if (returnTrackingRes.success) {
        setReturnTracking(returnTrackingRes.data?.tracking ?? null)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-100" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-surface-400" />
        <p className="text-sm text-surface-600">Pesanan tidak ditemukan</p>
        <Link href={listHref}>
          <Button variant="outline" size="sm" className="mt-4">
            Lihat semua order
          </Button>
        </Link>
      </div>
    )
  }

  const statusSteps = ['pending', 'paid', 'processing', 'shipped', 'completed'] as const
  const progressStatus =
    order.status === 'disputed'
      ? 'shipped'
      : order.status === 'awaiting_payment'
        ? 'pending'
        : order.status
  const currentStepIdx = statusSteps.indexOf(progressStatus as (typeof statusSteps)[number])
  const isShipped =
    order.status === 'shipped' || order.status === 'disputed' || order.status === 'completed'
  const trackingDelivered =
    isTerminalTrackingStatus(tracking?.summaryStatus ?? order.tracking?.summaryStatus)
  const isOrderCompleted = order.status === 'completed'

  const handleConfirmReceipt = async () => {
    setConfirmLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/confirm`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Konfirmasi gagal')
        return
      }
      setOrder(json.data as MarketplaceOrderDto)
      await load()
    } catch {
      setConfirmError('Konfirmasi gagal')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleEscalate = async () => {
    setActionLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/complaint/escalate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Eskalasi gagal')
        return
      }
      setOrder(json.data as MarketplaceOrderDto)
      await load()
    } catch {
      setConfirmError('Eskalasi gagal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelInstant = async () => {
    if (!order?.canCancelInstant) return
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setConfirmError(`Alasan pembatalan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }
    if (!window.confirm('Batalkan pesanan? Dana dikembalikan ke Saldo Bantoo.')) return

    setCancelLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      router.push(`${listHref}?cancelled=1`)
    } catch {
      setConfirmError('Gagal membatalkan pesanan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleRequestCancellation = async () => {
    if (!order?.canRequestCancellation) return
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setConfirmError(`Alasan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }

    setCancelLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Gagal mengajukan pembatalan')
        return
      }
      setOrder(json.data as MarketplaceOrderDto)
      setCancelReason('')
    } catch {
      setConfirmError('Gagal mengajukan pembatalan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleWithdrawCancelRequest = async () => {
    if (!order?.canWithdrawCancelRequest) return
    if (!window.confirm('Tarik pengajuan pembatalan?')) return

    setCancelLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/cancel-request`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Gagal menarik pengajuan')
        return
      }
      setOrder(json.data as MarketplaceOrderDto)
    } catch {
      setConfirmError('Gagal menarik pengajuan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCancelAwaitingPayment = async () => {
    if (!order?.canCancelAwaitingPayment) return
    if (
      !window.confirm(
        'Batalkan pesanan ini? Stok produk akan dikembalikan dan pembayaran tidak dapat dilanjutkan.',
      )
    ) {
      return
    }

    setCancelLoading(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${orderId}/cancel`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfirmError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      router.push(`${listHref}?cancelled=1`)
    } catch {
      setConfirmError('Gagal membatalkan pesanan')
    } finally {
      setCancelLoading(false)
    }
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const deadlineLabel = formatBuyerActionDeadline(order.buyerActionDeadline)
  const returnDeadlineLabel = formatBuyerActionDeadline(order.complaint?.returnDeadline ?? null)
  const sellerConfirmLabel = formatBuyerActionDeadline(
    order.complaint?.sellerConfirmDeadline ?? null,
  )

  const returnTrackingForMap: OrderTrackingDto | null = returnTracking
    ? {
        courier: returnTracking.courier,
        trackingNumber: returnTracking.trackingNumber,
        summaryStatus: returnTracking.summaryStatus,
        summaryDesc: null,
        lastEventAt: returnTracking.events[0]?.occurredAt ?? null,
        lastSyncedAt: returnTracking.lastSyncedAt,
        trackingActive: returnTracking.trackingActive,
        events: returnTracking.events,
      }
    : null

  const returnDelivered = isTerminalTrackingStatus(returnTracking?.summaryStatus)

  const pendingReviewCount =
    isOrderCompleted && order.canReview
      ? order.items.filter((i) => !order.reviewedProductIds.includes(i.productId)).length
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tightest text-ink sm:text-xl">
            Detail Pesanan
          </h1>
          <p className="text-xs font-mono text-surface-500">{order.orderCode}</p>
        </div>
        <Badge
          variant={
            order.status === 'completed'
              ? 'success'
              : order.status === 'disputed'
                ? 'danger'
              : order.status === 'shipped'
                ? 'info'
                : 'warning'
          }
        >
          {order.statusLabel}
        </Badge>
      </div>

      {pendingReviewCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Beri rating produk</strong> — {pendingReviewCount} item di pesanan ini belum
          dinilai. Form ulasan ada di bagian bawah halaman.
        </div>
      )}

      <StatusProgressBar steps={statusSteps} currentIdx={currentStepIdx} />

      <MarketplaceOrderCancelReasonCard order={order} />

      {isShipped && tracking && (
        <ShippingVisualization
          tracking={tracking}
          isDelivered={isOrderCompleted || trackingDelivered}
        />
      )}

      {(order.canConfirmReceipt || order.canFileComplaint) && (
        <Card className="border-primary-200 bg-primary-50/40">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-ink">Paket sudah sampai?</p>
            <p className="text-xs text-surface-600">
              Konfirmasi jika pesanan sesuai, atau ajukan komplain jika ada masalah.
              {deadlineLabel && (
                <span className="mt-1 block text-primary-700">
                  Otomatis selesai {deadlineLabel} jika tidak ada tindakan.
                </span>
              )}
            </p>
            {confirmError && <p className="text-xs text-rose-600">{confirmError}</p>}
            {showComplaintForm ? (
              <MarketplaceComplaintForm
                orderId={orderId}
                onSuccess={() => {
                  setShowComplaintForm(false)
                  void load()
                }}
                onCancel={() => setShowComplaintForm(false)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={confirmLoading}
                  onClick={() => void handleConfirmReceipt()}
                >
                  {confirmLoading ? 'Memproses…' : 'Pesanan Sesuai'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => setShowComplaintForm(true)}
                >
                  Komplain
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.complaint && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-ink">Status komplain</p>
            <p className="text-xs text-surface-600">{order.complaint.statusLabel}</p>
            <p className="text-xs text-surface-700">{order.complaint.reason}</p>
            {returnDeadlineLabel && order.complaint.status === 'AWAITING_RETURN' && (
              <p className="text-xs font-medium text-amber-800">
                Batas kirim retur: {returnDeadlineLabel}
              </p>
            )}
            {sellerConfirmLabel && order.complaint.status === 'AWAITING_SELLER_CONFIRM' && (
              <p className="text-xs text-surface-600">
                Menunggu penjual memeriksa barang retur (auto-refund {sellerConfirmLabel})
              </p>
            )}
            {order.complaint.sellerResponse && (
              <p className="rounded-lg bg-white/80 p-2 text-xs text-surface-700">
                <span className="font-medium">Respons penjual:</span> {order.complaint.sellerResponse}
              </p>
            )}
            {order.canSubmitReturn && order.complaint && (
              <MarketplaceComplaintReturnForm
                orderId={orderId}
                complaint={order.complaint}
                onSuccess={() => void load()}
              />
            )}
            {order.canEscalateComplaint && (
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => void handleEscalate()}
              >
                Eskalasi ke Admin
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {returnTrackingForMap && (
        <ShippingVisualization
          tracking={returnTrackingForMap}
          isDelivered={returnDelivered}
          title="Pengiriman retur"
        />
      )}

      {order.status === 'completed' &&
        order.items.map((item) => {
          const reviewed = order.reviewedProductIds.includes(item.productId)
          if (reviewed) {
            return (
              <p
                key={item.productId}
                className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600"
              >
                Review terkirim — {item.name}
              </p>
            )
          }
          return (
            <MarketplaceOrderReviewForm
              key={item.productId}
              productId={item.productId}
              productName={item.name}
              orderId={order.id}
              onSubmitted={() => void load()}
            />
          )
        })}

      {returnTrackingForMap && returnTrackingForMap.events.length > 0 && (
        <TrackingTimeline tracking={returnTrackingForMap} title="Riwayat retur" />
      )}

      {tracking && tracking.events.length > 0 && (
        <TrackingTimeline tracking={tracking} />
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Info Pesanan
          </p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-surface-700">
                  {item.name} ×{item.quantity}
                </span>
                <span className="font-semibold text-ink tabular-nums">
                  Rp {item.lineTotal.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-surface-100 pt-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Subtotal</span>
              <span className="font-medium text-ink tabular-nums">
                Rp {order.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between text-primary-700">
                <span>Diskon promo</span>
                <span className="font-medium tabular-nums">
                  - Rp {order.discount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {order.buyerFeePercentPart > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Biaya Platform</span>
                <span className="font-medium text-ink tabular-nums">
                  Rp {order.buyerFeePercentPart.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {order.buyerFlatFeePart > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-surface-500">
                  Biaya layanan (
                  {order.buyerFlatFeePerItem.toLocaleString('id-ID')} × {itemCount} item)
                </span>
                <span className="font-medium text-ink tabular-nums">
                  Rp {order.buyerFlatFeePart.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {order.buyerFeePercentPart === 0 && order.buyerFlatFeePart === 0 && (
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Biaya Platform</span>
                <span className="font-medium text-ink tabular-nums">Gratis</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Estimasi ongkir</span>
                <span className="font-medium text-ink tabular-nums">
                  Rp {order.shippingCost.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
          <div className="border-t border-surface-100 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Total dibayar</span>
            <span className="text-lg font-bold text-primary-700 tabular-nums">
              Rp {order.buyerHoldAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-xs text-surface-500">Penjual: {order.sellerName}</p>
          {tracking && (
            <p className="text-xs text-surface-500">
              Kurir: {tracking.courier} · Resi:{' '}
              <span className="font-mono">{tracking.trackingNumber}</span>
            </p>
          )}
          {order.shippingAddress && (
            <p className="text-xs text-surface-500">
              Alamat: {order.shippingAddress}
              {order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {order.canCancelAwaitingPayment && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-ink">Pesanan menunggu pembayaran</p>
            <p className="text-xs text-surface-600">
              Anda dapat membatalkan pesanan selama pembayaran belum selesai. Stok produk akan
              dikembalikan ke penjual.
            </p>
            {confirmError && <p className="text-xs text-rose-600">{confirmError}</p>}
            <Button
              variant="outline"
              size="sm"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={cancelLoading}
              onClick={() => void handleCancelAwaitingPayment()}
            >
              {cancelLoading ? 'Membatalkan…' : 'Batalkan pesanan'}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.cancellationRequest?.status === 'PENDING' && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-ink">Pengajuan pembatalan aktif</p>
            <p className="text-xs text-surface-600">{order.cancellationRequest.statusLabel}</p>
            {order.cancellationRequest.sellerDeadline && (
              <p className="text-xs text-surface-500">
                Batas respons penjual:{' '}
                {formatBuyerActionDeadline(order.cancellationRequest.sellerDeadline)}
              </p>
            )}
            {order.canWithdrawCancelRequest && (
              <Button
                variant="outline"
                size="sm"
                disabled={cancelLoading}
                onClick={() => void handleWithdrawCancelRequest()}
              >
                Tarik pengajuan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {(order.canCancelInstant || order.canRequestCancellation) && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-ink">Batalkan pesanan</p>
            <p className="text-xs text-surface-600">
              {order.canCancelInstant
                ? 'Batalkan instan dalam 1 jam setelah bayar — dana dikembalikan ke Saldo Bantoo.'
                : 'Ajukan pembatalan ke penjual. Penjual punya 48 jam untuk merespons.'}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={`Alasan (min. ${CANCEL_REASON_MIN_LENGTH} karakter)`}
              className="min-h-[80px] w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
            />
            {cancelReason.trim().length > 0 &&
              cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH && (
                <p className="text-xs text-amber-700">
                  Alasan minimal {CANCEL_REASON_MIN_LENGTH} karakter (
                  {cancelReason.trim().length}/{CANCEL_REASON_MIN_LENGTH})
                </p>
              )}
            {confirmError && <p className="text-xs text-rose-600">{confirmError}</p>}
            {order.canCancelInstant && (
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={cancelLoading || cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH}
                onClick={() => void handleCancelInstant()}
              >
                {cancelLoading ? 'Membatalkan…' : 'Batalkan (refund ke Saldo Bantoo)'}
              </Button>
            )}
            {order.canRequestCancellation && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-800 hover:bg-amber-50"
                disabled={cancelLoading || cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH}
                onClick={() => void handleRequestCancellation()}
              >
                {cancelLoading ? 'Mengirim…' : 'Ajukan pembatalan'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => void load()}>
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh Pelacakan
      </Button>
    </div>
  )
}

export function StatusProgressBar({
  steps,
  currentIdx,
}: {
  steps: readonly string[]
  currentIdx: number
}) {
  const labels = ['Menunggu', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai']
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const done = idx <= currentIdx
          const active = idx === currentIdx
          return (
            <div key={step} className="flex flex-col items-center gap-1.5 relative z-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: active ? 1.15 : 1 }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  done
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-surface-300 bg-white text-surface-400',
                  active && 'ring-4 ring-primary-100',
                )}
              >
                {done && idx < currentIdx ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  done ? 'text-primary-700' : 'text-surface-500',
                )}
              >
                {labels[idx]}
              </span>
            </div>
          )
        })}
      </div>
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-surface-200 -z-0" />
      <motion.div
        className="absolute top-4 left-4 h-0.5 bg-primary-500 -z-0"
        initial={{ width: '0%' }}
        animate={{ width: `${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ maxWidth: 'calc(100% - 2rem)' }}
      />
    </div>
  )
}

const ShippingMapDynamic = dynamic(
  () => import('@/components/shipping/shipping-map').then((m) => m.ShippingMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-surface-100" />,
  },
)

export function ShippingVisualization({
  tracking,
  isDelivered,
  title = 'Pengiriman pesanan',
}: {
  tracking: OrderTrackingDto
  isDelivered: boolean
  title?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-surface-200/70 bg-white p-5 shadow-soft-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">
              {isDelivered ? `${title} — sampai!` : `${title} — dalam perjalanan`}
            </p>
            <p className="text-[10px] text-surface-500">
              {tracking.courier} · {tracking.trackingNumber}
            </p>
          </div>
        </div>
        {tracking.summaryStatus && (
          <Badge variant={isDelivered ? 'success' : 'info'} className="text-[10px]">
            {tracking.summaryStatus}
          </Badge>
        )}
      </div>

      <div className="relative h-56 w-full overflow-hidden rounded-xl border border-surface-100 sm:h-64">
        <ShippingMapDynamic tracking={tracking} isDelivered={isDelivered} />
      </div>

      {isDelivered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 flex items-center gap-2 rounded-xl bg-primary-50 p-3"
        >
          <CheckCircle className="h-5 w-5 text-primary-600" />
          <div>
            <p className="text-xs font-semibold text-primary-700">Paket telah diterima!</p>
            <p className="text-[10px] text-primary-600">Terima kasih telah berbelanja di Bantoo</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function TrackingTimeline({
  tracking,
  title = 'Riwayat Perjalanan',
}: {
  tracking: OrderTrackingDto
  title?: string
}) {
  const events = tracking.events

  const formatWhen = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            {title}
          </p>
          <span className="text-[10px] text-surface-500">{events.length} update</span>
        </div>

        <div className="relative space-y-0">
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-surface-200" />

          {events.map((ev, idx) => {
            const isFirst = idx === 0
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                <div
                  className={cn(
                    'relative z-10 mt-1 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2',
                    isFirst ? 'border-primary-500 bg-primary-500' : 'border-surface-300 bg-white',
                  )}
                >
                  {isFirst ? (
                    <motion.div
                      className="h-2 w-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-surface-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-[12px] font-medium',
                      isFirst ? 'text-ink' : 'text-surface-700',
                    )}
                  >
                    {ev.description}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                    <span>{formatWhen(ev.occurredAt)}</span>
                    {ev.location && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
