'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { OrderPackagingProofDto } from '@/lib/marketplace-packaging-proof-serializer'
import { formatBuyerActionDeadline } from '@/components/orders/marketplace-complaint-form'

type PackagingProofFormProps = {
  orderId: string
  proof: OrderPackagingProofDto | null
  canSubmit: boolean
  requiresProof: boolean
  uploadUrl?: string
  onSuccess: () => void
}

export function PackagingProofForm({
  orderId,
  proof,
  canSubmit,
  requiresProof,
  uploadUrl,
  onSuccess,
}: PackagingProofFormProps) {
  const [photos, setPhotos] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!requiresProof && !proof) return null

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      photos.forEach((f) => fd.append('photos', f))
      videos.forEach((f) => fd.append('videos', f))

      const res = await fetch(uploadUrl ?? `/api/teknisi/marketplace/orders/${orderId}/packaging`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim bukti packaging')
        return
      }
      setPhotos([])
      setVideos([])
      onSuccess()
    } catch {
      setError('Gagal mengirim bukti packaging')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-semibold text-ink">Bukti Packaging (Wajib)</p>
        {proof && (
          <Badge
            variant={proof.status === 'APPROVED' ? 'success' : proof.status === 'REJECTED' ? 'danger' : 'warning'}
            className="text-[10px]"
          >
            {proof.statusLabel}
          </Badge>
        )}
      </div>
      <p className="text-[11px] text-surface-600">
        Upload foto dan video produk dalam kemasan sebelum memproses pesanan. Admin akan mereview terlebih dahulu.
      </p>

      {proof?.status === 'REJECTED' && proof.rejectionNote && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          <p className="font-semibold">Ditolak admin:</p>
          <p className="mt-0.5">{proof.rejectionNote}</p>
          {proof.resubmitDeadline && (
            <p className="mt-1 font-medium">
              Batas upload ulang: {formatBuyerActionDeadline(proof.resubmitDeadline) ?? '—'}
            </p>
          )}
        </div>
      )}

      {proof?.status === 'PENDING' && (
        <p className="text-[11px] font-medium text-amber-800">
          Bukti sedang direview admin. Tombol &quot;Proses Pesanan&quot; aktif setelah disetujui.
        </p>
      )}

      {proof?.status === 'APPROVED' && (
        <p className="text-[11px] font-medium text-primary-700">
          Bukti packaging disetujui. Anda bisa memproses pesanan.
        </p>
      )}

      {canSubmit && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-700">
              Foto produk dalam kemasan (wajib, min. 1)
            </label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-700">
              Video produk dalam kemasan (wajib, min. 1)
            </label>
            <Input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setVideos(Array.from(e.target.files ?? []))}
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <Button variant="primary" size="sm" disabled={loading} onClick={() => void submit()}>
            {loading ? 'Mengirim…' : proof?.status === 'REJECTED' ? 'Upload Ulang' : 'Kirim untuk Review'}
          </Button>
        </>
      )}
    </div>
  )
}
