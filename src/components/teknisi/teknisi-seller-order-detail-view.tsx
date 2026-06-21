'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CheckCircle, ChevronLeft, Package, RefreshCw, User, X } from '@/lib/icons'
import type { ShippingCourier } from '@prisma/client'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancellation'
import type { OrderTrackingDto } from '@/lib/order-tracking-sync'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'
import { formatBuyerActionDeadline } from '@/components/orders/marketplace-complaint-form'
import {
  ShippingVisualization,
  StatusProgressBar,
  TrackingTimeline,
} from '@/components/orders/marketplace-order-detail-view'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import { PackagingProofForm } from '@/components/marketplace/packaging-proof-form'
import { SellerShipmentCourierField } from '@/components/shipping/seller-shipment-courier-field'
import { CheckoutShippingOrderHint } from '@/components/shipping/checkout-shipping-order-hint'
import { ShippingLabelDownloadButton } from '@/components/shipping/shipping-label-download-button'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function mapOrderTracking(orderTracking: NonNullable<MarketplaceOrderDto['tracking']>): OrderTrackingDto {
  return {
    courier: orderTracking.courier,
    trackingNumber: orderTracking.trackingNumber,
    summaryStatus: orderTracking.summaryStatus,
    summaryDesc: null,
    lastEventAt: null,
    lastSyncedAt: orderTracking.lastSyncedAt,
    trackingActive: orderTracking.trackingActive,
    events: [],
  }
}

type TeknisiSellerOrderDetailViewProps = {
  listHref?: string
}

