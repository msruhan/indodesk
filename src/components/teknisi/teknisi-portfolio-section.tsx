'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TeknisiPortfolioItemDto, TeknisiPortfolioIcon } from '@/lib/teknisi-portfolio'
import { isUploadedPortfolioImage } from '@/lib/portfolio-image'
import { CheckCircle, Plus, Trash2, X } from '@/lib/icons'

type PortfolioFormItem = {
  id?: string
  title: string
  meta: string
  result: string
  imageUrl: string
  icon: TeknisiPortfolioIcon
}

function emptyPortfolioItem(): PortfolioFormItem {
  return { title: '', meta: '', result: '', imageUrl: '', icon: 'smartphone' }
}

function portfolioFromDto(item: TeknisiPortfolioItemDto): PortfolioFormItem {
  return {
    id: item.id,
    title: item.title,
    meta: item.meta,
    result: item.result,
    imageUrl: item.imageUrl ?? '',
    icon: item.icon,
  }
}

type PortfolioImageMode = 'url' | 'file'

function PortfolioImageField({
  imageUrl,
  onChange,
}: {
  imageUrl: string
  onChange: (url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<PortfolioImageMode>(() =>
    isUploadedPortfolioImage(imageUrl) ? 'file' : 'url',
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(() => isUploadedPortfolioImage(imageUrl))
  const [urlFetchSuccess, setUrlFetchSuccess] = useState(false)
  const [urlFetchError, setUrlFetchError] = useState(false)

  const previewSrc = localPreview ?? imageUrl

  useEffect(() => {
    if (mode !== 'url') {
      setUrlFetchSuccess(false)
      setUrlFetchError(false)
      return
    }
    const trimmed = imageUrl.trim()
    if (!trimmed || isUploadedPortfolioImage(trimmed)) {
      setUrlFetchSuccess(false)
      setUrlFetchError(false)
      return
    }
    setUrlFetchSuccess(false)
    setUrlFetchError(false)
  }, [imageUrl, mode])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const blobUrl = URL.createObjectURL(file)
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return blobUrl
    })
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    setUrlFetchSuccess(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/teknisi/portfolio/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setUploadError(data.error || 'Gagal mengunggah gambar')
        return
      }
      const uploadedUrl = String(data.data.imageUrl ?? '')
      onChange(uploadedUrl)
      setMode('file')
      setUploadSuccess(true)
      setLocalPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
    } catch {
      setUploadError('Gagal mengunggah gambar')
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    onChange('')
    setUploadSuccess(false)
    setUrlFetchSuccess(false)
    setUrlFetchError(false)
    setUploadError(null)
  }

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-surface-600">Gambar (opsional)</label>
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
            mode === 'url'
              ? 'bg-primary-600 text-white'
              : 'border border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
          )}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('file')}
          className={cn(
            'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
            mode === 'file'
              ? 'bg-primary-600 text-white'
              : 'border border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
          )}
        >
          Upload gambar
        </button>
      </div>

      {mode === 'url' ? (
        <Input
          value={isUploadedPortfolioImage(imageUrl) ? '' : imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
            {uploading ? 'Mengunggah…' : 'Pilih dari perangkat'}
          </Button>
        </div>
      )}

      {uploadError && <p className="mt-1 text-[10px] text-rose-600">{uploadError}</p>}
      {mode === 'file' && uploadSuccess && isUploadedPortfolioImage(imageUrl) && (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
          <CheckCircle className="h-3 w-3 shrink-0" />
          Berhasil diupload
        </p>
      )}
      {mode === 'url' && urlFetchSuccess && imageUrl.trim() && (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
          <CheckCircle className="h-3 w-3 shrink-0" />
          Berhasil mendapatkan gambar
        </p>
      )}
      {mode === 'url' && urlFetchError && imageUrl.trim() && (
        <p className="mt-1 text-[10px] text-rose-600">Gambar dari URL tidak dapat dimuat</p>
      )}

      {previewSrc && (
        <div className="relative mt-2 aspect-video max-w-xs overflow-hidden rounded-lg border border-surface-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onLoad={() => {
              if (mode === 'url' && imageUrl.trim() && !isUploadedPortfolioImage(imageUrl)) {
                setUrlFetchSuccess(true)
                setUrlFetchError(false)
              }
            }}
            onError={() => {
              if (mode === 'url' && imageUrl.trim()) {
                setUrlFetchSuccess(false)
                setUrlFetchError(true)
              }
            }}
          />
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-ink/60 p-1 text-white hover:bg-ink/80"
            aria-label="Hapus gambar"
            onClick={clearImage}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

async function persistPortfolioItem(
  item: PortfolioFormItem,
): Promise<{ ok: true; item: PortfolioFormItem } | { ok: false; error: string }> {
  const title = item.title.trim()
  if (title.length < 2) {
    return { ok: false, error: 'Judul portfolio minimal 2 karakter' }
  }

  const payload = {
    title,
    meta: item.meta.trim(),
    result: item.result.trim(),
    imageUrl: item.imageUrl.trim() || null,
    icon: item.icon,
  }

  if (item.id) {
    const res = await fetch(`/api/teknisi/portfolio/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) return { ok: false, error: data.error || 'Gagal menyimpan portfolio' }
    return { ok: true, item: portfolioFromDto(data.data) }
  }

  const res = await fetch('/api/teknisi/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.success) return { ok: false, error: data.error || 'Gagal menyimpan portfolio' }
  return { ok: true, item: portfolioFromDto(data.data) }
}

function PortfolioEditor({
  items,
  onChange,
  portfolioMsg,
}: {
  items: PortfolioFormItem[]
  onChange: (items: PortfolioFormItem[]) => void
  portfolioMsg: string | null
}) {
  const deleteItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const update = (idx: number, patch: Partial<PortfolioFormItem>) => {
    const next = [...items]
    next[idx] = { ...next[idx]!, ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {portfolioMsg && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{portfolioMsg}</p>
      )}
      {items.map((item, idx) => (
        <div
          key={item.id ?? `draft-${idx}`}
          className="rounded-xl border border-surface-200/80 bg-surface-50/40 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary-700">
              {item.id ? 'Kasus tersimpan' : 'Kasus baru'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-rose-600"
              onClick={() => deleteItem(idx)}
              aria-label="Hapus portfolio"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Judul</label>
              <Input
                value={item.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder="Recovery perangkat mati total"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Meta</label>
              <Input
                value={item.meta}
                onChange={(e) => update(idx, { meta: e.target.value })}
                placeholder="Android flagship · 48 jam"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Hasil</label>
              <textarea
                value={item.result}
                onChange={(e) => update(idx, { result: e.target.value })}
                rows={2}
                placeholder="Data aman, board kembali stabil"
                className={cn(
                  'w-full resize-y rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink',
                  'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                )}
              />
            </div>
            <PortfolioImageField
              imageUrl={item.imageUrl}
              onChange={(url) => update(idx, { imageUrl: url })}
            />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Ikon</label>
              <select
                value={item.icon}
                onChange={(e) => update(idx, { icon: e.target.value as TeknisiPortfolioIcon })}
                className="h-10 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="smartphone">Smartphone</option>
                <option value="wrench">Wrench</option>
                <option value="laptop">Laptop</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      {items.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...items, emptyPortfolioItem()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah kasus portfolio
        </Button>
      )}
    </div>
  )
}

function isEmptyDraft(item: PortfolioFormItem): boolean {
  return (
    !item.id &&
    !item.title.trim() &&
    !item.meta.trim() &&
    !item.result.trim() &&
    !item.imageUrl.trim()
  )
}

export function TeknisiPortfolioSection({ onClose }: { onClose: () => void }) {
  const [portfolio, setPortfolio] = useState<PortfolioFormItem[]>([])
  const [initialPortfolio, setInitialPortfolio] = useState<PortfolioFormItem[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null)

  const loadPortfolio = async () => {
    setLoading(true)
    setPortfolioMsg(null)
    try {
      const res = await fetch('/api/teknisi/portfolio')
      const data = await res.json()
      if (!data.success) {
        setPortfolioMsg(data.error || 'Gagal memuat portfolio')
        setPortfolio([])
        setInitialPortfolio([])
        return
      }
      const items = (data.data as TeknisiPortfolioItemDto[]).map(portfolioFromDto)
      setPortfolio(items)
      setInitialPortfolio(items)
      setDeletedIds([])
    } catch {
      setPortfolioMsg('Gagal memuat portfolio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPortfolio()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setPortfolioMsg(null)
    try {
      for (const id of deletedIds) {
        const res = await fetch(`/api/teknisi/portfolio/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!data.success) {
          setPortfolioMsg(data.error || 'Gagal menghapus item portfolio')
          return
        }
      }

      const toSave = portfolio.filter((item) => !isEmptyDraft(item))
      const saved: PortfolioFormItem[] = []

      for (const item of toSave) {
        const result = await persistPortfolioItem(item)
        if (!result.ok) {
          setPortfolioMsg(result.error)
          return
        }
        saved.push(result.item)
      }

      setPortfolio(saved)
      setInitialPortfolio(saved)
      setDeletedIds([])
      onClose()
    } catch {
      setPortfolioMsg('Gagal menyimpan portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPortfolio(initialPortfolio)
    setDeletedIds([])
    setPortfolioMsg(null)
    onClose()
  }

  const handlePortfolioChange = (next: PortfolioFormItem[]) => {
    const removed = portfolio.filter(
      (item) => item.id && !next.some((n) => n.id === item.id),
    )
    if (removed.length > 0) {
      setDeletedIds((prev) => [
        ...prev,
        ...removed.map((r) => r.id!).filter((id) => !prev.includes(id)),
      ])
    }
    setPortfolio(next)
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-surface-500">
        Sorotan kasus di bagian Portfolio & Case Highlights. Klik Simpan untuk menerapkan perubahan.
      </p>
      {loading ? (
        <p className="text-sm text-surface-500">Memuat portfolio…</p>
      ) : (
        <PortfolioEditor
          items={portfolio}
          onChange={handlePortfolioChange}
          portfolioMsg={portfolioMsg}
        />
      )}

      <div className={cn('flex gap-2 border-t border-surface-100 pt-4')}>
        <Button
          type="button"
          variant="primary"
          disabled={saving || loading}
          onClick={() => void handleSave()}
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={handleCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}
