'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RefreshCw } from '@/lib/icons'
import { cn } from '@/lib/utils'

type RekberComplaintQueueItem = {
  id: string
  reason: string
  status: 'OPEN' | 'SELLER_RESPONDED' | 'ESCALATED' | 'RESOLVED' | 'WITHDRAWN'
  statusLabel: string
  sellerResponse: string | null
  refundAmount: number | null
  media: Array<{ id: string; typeLabel: string; url: string }>
  createdAt: string
  rekberCode: string
  rekberAmount: number
  rekberStatus: string
  buyerName: string
  sellerName: string
}

type StatusFilter = 'ESCALATED' | 'ACTIVE'

export function AdminRekberComplaintsPanel({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<RekberComplaintQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ESCALATED')
  const [actingId, setActingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<RekberComplaintQueueItem | null>(null)
  const [resolution, setResolution] = useState<'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECTED'>(
    'REFUND_FULL',
  )
  const [refundAmount, setRefundAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/rekber/complaints?status=${statusFilter}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat komplain rekber')
        return
      }
      setItems(json.data?.items ?? [])
    } catch {
      setError('Gagal memuat komplain rekber')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const resolve = async () => {
    if (!selected) return
    setActingId(selected.id)
    setError(null)
    try {
      const body: Record<string, unknown> = { resolution, adminNote: adminNote.trim() || undefined }
      if (resolution === 'REFUND_PARTIAL') {
        body.refundAmount = Number(refundAmount.replace(/\D/g, ''))
      }
      const res = await fetch(`/api/admin/rekber/complaints/${selected.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyelesaikan komplain')
        return
      }
      setSelected(null)
      setResolution('REFUND_FULL')
      setRefundAmount('')
      setAdminNote('')
      await load()
    } catch {
      setError('Gagal menyelesaikan komplain')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <div>
            <h2 className="text-lg font-semibold text-ink">Komplain Rekber</h2>
            <p className="text-xs text-surface-500">Antrian komplain rekber parity dengan marketplace.</p>
          </div>
        ) : (
          <p className="text-xs text-surface-500">Antrian komplain rekber parity dengan marketplace.</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'ESCALATED' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('ESCALATED')}
          >
            Eskalasi
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Active
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardContent className="p-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-surface-500">Memuat…</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-500">Tidak ada komplain.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors',
                      selected?.id === item.id
                        ? 'border-primary-300 bg-primary-50/60'
                        : 'border-surface-200 bg-white hover:border-primary-200',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{item.rekberCode}</p>
                      <Badge variant={item.status === 'ESCALATED' ? 'danger' : 'warning'}>
                        {item.statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-surface-600">{item.reason}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            {!selected ? (
              <p className="py-16 text-center text-sm text-surface-500">Pilih komplain untuk melihat detail.</p>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-ink">{selected.rekberCode}</h3>
                  <p className="text-xs text-surface-500">
                    Buyer: {selected.buyerName} · Seller: {selected.sellerName}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-700">
                  {selected.reason}
                </div>
                {selected.sellerResponse && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    <p className="mb-1 text-xs font-semibold">Respons seller</p>
                    {selected.sellerResponse}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-surface-700">Keputusan admin</label>
                  <select
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                    value={resolution}
                    onChange={(e) =>
                      setResolution(e.target.value as 'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECTED')
                    }
                  >
                    <option value="REFUND_FULL">Refund penuh</option>
                    <option value="REFUND_PARTIAL">Refund sebagian</option>
                    <option value="REJECTED">Tolak komplain (release ke seller)</option>
                  </select>
                </div>

                {resolution === 'REFUND_PARTIAL' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-surface-700">Nominal refund</label>
                    <Input
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Contoh: 150000"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-surface-700">Catatan admin (opsional)</label>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                    Tutup
                  </Button>
                  <Button size="sm" onClick={() => void resolve()} disabled={actingId === selected.id}>
                    {actingId === selected.id ? 'Menyimpan…' : 'Simpan keputusan'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