export function TeknisiSellerOrderDetailView({
  listHref = '/teknisi/pesanan',
}: TeknisiSellerOrderDetailViewProps) {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<MarketplaceOrderDto | null>(null)
  const [tracking, setTracking] = useState<OrderTrackingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [shipmentCourier, setShipmentCourier] = useState<ShippingCourier>('JNE')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelAction, setCancelAction] = useState<'cancel' | 'reject_order'>('cancel')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelRejectResponse, setCancelRejectResponse] = useState('')
  const [complaintResponse, setComplaintResponse] = useState('')
  const [returnRejectReason, setReturnRejectReason] = useState('')
  const [returnRejectPhotos, setReturnRejectPhotos] = useState<File[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [orderRes, trackingRes] = await Promise.all([
        fetch(`/api/teknisi/marketplace/orders/${orderId}`).then((r) => r.json()),
        fetch(`/api/teknisi/marketplace/orders/${orderId}/tracking`).then((r) => r.json()),
      ])
      if (!orderRes.success) {
        setOrder(null)
        return
      }
      const nextOrder = orderRes.data as MarketplaceOrderDto
      setOrder(nextOrder)
      setShipmentCourier(nextOrder.checkoutShippingCourierEnum ?? 'JNE')
      if (trackingRes.success) {
        setTracking(trackingRes.data?.tracking ?? null)
      }
    } catch {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  const patchOrder = async (body: Record<string, unknown>) => {
    setActing(true)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memperbarui pesanan')
        return false
      }
      setOrder(json.data as MarketplaceOrderDto)
      await load()
      return true
    } catch {
      setError('Gagal memperbarui pesanan')
      return false
    } finally {
      setActing(false)
    }
  }

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
            Kembali ke pesanan
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
  const trackingDelivered = isTerminalTrackingStatus(
    tracking?.summaryStatus ?? order.tracking?.summaryStatus,
  )
  const activeTracking: OrderTrackingDto | null =
    tracking ?? (order.tracking ? mapOrderTracking(order.tracking) : null)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleCancelSubmit = async () => {
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setError(`Alasan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }
    const ok = await patchOrder({ action: cancelAction, reason })
    if (ok) {
      setShowCancelForm(false)
      setCancelReason('')
      router.push(listHref)
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-600 hover:text-primary-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Kembali ke pesanan masuk
      </Link>

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

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <StatusProgressBar steps={statusSteps} currentIdx={currentStepIdx} />

      {isShipped && activeTracking && (
        <ShippingVisualization
          tracking={activeTracking}
          isDelivered={order.status === 'completed' || trackingDelivered}
        />
      )}

      {activeTracking && activeTracking.events.length > 0 && (
        <TrackingTimeline tracking={activeTracking} />
      )}

      {(!activeTracking || activeTracking.events.length === 0) && order.tracking && (
        <Card>
          <CardContent className="p-4">
            <OrderTrackingTimeline orderId={order.id} apiBase="/api/teknisi/marketplace/orders" />
          </CardContent>
        </Card>
      )}

      <Card className="border-surface-200/80">
        <CardContent className="space-y-3 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Tindakan penjual
          </p>
          <div className="flex flex-wrap gap-2">
            {order.canAdvanceStatus && order.nextStatus && !order.requiresShipmentInput && (
              <Button
                variant="primary"
                size="sm"
                disabled={acting}
                onClick={() => void patchOrder({ action: 'advance' })}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {order.nextStatus === 'PROCESSING' ? 'Proses Pesanan' : 'Lanjutkan'}
              </Button>
            )}
            {order.canDownloadShippingLabel && (
              <ShippingLabelDownloadButton orderId={order.id} orderCode={order.orderCode} />
            )}
            {order.canRejectNewOrder && (
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={acting}
                onClick={() => {
                  setCancelAction('reject_order')
                  setShowCancelForm(true)
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
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={acting}
                onClick={() => {
                  setCancelAction('cancel')
                  setShowCancelForm(true)
                }}
              >
                Batalkan
              </Button>
            )}
          </div>

          {showCancelForm && (
            <div className="space-y-2 rounded-xl border border-rose-200/70 bg-rose-50/40 p-3">
              <p className="text-xs font-semibold text-ink">
                {cancelAction === 'reject_order' ? 'Tolak pesanan' : 'Batalkan pesanan'}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={`Alasan (min. ${CANCEL_REASON_MIN_LENGTH} karakter)`}
                className="min-h-[72px] w-full rounded-lg border border-surface-200 px-3 py-2 text-xs"
              />
              {cancelReason.trim().length > 0 &&
                cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH && (
                  <p className="text-xs text-amber-700">
                    Alasan minimal {CANCEL_REASON_MIN_LENGTH} karakter (
                    {cancelReason.trim().length}/{CANCEL_REASON_MIN_LENGTH})
                  </p>
                )}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={acting || cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH}
                  onClick={() => void handleCancelSubmit()}
                >
                  Konfirmasi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCancelForm(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}

          {order.requiresShipmentInput && (
            <div className="space-y-3 rounded-xl border border-primary-200/70 bg-primary-50/40 p-3">
              <p className="text-xs font-semibold text-ink">Input data pengiriman</p>
              <CheckoutShippingOrderHint
                courierLabel={order.checkoutShippingCourierLabel}
                service={order.checkoutShippingService}
                shippingCost={order.shippingCost}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">
                    Kurir
                  </label>
                  <SellerShipmentCourierField
                    value={shipmentCourier}
                    lockedCourier={order.checkoutShippingCourierEnum}
                    onChange={setShipmentCourier}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-600">
                    Nomor resi
                  </label>
                  <Input
                    placeholder="Contoh: JNE1234567890"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                disabled={acting || !trackingNumber.trim()}
                onClick={() =>
                  void patchOrder({
                    action: 'set_shipment',
                    courier: shipmentCourier,
                    trackingNumber: trackingNumber.trim(),
                  })
                }
              >
                Simpan Resi & Tandai Dikirim
              </Button>
            </div>
          )}

          {(order.requiresPackagingProof ||
            order.canSubmitPackagingProof ||
            order.packagingProof) && (
            <PackagingProofForm
              orderId={order.id}
              proof={order.packagingProof}
              canSubmit={order.canSubmitPackagingProof}
              requiresProof={order.requiresPackagingProof}
              onSuccess={() => void load()}
            />
          )}

          {order.canRespondToCancelRequest && order.cancellationRequest && (
            <div className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
              <p className="text-xs font-semibold text-ink">Pengajuan pembatalan pembeli</p>
              <p className="text-[11px] text-surface-700">{order.cancellationRequest.reason}</p>
              {order.cancellationRequest.sellerDeadline && (
                <p className="text-[10px] text-surface-500">
                  Batas respons:{' '}
                  {formatBuyerActionDeadline(order.cancellationRequest.sellerDeadline)}
                </p>
              )}
              <textarea
                value={cancelRejectResponse}
                onChange={(e) => setCancelRejectResponse(e.target.value)}
                rows={2}
                placeholder="Alasan penolakan (opsional)"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={acting}
                  onClick={() => void patchOrder({ action: 'approve_cancel_request' })}
                >
                  Setujui Pembatalan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-rose-700"
                  disabled={acting}
                  onClick={() =>
                    void patchOrder({
                      action: 'reject_cancel_request',
                      response: cancelRejectResponse.trim() || undefined,
                    })
                  }
                >
                  Tolak Pengajuan
                </Button>
              </div>
            </div>
          )}

          {order.awaitingBuyerConfirmation && (
            <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
              Menunggu konfirmasi pembeli — penjual tidak dapat menandai selesai manual.
            </p>
          )}

          {order.canRespondToComplaint && order.complaint && (
            <div className="space-y-2 rounded-xl border border-rose-200/70 bg-rose-50/40 p-3">
              <p className="text-xs font-semibold text-ink">Komplain pembeli</p>
              <p className="text-[11px] text-surface-700">{order.complaint.reason}</p>
              <textarea
                value={complaintResponse}
                onChange={(e) => setComplaintResponse(e.target.value)}
                rows={3}
                placeholder="Respons (min. 10 karakter)"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={acting || complaintResponse.trim().length < 10}
                onClick={async () => {
                  setActing(true)
                  setError(null)
                  try {
                    const res = await fetch(
                      `/api/teknisi/marketplace/orders/${orderId}/complaint/respond`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ response: complaintResponse.trim() }),
                      },
                    )
                    const json = await res.json()
                    if (!res.ok || !json.success) {
                      setError(json.error ?? 'Gagal mengirim respons')
                      return
                    }
                    setComplaintResponse('')
                    await load()
                  } catch {
                    setError('Gagal mengirim respons')
                  } finally {
                    setActing(false)
                  }
                }}
              >
                Kirim Respons
              </Button>
            </div>
          )}

          {order.canConfirmReturn && order.complaint && (
            <div className="space-y-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3">
              <p className="text-xs font-semibold text-ink">Konfirmasi barang retur</p>
              <Button
                variant="primary"
                size="sm"
                disabled={acting}
                onClick={async () => {
                  setActing(true)
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
                    await load()
                  } catch {
                    setError('Gagal mengonfirmasi retur')
                  } finally {
                    setActing(false)
                  }
                }}
              >
                Konfirmasi Diterima
              </Button>
              <textarea
                value={returnRejectReason}
                onChange={(e) => setReturnRejectReason(e.target.value)}
                rows={2}
                placeholder="Alasan tolak retur (min. 20 karakter)"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-xs"
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setReturnRejectPhotos(Array.from(e.target.files ?? []))}
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 text-rose-700"
                disabled={acting}
                onClick={async () => {
                  if (returnRejectReason.trim().length < 20) {
                    setError('Alasan penolakan minimal 20 karakter')
                    return
                  }
                  if (returnRejectPhotos.length < 1) {
                    setError('Minimal 1 foto bukti wajib')
                    return
                  }
                  setActing(true)
                  try {
                    const fd = new FormData()
                    fd.append('reason', returnRejectReason.trim())
                    returnRejectPhotos.forEach((f) => fd.append('rejectPhotos', f))
                    const res = await fetch(
                      `/api/teknisi/marketplace/orders/${orderId}/complaint/return/reject`,
                      { method: 'POST', body: fd },
                    )
                    const json = await res.json()
                    if (!res.ok || !json.success) {
                      setError(json.error ?? 'Gagal menolak retur')
                      return
                    }
                    await load()
                  } catch {
                    setError('Gagal menolak retur')
                  } finally {
                    setActing(false)
                  }
                }}
              >
                Tolak Kondisi Retur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
            Info Pesanan
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-surface-200/70 bg-surface-50/80 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {order.buyerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{order.buyerName}</p>
              {order.buyerEmail && (
                <p className="truncate text-xs text-surface-500">{order.buyerEmail}</p>
              )}
            </div>
            <User className="ml-auto h-4 w-4 text-surface-400" />
          </div>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="min-w-0 break-words text-surface-700">
                  {item.name} ×{item.quantity}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-surface-100 pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-500">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-surface-500">Ongkir</span>
                <span className="font-medium tabular-nums">{formatPrice(order.shippingCost)}</span>
              </div>
            )}
            {order.buyerFlatFeePart > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-surface-500">
                  Biaya layanan ({order.buyerFlatFeePerItem.toLocaleString('id-ID')} × {itemCount})
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatPrice(order.buyerFlatFeePart)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-surface-100 pt-2">
            <span className="text-sm font-semibold text-ink">Total pesanan</span>
            <span className="text-lg font-bold text-primary-700 tabular-nums">
              {formatPrice(order.total)}
            </span>
          </div>
          {order.shippingAddress && (
            <p className="break-words text-xs text-surface-500">
              Alamat: {order.shippingAddress}
              {order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" size="sm" className="w-full" onClick={() => void load()} disabled={acting}>
        <RefreshCw className={cn('h-3.5 w-3.5', acting && 'animate-spin')} />
        Refresh data
      </Button>
    </div>
  )
}
