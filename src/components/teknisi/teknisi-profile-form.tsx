'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import {
  DEFAULT_BRAND_FOCUS,
  DEFAULT_ISSUES_HANDLED,
  DEFAULT_WORK_APPROACH,
  emptyConsultationService,
  type ProfileConsultationService,
} from '@/lib/teknisi-profile-content'
import {
  STORE_WEEKDAYS,
  type StoreOperatingHours,
} from '@/lib/store-operating-hours'
import type { TeknisiPortfolioItemDto, TeknisiPortfolioIcon } from '@/lib/teknisi-portfolio'
import { isUploadedPortfolioImage } from '@/lib/portfolio-image'
import { isR2PublicUrl } from '@/lib/image-url-utils'
import { OperatingHoursEditor } from './operating-hours-editor'
import { InspectionServiceToggle } from './inspection-service-toggle'
import { Plus, Trash2, ChevronUp, ChevronDown, X } from '@/lib/icons'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function deepCopyOperatingHours(hours: StoreOperatingHours): StoreOperatingHours {
  const copy = {} as StoreOperatingHours
  for (const { key } of STORE_WEEKDAYS) {
    copy[key] = { ...hours[key] }
  }
  return copy
}

function profileToForm(p: TeknisiAccountProfileDto) {
  return {
    name: p.name,
    phone: p.phone ?? '',
    experience: p.experience ?? '',
    location: p.location ?? '',
    description: p.description ?? '',
    tagline: p.tagline ?? '',
    issuesHandled: p.issuesHandled ?? DEFAULT_ISSUES_HANDLED,
    brandFocus: p.brandFocus ?? DEFAULT_BRAND_FOCUS,
    workApproach: p.workApproach ?? DEFAULT_WORK_APPROACH,
    responseTime: p.responseTime ?? '',
    price: String(p.price),
    specialty: [...p.specialty],
    serviceScope: [...p.serviceScope],
    languages: [...p.languages],
    secondarySkills: [...p.secondarySkills],
    operatingHours: deepCopyOperatingHours(p.operatingHours),
    consultationServices: p.consultationServices.map((s) => ({ ...s })),
    coverImage: p.coverImage,
    image: p.image,
    email: p.email,
    providesInspection: p.providesInspection ?? false,
    inspectionPriceOnline: p.inspectionPriceOnline,
    inspectionPriceOffline: p.inspectionPriceOffline,
  }
}

type ProfileFormState = ReturnType<typeof profileToForm>

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

function StringListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
  addLabel = 'Tambah item',
  maxItems = 24,
}: {
  label: string
  hint: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel?: string
  maxItems?: number
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-surface-700">{label}</p>
        <p className="mt-0.5 text-[11px] text-surface-500">{hint}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 font-mono text-[10px] font-bold text-surface-500">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[idx] = e.target.value
                onChange(next)
              }}
              placeholder={placeholder}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 shrink-0 p-0 text-surface-500"
              disabled={idx === 0}
              onClick={() => onChange(moveItem(items, idx, idx - 1))}
              aria-label="Naikkan"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 shrink-0 p-0 text-surface-500"
              disabled={idx === items.length - 1}
              onClick={() => onChange(moveItem(items, idx, idx + 1))}
              aria-label="Turunkan"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 shrink-0 p-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              aria-label="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...items, ''])}
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}

