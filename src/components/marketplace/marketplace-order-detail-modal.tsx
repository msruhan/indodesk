'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Package, Store, User, X } from '@/lib/icons'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancellation'
import { MarketplaceOrderInvoiceModal } from '@/components/marketplace/marketplace-order-invoice-modal'
import { MarketplaceOrderCancelReasonCard } from '@/components/marketplace/marketplace-order-cancel-reason'

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatDateCompact(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const statusBadgeVariant: Record<
  MarketplaceOrderDto['status'],
  'warning' | 'info' | 'success' | 'danger' | 'default'
> = {
  awaiting_payment: 'warning',
  pending: 'default',
  paid: 'warning',
  processing: 'info',
  shipped: 'info',
  disputed: 'danger',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
}

type MarketplaceOrderDetailModalProps = {
  order: MarketplaceOrderDto | null
  onClose: () => void
  fullDetailHref?: string | null
  onOrderUpdated?: (order: MarketplaceOrderDto) => void
}

function OrderFeeBreakdown({ order }: { order: MarketplaceOrderDto }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <section className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-2 text-xs sm:rounded-2xl sm:p-3 sm:text-sm">
      <div className="flex justify-between gap-2 text-surface-600">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
      </div>
      {order.discount > 0 && (
        <div className="mt-0.5 flex justify-between gap-2 text-primary-700 sm:mt-1">
          <span>Diskon promo</span>
          <span className="tabular-nums">−{formatPrice(order.discount)}</span>
        </div>
      )}
      {order.buyerFeePercentPart > 0 && (
        <div className="mt-0.5 flex justify-between gap-2 text-surface-600 sm:mt-1">
          <span>Biaya Platform</span>
          <span className="tabular-nums">{formatPrice(order.buyerFeePercentPart)}</span>
        </div>
      )}
      {order.buyerFlatFeePart > 0 && (
        <div className="mt-0.5 flex justify-between gap-2 text-surface-600 sm:mt-1">
          <span className="min-w-0">
            <span className="sm:hidden">Biaya layanan</span>
            <span className="hidden sm:inline">
              Biaya layanan ({order.buyerFlatFeePerItem.toLocaleString('id-ID')} × {itemCount} item)
            </span>
          </span>
          <span className="shrink-0 tabular-nums">{formatPrice(order.buyerFlatFeePart)}</span>
        </div>
      )}
      {order.buyerFeePercentPart === 0 && order.buyerFlatFeePart === 0 && (
        <div className="mt-0.5 flex justify-between gap-2 text-surface-600 sm:mt-1">
          <span>Biaya Platform</span>
          <span className="tabular-nums">Gratis</span>
        </div>
      )}
      {order.shippingCost > 0 && (
        <div className="mt-0.5 flex justify-between gap-2 text-surface-600 sm:mt-1">
          <span>Estimasi ongkir</span>
          <span className="tabular-nums">{formatPrice(order.shippingCost)}</span>
        </div>
      )}
      <div className="mt-1.5 flex justify-between gap-2 border-t border-surface-200 pt-1.5 font-bold text-ink sm:mt-2 sm:pt-2">
        <span>Total dibayar</span>
        <span className="tabular-nums text-primary-700">{formatPrice(order.buyerHoldAmount)}</span>
      </div>
    </section>
  )
}

