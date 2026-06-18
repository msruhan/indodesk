'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RefreshCw } from '@/lib/icons'
import type { OrderComplaintDto } from '@/lib/marketplace-order-complaint-serializer'
import { cn } from '@/lib/utils'

type ComplaintQueueItem = OrderComplaintDto & {
  orderCode: string
  orderTotal: number
  orderStatus: string
  buyerName: string
  sellerName: string
}

type StatusFilter = 'ESCALATED' | 'ACTIVE'

const RESOLUTION_OPTIONS = [
  { value: 'REFUND_FULL', label: 'Refund penuh', desc: 'Pembeli dapat refund 100%, order refund' },
  { value: 'REFUND_PARTIAL', label: 'Refund sebagian', desc: 'Refund nominal tertentu, order selesai' },
  { value: 'REJECTED', label: 'Tolak komplain', desc: 'Pembeli tidak dapat refund, order selesai' },
] as const

export function AdminMarketplaceComplaintsPanel({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<ComplaintQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ESCALATED')
  const [actingId, setActingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ComplaintQueueItem | null>(null)
  const [resolveTarget, setResolveTarget] = useState<ComplaintQueueItem | null>(null)
  const [resolution, setResolution] = useState<'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECTED'>('REFUND_FULL')
  const [refundAmount, setRefundAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/marketplace/complaints?status=${statusFilter}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat komplain')
        return
      }
      setItems(json.data?.items ?? [])
    } catch {
      setError('Gagal memuat komplain')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const resolve = async () => {
    if (!resolveTarget) return
    setActingId(resolveTarget.id)
    setError(null)
    try {
      const body: Record<string, unknown> = { resolution, adminNote: adminNote.trim() || undefined }
      if (resolution === 'REFUND_PARTIAL') {
        body.refundAmount = Number(refundAmount.replace(/\D/g, ''))
      }
      const res = await fetch(`/api/admin/marketplace/complaints/${resolveTarget.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyelesaikan komplain')
        return
      }
      setResolveTarget(null)
      setSelected(null)
      setAdminNote('')
      setRefundAmount('')
      setResolution('REFUND_FULL')
      await load()
    } catch {
      setError('Gagal menyelesaikan komplain')
    } finally {
      setActingId(null)
    }
  }

  const statusVariant = (status: ComplaintQueueItem['status']) => {
    switch (status) {
      case 'ESCALATED':
        return 'danger' as const
      case 'OPEN':
        return 'warning' as const
      case 'SELLER_RESPONDED':
        return 'info' as const
      case 'AWAITING_RETURN':
      case 'RETURN_SHIPPED':
        return 'warning' as const
      case 'AWAITING_SELLER_CONFIRM':
        return 'info' as const
      default:
        return 'default' as const
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <div>
            <h2 className="text-lg font-semibold text-ink">Komplain Marketplace</h2>
            <p className="text-xs text-surface-500">
              Tinjau bukti komplain dan putuskan refund atau penolakan.
            </p>
          </div>
        ) : (
          <p className="text-xs text-surface-500">
            Tinjau bukti komplain dan putuskan refund atau penolakan.
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-surface-200 bg-white p-0.5">
            {(['ESCALATED', 'ACTIVE'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                  statusFilter === f
                    ? 'bg-primary-600 text-white'
                    : 'text-surface-600 hover:text-primary-700',
                )}
              >
                {f === 'ESCALATED' ? 'Eskalasi' : 'Semua aktif'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-surface-500">Memuat…</p>}

      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-surface-500">
            Tidak ada komplain {statusFilter === 'ESCALATED' ? 'yang dieskalasi' : 'aktif'}.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(item.status === 'ESCALATED' && 'border-rose-200/80 bg-rose-50/20')}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{item.orderCode}</span>
                  <Badge variant={statusVariant(item.status)} className="text-[10px]">
                    {item.statusLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-surface-600">
                  {item.buyerName} vs {item.sellerName} · Rp{' '}
                  {item.orderTotal.toLocaleString('id-ID')}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-surface-500">{item.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                  Detail
                </Button>
                {item.status === 'ESCALATED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actingId === item.id}
                    onClick={() => {
                      setResolveTarget(item)
                      setResolution('REFUND_FULL')
                      setRefundAmount('')
                      setAdminNote('')
                    }}
                  >
                    Putuskan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && !resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selected.orderCode}</h3>
                <button type="button" onClick={() => setSelected(null)} className="text-xs underline">
                  Tutup
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Pembeli:</span> {selected.buyerName}
                </p>
                <p>
                  <span className="font-medium">Penjual:</span> {selected.sellerName}
                </p>
                <p>
                  <span className="font-medium">Alasan:</span> {selected.reason}
                </p>
                {selected.sellerResponse && (
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                    <p className="text-xs font-semibold text-surface-700">Respons penjual</p>
                    <p className="mt-1 text-sm">{selected.sellerResponse}</p>
                  </div>
                )}
                {selected.sellerReturnRejectReason && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-semibold text-rose-800">Penjual menolak kondisi retur</p>
                    <p className="mt-1 text-sm">{selected.sellerReturnRejectReason}</p>
                  </div>
                )}
                {(selected.returnTrackingNumber || selected.returnCourier) && (
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm">
                    <p className="text-xs font-semibold text-surface-700">Data retur</p>
                    <p className="mt-1">
                      {selected.returnCourier} · Resi:{' '}
                      <span className="font-mono">{selected.returnTrackingNumber}</span>
                    </p>
                    {selected.returnSummaryStatus && (
                      <p className="text-xs text-surface-600">Status: {selected.returnSummaryStatus}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-surface-700">Bukti komplain awal</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.media
                    .filter((m) =>
                      ['DEFECT_PHOTO', 'UNBOXING_VIDEO', 'PHOTO', 'VIDEO'].includes(m.type),
                    )
                    .map((m) => (
                    <div key={m.id}>
                      <p className="mb-1 text-[10px] text-surface-500">{m.typeLabel}</p>
                      {m.type === 'UNBOXING_VIDEO' || m.type === 'VIDEO' ? (
                        <video src={m.url} controls className="w-full rounded-lg border" />
                      ) : (
                        <img src={m.url} alt="" className="w-full rounded-lg border object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selected.media.some((m) =>
                ['RETURN_PHOTO', 'RETURN_VIDEO', 'RETURN_REJECT_PHOTO'].includes(m.type),
              ) && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-surface-700">Bukti retur</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selected.media
                      .filter((m) =>
                        ['RETURN_PHOTO', 'RETURN_VIDEO', 'RETURN_REJECT_PHOTO'].includes(m.type),
                      )
                      .map((m) => (
                        <div key={m.id}>
                          <p className="mb-1 text-[10px] text-surface-500">{m.typeLabel}</p>
                          {m.type === 'RETURN_VIDEO' ? (
                            <video src={m.url} controls className="w-full rounded-lg border" />
                          ) : (
                            <img src={m.url} alt="" className="w-full rounded-lg border object-cover" />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-semibold">Putuskan komplain — {resolveTarget.orderCode}</h3>

              <div className="space-y-2">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                      resolution === opt.value
                        ? 'border-primary-300 bg-primary-50/50'
                        : 'border-surface-200 hover:bg-surface-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value={opt.value}
                      checked={resolution === opt.value}
                      onChange={() => setResolution(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-surface-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {resolution === 'REFUND_PARTIAL' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-700">
                    Nominal refund (IDR)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={`Maks. ${resolveTarget.orderTotal.toLocaleString('id-ID')}`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-surface-700">
                  Catatan admin (opsional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
                  placeholder="Alasan keputusan untuk arsip internal"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actingId === resolveTarget.id}
                  onClick={() => void resolve()}
                >
                  {actingId === resolveTarget.id ? 'Menyimpan…' : 'Simpan Keputusan'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResolveTarget(null)}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
