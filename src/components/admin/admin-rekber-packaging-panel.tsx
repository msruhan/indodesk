'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, RefreshCw, XCircle } from '@/lib/icons'
import type { OrderPackagingProofDto } from '@/lib/marketplace-packaging-proof-serializer'
import { cn } from '@/lib/utils'

type PackagingQueueItem = OrderPackagingProofDto & {
  orderCode: string
  orderTotal: number
  sellerName: string
  overdue24h: boolean
}

export function AdminRekberPackagingPanel() {
  const [items, setItems] = useState<PackagingQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<PackagingQueueItem | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/rekber/packaging-proofs?status=PENDING')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat antrian')
        return
      }
      setItems(json.data?.items ?? [])
    } catch {
      setError('Gagal memuat antrian')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const review = async (id: string, action: 'approve' | 'reject', note?: string) => {
    setActingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/rekber/packaging-proofs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mereview')
        return
      }
      setSelected(null)
      setShowRejectModal(false)
      setRejectNote('')
      await load()
    } catch {
      setError('Gagal mereview')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Bukti Packaging Transaksi Aman</h2>
          <p className="text-xs text-surface-500">
            Review foto & video kemasan sebelum penjual memproses transaksi aman.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
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
            Tidak ada bukti packaging transaksi aman menunggu review.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(item.overdue24h && 'border-rose-300 bg-rose-50/30')}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{item.orderCode}</span>
                  <Badge variant="outline" className="text-[10px]">
                    Transaksi Aman
                  </Badge>
                  {item.overdue24h && (
                    <Badge variant="danger" className="text-[10px]">
                      &gt;24 jam
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-surface-600">
                  {item.sellerName} · Rp {item.orderTotal.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-surface-500">
                  {item.media.length} file ·{' '}
                  {item.submittedAt ? new Date(item.submittedAt).toLocaleString('id-ID') : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                  Detail
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actingId === item.id}
                  onClick={() => void review(item.id, 'approve')}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Setujui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-rose-700"
                  disabled={actingId === item.id}
                  onClick={() => {
                    setSelected(item)
                    setShowRejectModal(true)
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selected.orderCode}</h3>
                <button type="button" onClick={() => setSelected(null)} className="text-xs underline">
                  Tutup
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {selected.media.map((m) =>
                  m.type === 'PHOTO' ? (
                    <img key={m.id} src={m.url} alt="" className="rounded-lg border object-cover" />
                  ) : (
                    <video key={m.id} src={m.url} controls className="rounded-lg border" />
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showRejectModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-3 p-5">
              <h3 className="font-semibold">Tolak bukti — {selected.orderCode}</h3>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm"
                placeholder="Alasan penolakan (min. 5 karakter)"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={actingId === selected.id || rejectNote.trim().length < 5}
                  onClick={() => void review(selected.id, 'reject', rejectNote.trim())}
                >
                  Tolak
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectNote('')
                  }}
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