export function MarketplaceOrderDetailModal({
  order,
  onClose,
  fullDetailHref,
  onOrderUpdated,
}: MarketplaceOrderDetailModalProps) {
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => {
    if (!order) return
    setCancelError(null)
    setCancelReason('')
    setShowInvoice(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [order, onClose])

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
    setCancelError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${order.id}/cancel`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCancelError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      onOrderUpdated?.(json.data as MarketplaceOrderDto)
      onClose()
    } catch {
      setCancelError('Gagal membatalkan pesanan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCancelInstant = async () => {
    if (!order?.canCancelInstant) return
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setCancelError(`Alasan pembatalan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }
    if (
      !window.confirm(
        'Batalkan pesanan ini? Dana akan dikembalikan ke Saldo Bantoo.',
      )
    ) {
      return
    }

    setCancelLoading(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCancelError(json.error ?? 'Gagal membatalkan pesanan')
        return
      }
      onOrderUpdated?.(json.data as MarketplaceOrderDto)
      onClose()
    } catch {
      setCancelError('Gagal membatalkan pesanan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleRequestCancellation = async () => {
    if (!order?.canRequestCancellation) return
    const reason = cancelReason.trim()
    if (reason.length < CANCEL_REASON_MIN_LENGTH) {
      setCancelError(`Alasan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`)
      return
    }

    setCancelLoading(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${order.id}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCancelError(json.error ?? 'Gagal mengajukan pembatalan')
        return
      }
      onOrderUpdated?.(json.data as MarketplaceOrderDto)
      setCancelReason('')
    } catch {
      setCancelError('Gagal mengajukan pembatalan')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleWithdrawCancelRequest = async () => {
    if (!order?.canWithdrawCancelRequest) return
    if (!window.confirm('Tarik pengajuan pembatalan? Pesanan akan tetap diproses penjual.')) {
      return
    }

    setCancelLoading(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/user/marketplace/orders/${order.id}/cancel-request`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCancelError(json.error ?? 'Gagal menarik pengajuan')
        return
      }
      onOrderUpdated?.(json.data as MarketplaceOrderDto)
    } catch {
      setCancelError('Gagal menarik pengajuan')
    } finally {
      setCancelLoading(false)
    }
  }

  const isBuyerView = order?.role === 'buyer'

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            key="order-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="order-detail-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <div
              className="relative flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-surface-200/80 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                aria-label="Tutup"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
                <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/50 to-white px-3 pb-2.5 pt-3 pr-10 sm:px-6 sm:pb-4 sm:pt-8 sm:pr-12">
                  <div className="flex items-start gap-2.5">
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 sm:mb-0 sm:h-12 sm:w-12 sm:rounded-2xl">
                      <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="font-mono text-xs font-bold text-ink sm:text-lg">{order.orderCode}</h2>
                        <Badge variant={statusBadgeVariant[order.status]} className="text-[9px] sm:text-[10px]">
                          {order.statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {isBuyerView && (
                          <button
                            type="button"
                            onClick={() => setShowInvoice(true)}
                            className="text-left text-[10px] font-medium text-primary-700 underline-offset-2 hover:underline sm:text-xs"
                          >
                            Lihat Invoice
                          </button>
                        )}
                        {isBuyerView && (
                          <span className="hidden text-[10px] text-surface-300 sm:inline">·</span>
                        )}
                        <p className="text-[10px] text-surface-500 sm:hidden">{formatDateCompact(order.createdAt)}</p>
                      </div>
                      <p className="mt-0.5 hidden text-xs text-surface-500 sm:block">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 px-3 py-2.5 sm:space-y-4 sm:px-6 sm:py-5">
                  <MarketplaceOrderCancelReasonCard order={order} compact />
                  {isBuyerView ? (
                    <section>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]">
                        Penjual
                      </p>
                      <div className="flex items-center gap-2 rounded-xl border border-surface-200/70 bg-surface-50/80 p-2 sm:gap-3 sm:rounded-2xl sm:p-3">
                        {order.sellerImage ? (
                          <img
                            src={order.sellerImage}
                            alt=""
                            className="h-8 w-8 rounded-full border border-white object-cover shadow-soft-xs sm:h-11 sm:w-11"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 sm:h-11 sm:w-11 sm:text-sm">
                            {order.sellerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink sm:text-base">{order.sellerName}</p>
                        </div>
                        <Store className="ml-auto h-3.5 w-3.5 text-surface-400 sm:h-4 sm:w-4" />
                      </div>
                    </section>
                  ) : (
                    <section>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]">
                        Pembeli
                      </p>
                      <div className="flex items-center gap-2 rounded-xl border border-surface-200/70 bg-surface-50/80 p-2 sm:gap-3 sm:rounded-2xl sm:p-3">
                        {order.buyerImage ? (
                          <img
                            src={order.buyerImage}
                            alt=""
                            className="h-8 w-8 rounded-full border border-white object-cover shadow-soft-xs sm:h-11 sm:w-11"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 sm:h-11 sm:w-11 sm:text-sm">
                            {order.buyerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink sm:text-base">{order.buyerName}</p>
                          {order.buyerEmail && (
                            <p className="truncate text-[10px] text-surface-500 sm:text-xs">{order.buyerEmail}</p>
                          )}
                        </div>
                        <User className="ml-auto h-3.5 w-3.5 text-surface-400 sm:h-4 sm:w-4" />
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]">
                      Produk
                    </p>
                    <ul className="space-y-1 sm:space-y-2">
                      {order.items.map((item) => (
                        <li
                          key={`${item.productId}-${item.quantity}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-surface-200/60 bg-white px-2 py-1.5 text-xs sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
                        >
                          <span className="min-w-0 break-words text-surface-700">
                            {item.name}{' '}
                            <span className="text-surface-500">×{item.quantity}</span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-ink">
                            {formatPrice(item.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <OrderFeeBreakdown order={order} />

                  {order.shippingAddress && (
                    <section>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-1 sm:text-[10px] sm:tracking-[0.16em]">
                        Alamat pengiriman
                      </p>
                      <p className="break-words rounded-lg bg-surface-50 px-2 py-1.5 text-[10px] leading-snug text-surface-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm">
                        {order.shippingAddress}
                        {order.shippingPhone ? ` · ${order.shippingPhone}` : ''}
                      </p>
                    </section>
                  )}

                  {order.note && (
                    <section>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:mb-1 sm:text-[10px] sm:tracking-[0.16em]">
                        Catatan
                      </p>
                      <p className="rounded-lg bg-surface-50 px-2 py-1.5 text-[11px] leading-snug text-surface-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm">
                        {order.note}
                      </p>
                    </section>
                  )}

                  {order.tracking && (
                    <section className="rounded-xl border border-primary-200/60 bg-primary-50/30 p-2 text-xs sm:rounded-2xl sm:p-3 sm:text-sm">
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-700 sm:mb-1 sm:text-[10px] sm:tracking-[0.16em]">
                        Pengiriman
                      </p>
                      <p className="text-surface-700">{order.tracking.courierLabel}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-surface-600 sm:mt-1 sm:text-xs">
                        Resi: {order.tracking.trackingNumber}
                      </p>
                      {order.tracking.summaryStatus && (
                        <p
                          className={cn(
                            'mt-1 text-[10px] font-semibold sm:mt-2 sm:text-xs',
                            order.status === 'completed' ? 'text-primary-700' : 'text-surface-600',
                          )}
                        >
                          Status: {order.tracking.summaryStatus}
                        </p>
                      )}
                    </section>
                  )}

                  {order.cancellationRequest?.status === 'PENDING' && (
                    <section className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-2 text-xs sm:rounded-2xl sm:p-3 sm:text-sm">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-800 sm:text-[10px] sm:tracking-[0.16em]">
                        Pengajuan pembatalan
                      </p>
                      <p className="mt-0.5 text-surface-700 sm:mt-1">{order.cancellationRequest.statusLabel}</p>
                      {order.cancellationRequest.sellerDeadline && (
                        <p className="mt-0.5 text-[10px] text-surface-600 sm:mt-1 sm:text-xs">
                          Batas respons penjual:{' '}
                          {formatDate(order.cancellationRequest.sellerDeadline)}
                        </p>
                      )}
                    </section>
                  )}

                  {cancelError && <p className="text-[10px] text-rose-600 sm:text-xs">{cancelError}</p>}
                </div>
              </div>

              <div className="shrink-0 space-y-1.5 border-t border-surface-100 bg-white px-3 py-2 sm:space-y-2 sm:px-6 sm:py-4">
                  {order.canCancelAwaitingPayment && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-full rounded-full border-rose-200 text-[11px] text-rose-700 hover:bg-rose-50 sm:h-11 sm:text-sm"
                      disabled={cancelLoading}
                      onClick={() => void handleCancelAwaitingPayment()}
                    >
                      {cancelLoading ? 'Membatalkan…' : 'Batalkan pesanan'}
                    </Button>
                  )}
                  {(order.canCancelInstant || order.canRequestCancellation) && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder={`Alasan pembatalan (min. ${CANCEL_REASON_MIN_LENGTH} karakter)`}
                        className="min-h-[52px] w-full rounded-lg border border-surface-200 px-2 py-1.5 text-xs sm:min-h-[80px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                      />
                      {cancelReason.trim().length > 0 &&
                        cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH && (
                          <p className="text-[11px] text-amber-700 sm:text-xs">
                            Alasan minimal {CANCEL_REASON_MIN_LENGTH} karakter (
                            {cancelReason.trim().length}/{CANCEL_REASON_MIN_LENGTH})
                          </p>
                        )}
                      {order.canCancelInstant && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-full rounded-full border-rose-200 text-[11px] text-rose-700 hover:bg-rose-50 sm:h-11 sm:text-sm"
                          disabled={cancelLoading || cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH}
                          onClick={() => void handleCancelInstant()}
                        >
                          {cancelLoading ? 'Membatalkan…' : 'Batalkan (refund ke Saldo Bantoo)'}
                        </Button>
                      )}
                      {order.canRequestCancellation && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-full rounded-full border-amber-200 text-[11px] text-amber-800 hover:bg-amber-50 sm:h-11 sm:text-sm"
                          disabled={cancelLoading || cancelReason.trim().length < CANCEL_REASON_MIN_LENGTH}
                          onClick={() => void handleRequestCancellation()}
                        >
                          {cancelLoading ? 'Mengirim…' : 'Ajukan pembatalan ke penjual'}
                        </Button>
                      )}
                    </div>
                  )}
                  {order.canWithdrawCancelRequest && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-full rounded-full text-[11px] sm:h-11 sm:text-sm"
                      disabled={cancelLoading}
                      onClick={() => void handleWithdrawCancelRequest()}
                    >
                      Tarik pengajuan pembatalan
                    </Button>
                  )}
                  <div className={cn('gap-1.5', fullDetailHref ? 'grid grid-cols-2' : 'grid grid-cols-1')}>
                    {fullDetailHref && (
                      <Button asChild variant="primary" className="h-8 rounded-full text-[11px] sm:h-11 sm:text-sm">
                        <Link href={fullDetailHref} onClick={onClose}>
                          Detail & lacak
                        </Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full text-[11px] sm:h-11 sm:text-sm"
                      onClick={onClose}
                    >
                      Tutup
                    </Button>
                  </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <MarketplaceOrderInvoiceModal
        order={showInvoice ? order : null}
        onClose={() => setShowInvoice(false)}
      />
    </AnimatePresence>
  )
}
