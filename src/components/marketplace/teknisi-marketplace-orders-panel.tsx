'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { OrderTrackingTimeline } from '@/components/marketplace/order-tracking-timeline'
import { SellerShipmentCourierField } from '@/components/shipping/seller-shipment-courier-field'
import { CheckoutShippingOrderHint } from '@/components/shipping/checkout-shipping-order-hint'
import { ShippingLabelDownloadButton } from '@/components/shipping/shipping-label-download-button'
import type { ShippingCourier } from '@prisma/client'
import { ArrowRight, RefreshCw, ShoppingBag } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'

const selectClass =
  'h-9 w-full rounded-lg border border-surface-200/80 bg-white px-2 text-xs text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const statusVariant: Record<
  MarketplaceOrderDto['status'],
  'warning' | 'default' | 'success' | 'danger'
> = {
  awaiting_payment: 'warning',
  pending: 'warning',
  paid: 'warning',
  processing: 'default',
  shipped: 'default',
  disputed: 'danger',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
}

type Props = {
  /** `embedded` di halaman Iklan Produk (ringkas); `page` di /teknisi/pesanan (semua order) */
  variant?: 'embedded' | 'page'
}

export function TeknisiMarketplaceOrdersPanel({ variant = 'embedded' }: Props) {
  const isPage = variant === 'page'
  const listLimit = isPage ? undefined : 3
  const [items, setItems] = useState<MarketplaceOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null)
  const [shipmentForms, setShipmentForms] = useState<
    Record<string, { courier: ShippingCourier; trackingNumber: string }>
  >({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/marketplace/orders')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat pesanan')
        return
      }
      setItems(json.data?.items ?? [])
    } catch {
      setError('Gagal memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const getShipmentForm = (order: MarketplaceOrderDto) =>
    shipmentForms[order.id] ?? {
      courier: order.checkoutShippingCourierEnum ?? ('JNE' as ShippingCourier),
      trackingNumber: '',
    }

  const setShipmentField = (
    order: MarketplaceOrderDto,
    patch: Partial<{ courier: ShippingCourier; trackingNumber: string }>,
  ) => {
    setShipmentForms((prev) => ({
      ...prev,
      [order.id]: { ...getShipmentForm(order), ...patch },
    }))
  }

  const advance = async (id: string) => {
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memperbarui pesanan')
        return
      }
      await load()
    } catch {
      setError('Gagal memperbarui pesanan')
    } finally {
      setActingId(null)
    }
  }

  const submitShipment = async (order: MarketplaceOrderDto) => {
    const form = getShipmentForm(order)
    if (!form.trackingNumber.trim()) {
      setError('Nomor resi wajib diisi')
      return
    }
    setActingId(order.id)
    setError(null)
    try {
      const res = await fetch(`/api/teknisi/marketplace/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_shipment',
          courier: form.courier,
          trackingNumber: form.trackingNumber.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan resi')
        return
      }
      setExpandedTrackingId(order.id)
      await load()
    } catch {
      setError('Gagal menyimpan resi')
    } finally {
      setActingId(null)
    }
  }

  const isActiveOrder = (o: MarketplaceOrderDto) =>
    o.status === 'paid' || o.status === 'processing' || o.status === 'shipped'

  const active = items.filter(isActiveOrder)

  const displayed =
    listLimit != null
      ? [
          ...items.filter(isActiveOrder),
          ...items.filter((o) => !isActiveOrder(o)),
        ].slice(0, listLimit)
      : items

  const inner = (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!isPage && (
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <ShoppingBag className="h-4 w-4 text-primary-600" />
              Pesanan terbaru
            </h2>
          )}
          <p className={cn('text-xs text-surface-500', !isPage && 'mt-0.5')}>
            {active.length} pesanan aktif
            {!isPage && items.length > (listLimit ?? 0)
              ? ` · menampilkan ${listLimit} terbaru`
              : ''}
            {isPage ? '. Input resi saat kirim ke kurir.' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-surface-500">Memuat pesanan…</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-surface-500">Belum ada pesanan marketplace.</p>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const form = getShipmentForm(order)
            const showTracking =
              order.tracking && (order.status === 'shipped' || order.status === 'completed')

            return (
              <div
                key={order.id}
                className="rounded-xl border border-surface-200/70 bg-white p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink">{order.orderCode}</p>
                    <p className="text-xs text-surface-500">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <Badge variant={statusVariant[order.status]} className="text-[10px]">
                    {order.statusLabel}
                  </Badge>
                </div>

                {order.tracking && (
                  <p className="mt-1 text-[10px] text-surface-600">
                    {order.tracking.courierLabel} ·{' '}
                    <span className="font-mono">{order.tracking.trackingNumber}</span>
                    {order.tracking.summaryStatus && (
                      <span className="text-primary-700"> · {order.tracking.summaryStatus}</span>
                    )}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-primary-700 tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {order.canAdvanceStatus && order.nextStatus && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="h-8"
                        disabled={actingId === order.id}
                        onClick={() => void advance(order.id)}
                      >
                        {order.nextStatus === 'PROCESSING' ? 'Proses' : 'Lanjutkan'}
                      </Button>
                    )}
                    {order.canDownloadShippingLabel && (
                      <ShippingLabelDownloadButton
                        orderId={order.id}
                        orderCode={order.orderCode}
                      />
                    )}
                    {showTracking && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() =>
                          setExpandedTrackingId((id) => (id === order.id ? null : order.id))
                        }
                      >
                        {expandedTrackingId === order.id ? 'Tutup' : 'Lacak'}
                      </Button>
                    )}
                  </div>
                </div>

                {order.requiresShipmentInput && (
                  <div className="mt-3 space-y-2 rounded-lg border border-primary-100 bg-primary-50/40 p-3">
                    <p className="text-[11px] font-semibold text-ink">
                      Input pengiriman (wajib untuk tandai dikirim)
                    </p>
                    <CheckoutShippingOrderHint
                      courierLabel={order.checkoutShippingCourierLabel}
                      service={order.checkoutShippingService}
                      shippingCost={order.shippingCost}
                    />
                    <SellerShipmentCourierField
                      value={form.courier}
                      lockedCourier={order.checkoutShippingCourierEnum}
                      className={selectClass}
                    />
                    <Input
                      placeholder="Nomor resi / AWB"
                      value={form.trackingNumber}
                      onChange={(e) =>
                        setShipmentField(order, { trackingNumber: e.target.value })
                      }
                      className="h-9 font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-8 w-full"
                      disabled={actingId === order.id}
                      onClick={() => void submitShipment(order)}
                    >
                      {actingId === order.id ? 'Memvalidasi…' : 'Simpan & tandai dikirim'}
                    </Button>
                    <p className="text-[10px] text-surface-500">
                      Resi akan divalidasi ke kurir (1×). Pembaruan lokasi otomatis setiap beberapa
                      jam.
                    </p>
                  </div>
                )}

                {expandedTrackingId === order.id && showTracking && (
                  <OrderTrackingTimeline
                    orderId={order.id}
                    apiBase="/api/teknisi/marketplace/orders"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isPage && items.length > 0 && (
        <Link
          href="/teknisi/pesanan"
          className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-primary-600 hover:underline"
        >
          Lihat semua pesanan
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </>
  )

  if (isPage) {
    return <div className="rounded-2xl border border-surface-200/70 bg-white p-4 sm:p-5">{inner}</div>
  }

  return (
    <Card className="shadow-soft-xs">
      <CardContent className="p-4 sm:p-5">{inner}</CardContent>
    </Card>
  )
}
