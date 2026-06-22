'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type {
  TeknisiCertificationFileType,
  TeknisiCertificationItemDto,
} from '@/lib/teknisi-certification'
import { isUploadedCertificationFile } from '@/lib/certification-file'
import { Award, FileText, Plus, Trash2, X } from '@/lib/icons'

type CertificationFormItem = {
  id?: string
  title: string
  description: string
  year: string
  fileUrl: string
  fileType: TeknisiCertificationFileType
}

const CURRENT_YEAR = new Date().getFullYear()

function emptyCertificationItem(): CertificationFormItem {
  return { title: '', description: '', year: '', fileUrl: '', fileType: 'image' }
}

function certificationFromDto(item: TeknisiCertificationItemDto): CertificationFormItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    year: item.year != null ? String(item.year) : '',
    fileUrl: item.fileUrl,
    fileType: item.fileType,
  }
}

function certificationPayload(item: CertificationFormItem) {
  const yearRaw = item.year.trim()
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : null
  return {
    title: item.title.trim(),
    description: item.description.trim() || null,
    year: Number.isFinite(year) ? year : null,
    fileUrl: item.fileUrl.trim(),
    fileType: item.fileType,
  }
}

function CertificationFileField({
  fileUrl,
  fileType,
  onChange,
  onBlurSave,
}: {
  fileUrl: string
  fileType: TeknisiCertificationFileType
  onChange: (patch: { fileUrl: string; fileType: TeknisiCertificationFileType }) => void
  onBlurSave: (patch: { fileUrl: string; fileType: TeknisiCertificationFileType }) => void | Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type.startsWith('image/')) {
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return blobUrl
      })
    } else {
      setLocalPreview(null)
    }

    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/teknisi/certifications/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setUploadError(data.error || 'Gagal mengunggah file')
        return
      }
      const uploadedUrl = String(data.data.fileUrl ?? '')
      const uploadedType = (data.data.fileType === 'pdf' ? 'pdf' : 'image') as TeknisiCertificationFileType
      onChange({ fileUrl: uploadedUrl, fileType: uploadedType })
      setLocalPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
      await onBlurSave({ fileUrl: uploadedUrl, fileType: uploadedType })
    } catch {
      setUploadError('Gagal mengunggah file')
    } finally {
      setUploading(false)
    }
  }

  const previewSrc = localPreview ?? (fileType === 'image' ? fileUrl : '')

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-surface-600">
        File sertifikasi (JPG, PNG, atau PDF)
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? 'Mengunggah…' : fileUrl ? 'Ganti file' : 'Pilih dari perangkat'}
      </Button>
      {isUploadedCertificationFile(fileUrl) && (
        <p className="mt-1 text-[10px] text-surface-500">File tersimpan di server platform.</p>
      )}
      {uploadError && <p className="mt-1 text-[10px] text-rose-600">{uploadError}</p>}

      {fileType === 'pdf' && fileUrl ? (
        <div className="relative mt-2 flex max-w-xs items-center gap-3 rounded-lg border border-surface-200 bg-surface-50/80 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-ink">Dokumen PDF</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary-600 hover:underline"
            >
              Pratinjau file
            </a>
          </div>
          <button
            type="button"
            className="rounded-full bg-ink/60 p-1 text-white hover:bg-ink/80"
            aria-label="Hapus file"
            onClick={() => {
              onChange({ fileUrl: '', fileType: 'image' })
              void onBlurSave({ fileUrl: '', fileType: 'image' })
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      {previewSrc ? (
        <div className="relative mt-2 aspect-[4/3] max-w-xs overflow-hidden rounded-lg border border-surface-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt=""
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-ink/60 p-1 text-white hover:bg-ink/80"
            aria-label="Hapus file"
            onClick={() => {
              setLocalPreview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
                return null
              })
              onChange({ fileUrl: '', fileType: 'image' })
              void onBlurSave({ fileUrl: '', fileType: 'image' })
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CertificationEditor({
  items,
  onChange,
  loadError,
}: {
  items: CertificationFormItem[]
  onChange: (items: CertificationFormItem[]) => void
  loadError: string | null
}) {
  const [savingIdx, setSavingIdx] = useState<number | null>(null)

  const saveItem = async (idx: number, overrides?: Partial<CertificationFormItem>) => {
    const item = { ...items[idx]!, ...overrides }
    if (!items[idx]) return
    const title = item.title.trim()
    const fileUrl = item.fileUrl.trim()
    if (title.length < 2 || !fileUrl) return

    const payload = certificationPayload(item)

    setSavingIdx(idx)
    try {
      if (item.id) {
        const res = await fetch(`/api/teknisi/certifications/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) return
        const next = [...items]
        next[idx] = certificationFromDto(data.data)
        onChange(next)
      } else {
        const res = await fetch('/api/teknisi/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) return
        const next = [...items]
        next[idx] = certificationFromDto(data.data)
        onChange(next)
      }
    } finally {
      setSavingIdx(null)
    }
  }

  const deleteItem = async (idx: number) => {
    const item = items[idx]
    if (!item) return
    if (item.id) {
      const res = await fetch(`/api/teknisi/certifications/${item.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) return
    }
    onChange(items.filter((_, i) => i !== idx))
  }

  const update = (idx: number, patch: Partial<CertificationFormItem>) => {
    const next = [...items]
    next[idx] = { ...next[idx]!, ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {loadError && <p className="text-sm text-rose-600">{loadError}</p>}

      {items.map((item, idx) => (
        <div
          key={item.id ?? `new-${idx}`}
          className="relative rounded-2xl border border-surface-200/80 bg-white/80 p-4 shadow-soft-xs"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Sertifikasi {idx + 1}
            </p>
            <button
              type="button"
              onClick={() => void deleteItem(idx)}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Hapus sertifikasi"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Judul</label>
                <Input
                  value={item.title}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  onBlur={() => void saveItem(idx)}
                  placeholder="Contoh: Apple Certified iOS Technician"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Tahun</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={CURRENT_YEAR + 1}
                  value={item.year}
                  onChange={(e) => update(idx, { year: e.target.value })}
                  onBlur={() => void saveItem(idx)}
                  placeholder={String(CURRENT_YEAR)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">
                Deskripsi
              </label>
              <textarea
                value={item.description}
                onChange={(e) => update(idx, { description: e.target.value })}
                onBlur={() => void saveItem(idx)}
                rows={2}
                maxLength={280}
                placeholder="Ringkasan isi sertifikasi, lembaga penerbit, atau kompetensi yang tercakup."
                className={cn(
                  'w-full resize-y rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink',
                  'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                )}
              />
              <p className="mt-1 text-[10px] text-surface-400">{item.description.length}/280</p>
            </div>

            <CertificationFileField
              fileUrl={item.fileUrl}
              fileType={item.fileType}
              onChange={(patch) => update(idx, patch)}
              onBlurSave={(patch) => saveItem(idx, patch)}
            />
          </div>

          {savingIdx === idx && (
            <p className="mt-2 text-[10px] text-surface-500">Menyimpan…</p>
          )}
        </div>
      ))}

      {items.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...items, emptyCertificationItem()])}
        >
          <Plus className="h-4 w-4" />
          Tambah sertifikasi
        </Button>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/60 p-8 text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-surface-300" />
          <p className="text-sm font-medium text-surface-600">Belum ada sertifikasi</p>
          <p className="mt-1 text-xs text-surface-500">
            Unggah sertifikat kompetensi, pelatihan, atau lisensi resmi Anda.
          </p>
        </div>
      )}
    </div>
  )
}

export function TeknisiCertificationSection() {
  const [items, setItems] = useState<CertificationFormItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch('/api/teknisi/certifications')
        const data = await res.json()
        if (cancelled) return
        if (!data.success) {
          setLoadError(data.error || 'Gagal memuat sertifikasi')
          setItems([])
          return
        }
        setItems((data.data as TeknisiCertificationItemDto[]).map(certificationFromDto))
      } catch {
        if (!cancelled) setLoadError('Gagal memuat sertifikasi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-surface-500">
        Sertifikasi tampil di kolom kanan profil publik teknisi. Format JPG, PNG, atau PDF — maks.
        8 MB per file.
      </p>
      {loading ? (
        <p className="text-sm text-surface-500">Memuat sertifikasi…</p>
      ) : (
        <CertificationEditor items={items} onChange={setItems} loadError={loadError} />
      )}
    </div>
  )
}
