'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
import type { OrderTrackingDto } from '@/lib/order-tracking-sync'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'

type MarketplaceOrderDetailViewProps = {
  listHref?: string
}

export function MarketplaceOrderDetailView({
  listHref = '/user/orders',
}: MarketplaceOrderDetailViewProps) {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<MarketplaceOrderDto | null>(null)
  const [tracking, setTracking] = useState<OrderTrackingDto | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, trackingRes] = await Promise.all([
        fetch('/api/user/marketplace/orders').then((r) => r.json()),
        fetch(`/api/user/marketplace/orders/${orderId}/tracking`).then((r) => r.json()),
      ])
      if (ordersRes.success) {
        const found = (ordersRes.data as MarketplaceOrderDto[]).find((o) => o.id === orderId)
        setOrder(found ?? null)
      }
      if (trackingRes.success) {
        setTracking(trackingRes.data?.tracking ?? null)
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
  const currentStepIdx = statusSteps.indexOf(order.status as (typeof statusSteps)[number])
  const isShipped = order.status === 'shipped' || order.status === 'completed'

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
              : order.status === 'shipped'
                ? 'info'
                : 'warning'
          }
        >
          {order.statusLabel}
        </Badge>
      </div>

      <StatusProgressBar steps={statusSteps} currentIdx={currentStepIdx} />

      {isShipped && tracking && (
        <ShippingVisualization tracking={tracking} isDelivered={order.status === 'completed'} />
      )}

      {tracking && tracking.events.length > 0 && <TrackingTimeline tracking={tracking} />}

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
          <div className="border-t border-surface-100 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-lg font-bold text-primary-700 tabular-nums">
              Rp {order.total.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-xs text-surface-500">Penjual: {order.sellerName}</p>
          {tracking && (
            <p className="text-xs text-surface-500">
              Kurir: {tracking.courier} · Resi:{' '}
              <span className="font-mono">{tracking.trackingNumber}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" size="sm" className="w-full" onClick={() => void load()}>
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh Pelacakan
      </Button>
    </div>
  )
}

function StatusProgressBar({
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

function ShippingVisualization({
  tracking,
  isDelivered,
}: {
  tracking: OrderTrackingDto
  isDelivered: boolean
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
              {isDelivered ? 'Paket telah sampai!' : 'Paket sedang dalam perjalanan'}
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
            <p className="text-[10px] text-primary-600">Terima kasih telah berbelanja di IndoTeknizi</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function TrackingTimeline({ tracking }: { tracking: OrderTrackingDto }) {
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
            Riwayat Perjalanan
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