function TagListEditor({
  label,
  hint,
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  maxTags = 20,
}: {
  label: string
  hint?: string
  tags: string[]
  input: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (item: string) => void
  placeholder: string
  maxTags?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-surface-700">{label}</label>
      {hint && <p className="mb-2 text-[11px] text-surface-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {tags.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1 pr-1">
            {item}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-surface-200"
              aria-label={`Hapus ${item}`}
              onClick={() => onRemove(item)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          className="max-w-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={!input.trim() || tags.length >= maxTags}
        >
          + Tambah
        </Button>
      </div>
    </div>
  )
}

function ConsultationServicesEditor({
  services,
  basePrice,
  onChange,
}: {
  services: ProfileConsultationService[]
  basePrice: number
  onChange: (services: ProfileConsultationService[]) => void
}) {
  const update = (idx: number, patch: Partial<ProfileConsultationService>) => {
    const next = [...services]
    next[idx] = { ...next[idx]!, ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {services.map((svc, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-surface-200/80 bg-surface-50/40 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary-700">
              Layanan {idx + 1}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={idx === 0}
                onClick={() => onChange(moveItem(services, idx, idx - 1))}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={idx === services.length - 1}
                onClick={() => onChange(moveItem(services, idx, idx + 1))}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-rose-600"
                onClick={() => onChange(services.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Nama</label>
              <Input
                value={svc.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Konsultasi Umum"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">
                Deskripsi
              </label>
              <textarea
                value={svc.description}
                onChange={(e) => update(idx, { description: e.target.value })}
                rows={2}
                placeholder="Diagnosis perangkat, rekomendasi solusi..."
                className={cn(
                  'w-full resize-y rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink',
                  'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Durasi</label>
              <Input
                value={svc.duration}
                onChange={(e) => update(idx, { duration: e.target.value })}
                placeholder="30 menit"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">
                Harga (opsional)
              </label>
              <Input
                type="number"
                min={0}
                value={svc.price ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  update(idx, {
                    price: raw === '' ? null : Number(raw) || null,
                  })
                }}
                placeholder={String(basePrice)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-surface-600 md:col-span-2">
              <input
                type="checkbox"
                checked={svc.popular}
                onChange={(e) => update(idx, { popular: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
              />
              Tandai sebagai layanan populer
            </label>
          </div>
        </div>
      ))}
      {services.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...services, emptyConsultationService(basePrice)])}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah layanan
        </Button>
      )}
    </div>
  )
}

type PortfolioImageMode = 'url' | 'file'

function PortfolioImageField({
  imageUrl,
  onChange,
  onBlurSave,
}: {
  imageUrl: string
  onChange: (url: string) => void
  onBlurSave: (imageUrl: string) => void | Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<PortfolioImageMode>(() =>
    isUploadedPortfolioImage(imageUrl) ? 'file' : 'url',
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const previewSrc = localPreview ?? imageUrl

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
      setLocalPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
      await onBlurSave(uploadedUrl)
    } catch {
      setUploadError('Gagal mengunggah gambar')
    } finally {
      setUploading(false)
    }
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
          Upload file
        </button>
      </div>

      {mode === 'url' ? (
        <Input
          value={isUploadedPortfolioImage(imageUrl) ? '' : imageUrl}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => void onBlurSave(e.target.value.trim())}
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
          {isUploadedPortfolioImage(imageUrl) && (
            <p className="text-[10px] text-surface-500">File tersimpan di server platform.</p>
          )}
        </div>
      )}

      {uploadError && <p className="mt-1 text-[10px] text-rose-600">{uploadError}</p>}

      {previewSrc && (
        <div className="relative mt-2 aspect-video max-w-xs overflow-hidden rounded-lg border border-surface-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-ink/60 p-1 text-white hover:bg-ink/80"
            aria-label="Hapus gambar"
            onClick={() => {
              setLocalPreview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
                return null
              })
              onChange('')
              void onBlurSave('')
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
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
  const [savingIdx, setSavingIdx] = useState<number | null>(null)

  const saveItem = async (idx: number, overrides?: Partial<PortfolioFormItem>) => {
    const item = { ...items[idx]!, ...overrides }
    if (!items[idx]) return
    const title = item.title.trim()
    if (title.length < 2) return

    const payload = {
      title,
      meta: item.meta.trim(),
      result: item.result.trim(),
      imageUrl: item.imageUrl.trim() || null,
      icon: item.icon,
    }

    setSavingIdx(idx)
    try {
      if (item.id) {
        const res = await fetch(`/api/teknisi/portfolio/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) return
        const next = [...items]
        next[idx] = portfolioFromDto(data.data)
        onChange(next)
      } else {
        const res = await fetch('/api/teknisi/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) return
        const next = [...items]
        next[idx] = portfolioFromDto(data.data)
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
      const res = await fetch(`/api/teknisi/portfolio/${item.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) return
    }
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
              onClick={() => void deleteItem(idx)}
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
                onBlur={() => void saveItem(idx)}
                placeholder="Recovery perangkat mati total"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Meta</label>
              <Input
                value={item.meta}
                onChange={(e) => update(idx, { meta: e.target.value })}
                onBlur={() => void saveItem(idx)}
                placeholder="Android flagship · 48 jam"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Hasil</label>
              <textarea
                value={item.result}
                onChange={(e) => update(idx, { result: e.target.value })}
                onBlur={() => void saveItem(idx)}
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
              onBlurSave={(url) => saveItem(idx, { imageUrl: url })}
            />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Ikon</label>
              <select
                value={item.icon}
                onChange={(e) => {
                  update(idx, { icon: e.target.value as TeknisiPortfolioIcon })
                  void saveItem(idx)
                }}
                className="h-10 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="smartphone">Smartphone</option>
                <option value="wrench">Wrench</option>
                <option value="laptop">Laptop</option>
              </select>
            </div>
          </div>
          {savingIdx === idx && (
            <p className="mt-2 text-[11px] text-surface-500">Menyimpan item portfolio…</p>
          )}
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

const textareaClass = cn(
  'w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50',
)

export function TeknisiProfileForm({
  profile,
  onSaved,
  onSessionUpdate,
}: {
  profile: TeknisiAccountProfileDto
  onSaved: (p: TeknisiAccountProfileDto) => void
  onSessionUpdate?: (name: string, image?: string) => void
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(profile))
  const [portfolio, setPortfolio] = useState<PortfolioFormItem[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null)

  const [specialtyInput, setSpecialtyInput] = useState('')
  const [secondaryInput, setSecondaryInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const markDirty = () => setDirty(true)

  const applyProfile = useCallback((p: TeknisiAccountProfileDto) => {
    setForm(profileToForm(p))
    setSpecialtyInput('')
    setSecondaryInput('')
    setDirty(false)
  }, [])

  useEffect(() => {
    applyProfile(profile)
  }, [profile, applyProfile])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPortfolioLoading(true)
      setPortfolioMsg(null)
      try {
        const res = await fetch('/api/teknisi/portfolio')
        const data = await res.json()
        if (cancelled) return
        if (!data.success) {
          setPortfolioMsg(data.error || 'Gagal memuat portfolio')
          setPortfolio([])
          return
        }
        setPortfolio((data.data as TeknisiPortfolioItemDto[]).map(portfolioFromDto))
      } catch {
        if (!cancelled) setPortfolioMsg('Gagal memuat portfolio')
      } finally {
        if (!cancelled) setPortfolioLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const patchForm = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    markDirty()
  }

  const addTag = (
    listKey: 'specialty' | 'secondarySkills',
    input: string,
    clearInput: () => void,
  ) => {
    const value = input.trim()
    if (!value) return
    const list = form[listKey]
    if (list.some((s) => s.toLowerCase() === value.toLowerCase())) {
      clearInput()
      return
    }
    if (list.length >= 20) return
    patchForm(listKey, [...list, value])
    clearInput()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormMsg(null)
    try {
      const consultationServices = form.consultationServices
        .map((s) => ({
          name: s.name.trim(),
          description: s.description.trim(),
          duration: s.duration.trim() || '30 menit',
          price: s.price,
          popular: s.popular,
        }))
        .filter((s) => s.name)

      const res = await fetch('/api/teknisi/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          experience: form.experience.trim() || null,
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          tagline: form.tagline.trim() || null,
          issuesHandled: form.issuesHandled.trim() || null,
          brandFocus: form.brandFocus.trim() || null,
          workApproach: form.workApproach.trim() || null,
          responseTime: form.responseTime.trim() || null,
          price: Number(form.price) || 0,
          specialty: form.specialty,
          serviceScope: form.serviceScope.map((s) => s.trim()).filter(Boolean),
          languages: form.languages.map((s) => s.trim()).filter(Boolean),
          secondarySkills: form.secondarySkills,
          operatingHours: form.operatingHours,
          consultationServices,
          providesInspection: form.providesInspection,
          inspectionPriceOnline: form.providesInspection ? form.inspectionPriceOnline : null,
          inspectionPriceOffline: form.providesInspection ? form.inspectionPriceOffline : null,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setFormMsg(data.error || 'Gagal menyimpan profil')
        return
      }
      onSaved(data.data)
      applyProfile(data.data)
      setFormMsg('Profil berhasil disimpan')
      onSessionUpdate?.(data.data.name, data.data.image ?? undefined)
    } catch {
      setFormMsg('Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    applyProfile(profile)
    setFormMsg(null)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    setFormMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/teknisi/profile/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setFormMsg(data.error || 'Gagal mengunggah foto')
        return
      }
      onSaved(data.data)
      setForm((f) => ({ ...f, image: data.data.image }))
      setFormMsg('Foto profil diperbarui')
      onSessionUpdate?.(data.data.name, data.data.image ?? undefined)
    } catch {
      setFormMsg('Gagal mengunggah foto')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingCover(true)
    setFormMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/teknisi/profile/cover', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setFormMsg(data.error || 'Gagal mengunggah cover')
        return
      }
      onSaved(data.data)
      setForm((f) => ({ ...f, coverImage: data.data.coverImage }))
      setFormMsg('Cover profil diperbarui')
    } catch {
      setFormMsg('Gagal mengunggah cover')
    } finally {
      setUploadingCover(false)
    }
  }

  const basePrice = Number(form.price) || 0

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formMsg && (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-xs',
            formMsg.includes('berhasil') || formMsg.includes('diperbarui')
              ? 'bg-primary-50 text-primary-800'
              : 'bg-rose-50 text-rose-700',
          )}
        >
          {formMsg}
        </p>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Profil publik</h3>
        <p className="text-[11px] text-surface-500">
          Informasi yang tampil di halaman profil publik teknisi.
        </p>

        <div className="mb-2 flex flex-wrap items-start gap-6">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
            {form.image ? (
              <Image
                src={form.image}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized={form.image.startsWith('/uploads/') || isR2PublicUrl(form.image)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {getInitials(form.name)}
              </span>
            )}
          </div>
          <div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {uploadingAvatar ? 'Mengunggah…' : 'Ubah Foto'}
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Cover profil</label>
          {form.coverImage && (
            <div className="relative mb-2 aspect-[3/1] max-w-md overflow-hidden rounded-xl border border-surface-200">
              <img src={form.coverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleCoverChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingCover}
            onClick={() => coverInputRef.current?.click()}
          >
            {uploadingCover ? 'Mengunggah…' : 'Ubah Cover'}
          </Button>
          <p className="mt-1 text-[11px] text-surface-500">Banner di bagian atas halaman profil publik.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Nama Lengkap</label>
            <Input
              required
              value={form.name}
              onChange={(e) => patchForm('name', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
            <Input type="email" value={form.email} disabled className="bg-surface-50" />
            <p className="mt-1 text-[11px] text-surface-500">Email tidak dapat diubah dari sini.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">No. Telepon</label>
            <Input
              value={form.phone}
              onChange={(e) => patchForm('phone', e.target.value)}
              placeholder="081234567890"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Lokasi</label>
            <Input
              value={form.location}
              onChange={(e) => patchForm('location', e.target.value)}
              placeholder="Jakarta Selatan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Pengalaman</label>
            <Input
              value={form.experience}
              onChange={(e) => patchForm('experience', e.target.value)}
              placeholder="8 tahun"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Estimasi respons
            </label>
            <Input
              value={form.responseTime}
              onChange={(e) => patchForm('responseTime', e.target.value)}
              placeholder="< 5 menit"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Harga Konsultasi (Rp)
            </label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => patchForm('price', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Tagline</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.tagline}
            onChange={(e) => patchForm('tagline', e.target.value)}
            placeholder="Spesialis unlock & flashing dengan diagnosis cepat..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
          <textarea
            className={textareaClass}
            rows={4}
            value={form.description}
            onChange={(e) => patchForm('description', e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <h3 className="text-sm font-semibold text-ink">Ringkasan profesional</h3>
        <p className="text-[11px] text-surface-500">Kartu ringkasan di bagian About pada profil publik.</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Issue handled</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.issuesHandled}
            onChange={(e) => patchForm('issuesHandled', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Brand focus</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.brandFocus}
            onChange={(e) => patchForm('brandFocus', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Work approach</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.workApproach}
            onChange={(e) => patchForm('workApproach', e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <InspectionServiceToggle
          enabled={form.providesInspection}
          onChange={(enabled) => patchForm('providesInspection', enabled)}
          priceOnline={form.inspectionPriceOnline}
          priceOffline={form.inspectionPriceOffline}
          onPriceOnlineChange={(value) => patchForm('inspectionPriceOnline', value)}
          onPriceOfflineChange={(value) => patchForm('inspectionPriceOffline', value)}
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <TagListEditor
          label="Spesialisasi utama"
          tags={form.specialty}
          input={specialtyInput}
          onInputChange={setSpecialtyInput}
          onAdd={() => addTag('specialty', specialtyInput, () => setSpecialtyInput(''))}
          onRemove={(item) => patchForm('specialty', form.specialty.filter((s) => s !== item))}
          placeholder="Tambah spesialisasi"
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <TagListEditor
          label="Keahlian tambahan"
          hint='Tampil di bagian "Also fluent in"'
          tags={form.secondarySkills}
          input={secondaryInput}
          onInputChange={setSecondaryInput}
          onAdd={() => addTag('secondarySkills', secondaryInput, () => setSecondaryInput(''))}
          onRemove={(item) =>
            patchForm('secondarySkills', form.secondarySkills.filter((s) => s !== item))
          }
          placeholder="Screen Replacement"
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <StringListEditor
          label="Cakupan layanan"
          hint="Daftar bullet di panel Service Scope pada profil publik."
          items={form.serviceScope}
          onChange={(serviceScope) => patchForm('serviceScope', serviceScope)}
          placeholder="Konsultasi pra-servis dengan estimasi risiko"
          addLabel="Tambah cakupan"
        />
        <StringListEditor
          label="Bahasa"
          hint="Ditampilkan di panel Service Scope (contoh: Bahasa: Indonesia)."
          items={form.languages}
          onChange={(languages) => patchForm('languages', languages)}
          placeholder="Indonesia"
          addLabel="Tambah bahasa"
          maxItems={8}
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <h3 className="text-sm font-semibold text-ink">Layanan konsultasi</h3>
        <p className="text-[11px] text-surface-500">
          Daftar layanan di menu konsultasi profil publik. Harga kosong memakai harga dasar.
        </p>
        <ConsultationServicesEditor
          services={form.consultationServices}
          basePrice={basePrice}
          onChange={(consultationServices) => patchForm('consultationServices', consultationServices)}
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <OperatingHoursEditor
          title="Jam ketersediaan konsultasi"
          hint="Ditampilkan di sidebar Availability pada profil publik."
          hours={form.operatingHours}
          onChange={(operatingHours) => patchForm('operatingHours', operatingHours)}
          className="md:col-span-2 space-y-3"
        />
      </section>

      <section className="space-y-4 border-t border-surface-100 pt-6">
        <h3 className="text-sm font-semibold text-ink">Portfolio</h3>
        <p className="text-[11px] text-surface-500">
          Sorotan kasus di bagian Portfolio & Case Highlights. Setiap baris disimpan otomatis saat selesai mengisi.
        </p>
        {portfolioLoading ? (
          <p className="text-sm text-surface-500">Memuat portfolio…</p>
        ) : (
          <PortfolioEditor
            items={portfolio}
            onChange={setPortfolio}
            portfolioMsg={portfolioMsg}
          />
        )}
      </section>

      <div className="flex gap-2 border-t border-surface-100 pt-4">
        <Button type="submit" variant="primary" disabled={saving || !dirty}>
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving || !dirty}>
          Batal
        </Button>
      </div>
    </form>
  )
}
