'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MarketplaceComplaintFormProps = {
  orderId: string
  onSuccess: () => void
  onCancel: () => void
}

export function MarketplaceComplaintForm({
  orderId,
  onSuccess,
  onCancel,
}: MarketplaceComplaintFormProps) {
  const [reason, setReason] = useState('')
  const [defectPhotos, setDefectPhotos] = useState<File[]>([])
  const [unboxingVideos, setUnboxingVideos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('reason', reason)
      defectPhotos.forEach((f) => fd.append('defectPhotos', f))
      unboxingVideos.forEach((f) => fd.append('unboxingVideos', f))

      const res = await fetch(`/api/user/marketplace/orders/${orderId}/complaint`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengajukan komplain')
        return
      }
      onSuccess()
    } catch {
      setError('Gagal mengajukan komplain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-700">
          Alasan komplain
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
          placeholder="Jelaskan kenapa produk tidak sesuai (min. 20 karakter)"
        />
      </div>
      <div className="rounded-xl border border-surface-200/80 bg-surface-50/50 p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Video unboxing (wajib, min. 1)
        </label>
        <p className="mb-2 text-[11px] text-surface-500">
          Rekam dari paket masih segel → proses buka → produk terlihat jelas.
        </p>
        <Input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => setUnboxingVideos(Array.from(e.target.files ?? []))}
        />
      </div>
      <div className="rounded-xl border border-surface-200/80 bg-surface-50/50 p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Foto masalah (wajib, min. 1)
        </label>
        <p className="mb-2 text-[11px] text-surface-500">
          Foto kondisi produk yang tidak sesuai setelah dibuka.
        </p>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => setDefectPhotos(Array.from(e.target.files ?? []))}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" disabled={loading} onClick={() => void submit()}>
          {loading ? 'Mengirim…' : 'Kirim Komplain'}
        </Button>
        <Button variant="outline" size="sm" disabled={loading} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}

export function formatBuyerActionDeadline(deadlineIso: string | null | undefined): string | null {
  if (!deadlineIso) return null
  const deadline = new Date(deadlineIso)
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return 'Batas waktu hampir habis'
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days} hari ${hours} jam lagi`
  if (hours > 0) return `${hours} jam lagi`
  const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)))
  return `${mins} menit lagi`
}
