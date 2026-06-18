'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Package, User, X } from '@/lib/icons'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'

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

const statusBadgeVariant: Record<
  MarketplaceOrderDto['status'],
  'warning' | 'info' | 'success' | 'danger' | 'default'
> = {
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
}

export function MarketplaceOrderDetailModal({ order, onClose }: MarketplaceOrderDetailModalProps) {
  useEffect(() => {
    if (!order) return
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
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div
              className="relative max-h-[min(90vh,720px)] w-full max-w-md overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-[min(90vh,720px)] overflow-y-auto">
                <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/50 to-white px-6 pb-4 pt-8">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-lg font-bold text-ink">{order.orderCode}</h2>
                    <Badge variant={statusBadgeVariant[order.status]} className="text-[10px]">
                      {order.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-surface-500">{formatDate(order.createdAt)}</p>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <section>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
                      Pembeli
                    </p>
                    <div className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-surface-50/80 p-3">
                      {order.buyerImage ? (
                        <img
                          src={order.buyerImage}
                          alt=""
                          className="h-11 w-11 rounded-full border border-white object-cover shadow-soft-xs"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {order.buyerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{order.buyerName}</p>
                        {order.buyerEmail && (
                          <p className="truncate text-xs text-surface-500">{order.buyerEmail}</p>
                        )}
                      </div>
                      <User className="ml-auto h-4 w-4 text-surface-400" />
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
                      Produk
                    </p>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li
                          key={`${item.productId}-${item.quantity}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-surface-200/60 bg-white px-3 py-2.5 text-sm"
                        >
                          <span className="min-w-0 text-surface-700">
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

                  <section className="rounded-2xl border border-surface-200/70 bg-surface-50/50 p-3 text-sm">
                    <div className="flex justify-between text-surface-600">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="mt-1 flex justify-between text-surface-600">
                        <span>Diskon</span>
                        <span className="tabular-nums text-rose-600">−{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    {order.fee > 0 && (
                      <div className="mt-1 flex justify-between text-surface-600">
                        <span>Biaya</span>
                        <span className="tabular-nums">{formatPrice(order.fee)}</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between border-t border-surface-200 pt-2 font-bold text-ink">
                      <span>Total</span>
                      <span className="tabular-nums text-primary-700">{formatPrice(order.total)}</span>
                    </div>
                  </section>

                  {order.note && (
                    <section>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">
                        Catatan
                      </p>
                      <p className="rounded-xl bg-surface-50 px-3 py-2 text-sm text-surface-700">{order.note}</p>
                    </section>
                  )}

                  {order.tracking && (
                    <section className="rounded-2xl border border-primary-200/60 bg-primary-50/30 p-3 text-sm">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">
                        Pengiriman
                      </p>
                      <p className="text-surface-700">
                        {order.tracking.courierLabel}
                      </p>
                      <p className="mt-1 font-mono text-xs text-surface-600">
                        Resi: {order.tracking.trackingNumber}
                      </p>
                      {order.tracking.summaryStatus && (
                        <p
                          className={cn(
                            'mt-2 text-xs font-semibold',
                            order.status === 'completed' ? 'text-primary-700' : 'text-surface-600',
                          )}
                        >
                          Status: {order.tracking.summaryStatus}
                        </p>
                      )}
                    </section>
                  )}
                </div>

                <div className="border-t border-surface-100 px-6 py-4">
                  <Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={onClose}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
