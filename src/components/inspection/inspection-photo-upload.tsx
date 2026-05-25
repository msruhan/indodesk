'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, X } from '@/lib/icons'

const MAX_PHOTOS = 20

type Props = {
  photoUrls: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}

export function InspectionPhotoUpload({ photoUrls, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return
    const remaining = MAX_PHOTOS - photoUrls.length
    if (remaining <= 0) {
      setError(`Maksimal ${MAX_PHOTOS} foto`)
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError(null)

    const uploaded: string[] = []
    try {
      for (const file of toUpload) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/teknisi/inspeksi/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Gagal mengunggah foto')
          break
        }
        uploaded.push(String(data.data.imageUrl))
      }
      if (uploaded.length > 0) {
        onChange([...photoUrls, ...uploaded])
      }
    } catch {
      setError('Gagal mengunggah foto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(photoUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photoUrls.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="h-20 w-20 rounded-xl border border-surface-200 object-cover"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeAt(index)}
              className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow-sm disabled:opacity-50"
              aria-label="Hapus foto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photoUrls.length < MAX_PHOTOS && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-surface-300 bg-surface-50 text-surface-500 transition-colors hover:border-primary-300 hover:bg-primary-50/40 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-medium">{uploading ? '…' : 'Tambah'}</span>
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {photoUrls.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([])}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus semua foto
        </Button>
      )}

      <p className="text-[11px] text-surface-500">
        Unggah foto unit (maks. {MAX_PHOTOS}, JPG/PNG/WebP, 5 MB per file).
      </p>
    </div>
  )
}
