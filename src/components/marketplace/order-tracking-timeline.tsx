'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Package, RefreshCw } from '@/lib/icons'
import type { OrderTrackingDto } from '@/lib/order-tracking-sync'

type Props = {
  orderId: string
  apiBase: '/api/user/marketplace/orders' | '/api/teknisi/marketplace/orders'
  className?: string
}

export function OrderTrackingTimeline({ orderId, apiBase, className }: Props) {
  const [tracking, setTracking] = useState<OrderTrackingDto | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/${orderId}/tracking`)
      const json = await res.json()
      if (res.ok && json.success) {
        setTracking(json.data?.tracking ?? null)
      }
    } catch {
      setTracking(null)
    } finally {
      setLoading(false)
    }
  }, [apiBase, orderId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className={cn('text-xs text-surface-500', className)}>Memuat pelacakan…</p>
  }

  if (!tracking) return null

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
    <div
      className={cn('mt-3 rounded-xl border border-surface-200/70 bg-surface-50/80 p-3', className)}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Package className="h-3.5 w-3.5 text-primary-600" />
          Pelacakan paket
        </p>
        {tracking.lastSyncedAt && (
          <span className="text-[10px] text-surface-500">
            Diperbarui {formatWhen(tracking.lastSyncedAt)}
          </span>
        )}
      </div>
      <p className="text-[11px] text-surface-600">
        {tracking.courier} · <span className="font-mono">{tracking.trackingNumber}</span>
        {tracking.summaryStatus && (
          <span className="ml-1 font-medium text-primary-700">— {tracking.summaryStatus}</span>
        )}
      </p>
      {tracking.events.length > 0 ? (
        <ol className="mt-3 max-h-48 space-y-2 overflow-y-auto border-t border-surface-200/60 pt-2">
          {tracking.events.map((ev) => (
            <li key={ev.id} className="relative pl-3 text-[11px] before:absolute before:left-0 before:top-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary-400">
              <p className="text-surface-500">{formatWhen(ev.occurredAt)}</p>
              <p className="text-surface-700">{ev.description}</p>
              {ev.location && <p className="text-surface-500">{ev.location}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-[11px] text-surface-500">Belum ada riwayat perjalanan.</p>
      )}
      {tracking.trackingActive && (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-surface-500">
          <RefreshCw className="h-3 w-3" />
          Status diperbarui otomatis setiap beberapa jam
        </p>
      )}
    </div>
  )
}
