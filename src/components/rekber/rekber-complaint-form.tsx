'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RekberComplaintFormProps = {
  onSubmit: (payload: { reason: string; defectPhotos: File[]; unboxingVideos: File[] }) => Promise<boolean>
  onCancel: () => void
}

export function RekberComplaintForm({ onSubmit, onCancel }: RekberComplaintFormProps) {
  const [reason, setReason] = useState('')
  const [defectPhotos, setDefectPhotos] = useState<File[]>([])
  const [unboxingVideos, setUnboxingVideos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const ok = await onSubmit({ reason, defectPhotos, unboxingVideos })
      if (!ok) {
        setError('Gagal mengajukan komplain')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50/60 p-4">
      <p className="text-sm font-semibold text-ink">Ajukan komplain rekber</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-700">Alasan komplain</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
          placeholder="Jelaskan ketidaksesuaian (min. 20 karakter)"
        />
      </div>
      <div className="rounded-xl border border-surface-200/80 bg-white p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Video unboxing (wajib, min. 1)
        </label>
        <Input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => setUnboxingVideos(Array.from(e.target.files ?? []))}
        />
      </div>
      <div className="rounded-xl border border-surface-200/80 bg-white p-3">
        <label className="mb-1 block text-xs font-semibold text-surface-800">
          Foto masalah (wajib, min. 1)
        </label>
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
          {loading ? 'Mengirim…' : 'Kirim komplain'}
        </Button>
        <Button variant="outline" size="sm" disabled={loading} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}
