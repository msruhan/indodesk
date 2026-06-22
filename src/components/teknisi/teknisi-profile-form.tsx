'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import { isR2PublicUrl } from '@/lib/image-url-utils'
import { InspectionServiceToggle } from './inspection-service-toggle'
import { Plus, Trash2, ChevronUp, ChevronDown, X, Eye, Lock } from '@/lib/icons'

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

function mergeSkillTags(specialty: string[], secondarySkills: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const raw of [...specialty, ...secondarySkills]) {
    const value = raw.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(value)
  }
  return merged
}

function profileToForm(p: TeknisiAccountProfileDto) {
  return {
    name: p.name,
    phone: p.phone ?? '',
    experience: p.experience ?? '',
    description: p.description ?? '',
    tagline: p.tagline ?? '',
    issuesHandled: p.issuesHandled ?? '',
    brandFocus: p.brandFocus ?? '',
    workApproach: p.workApproach ?? '',
    responseTime: p.responseTime,
    price: String(p.price),
    specialty: mergeSkillTags(p.specialty, p.secondarySkills),
    serviceScope: [...p.serviceScope],
    languages: [...p.languages],
    coverImage: p.coverImage,
    image: p.image,
    email: p.email,
    providesInspection: p.providesInspection ?? false,
    inspectionPriceOnline: p.inspectionPriceOnline,
    inspectionPriceOffline: p.inspectionPriceOffline,
    isProfileHidden: p.isProfileHidden ?? false,
  }
}

type ProfileFormState = ReturnType<typeof profileToForm>

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

const textareaClass = cn(
  'w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50',
)

export type TeknisiProfileFormSection = 'hero' | 'about' | 'skills' | 'full'

export function TeknisiProfileForm({
  profile,
  onSaved,
  onSessionUpdate,
  section = 'full',
  onCancel,
}: {
  profile: TeknisiAccountProfileDto
  onSaved: (p: TeknisiAccountProfileDto) => void
  onSessionUpdate?: (name: string, image?: string) => void
  section?: TeknisiProfileFormSection
  onCancel?: () => void
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(profile))
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const markDirty = () => setDirty(true)

  const applyProfile = useCallback((p: TeknisiAccountProfileDto) => {
    setForm(profileToForm(p))
    setSpecialtyInput('')
    setDirty(false)
  }, [])

  useEffect(() => {
    applyProfile(profile)
  }, [profile, applyProfile])

  const patchForm = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    markDirty()
  }

  const addSkillTag = (input: string, clearInput: () => void) => {
    const value = input.trim()
    if (!value) return
    if (form.specialty.some((s) => s.toLowerCase() === value.toLowerCase())) {
      clearInput()
      return
    }
    if (form.specialty.length >= 20) return
    patchForm('specialty', [...form.specialty, value])
    clearInput()
  }

  const showHero = section === 'hero' || section === 'full'
  const showAbout = section === 'about' || section === 'full'
  const showSkills = section === 'skills' || section === 'full'
  const showScope = section === 'about' || section === 'full'
  const showInspection = section === 'about' || section === 'full'
  const isPartial = section !== 'full'

  const buildPatchBody = () => {
    if (section === 'hero') {
      return {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        experience: form.experience.trim() || null,
        tagline: form.tagline.trim() || null,
        price: Number(form.price) || 0,
        isProfileHidden: form.isProfileHidden,
      }
    }
    if (section === 'about') {
      return {
        description: form.description.trim() || null,
        issuesHandled: form.issuesHandled.trim() || null,
        brandFocus: form.brandFocus.trim() || null,
        workApproach: form.workApproach.trim() || null,
        serviceScope: form.serviceScope.map((s) => s.trim()).filter(Boolean),
        languages: form.languages.map((s) => s.trim()).filter(Boolean),
        providesInspection: form.providesInspection,
        inspectionPriceOnline: form.providesInspection ? form.inspectionPriceOnline : null,
        inspectionPriceOffline: form.providesInspection ? form.inspectionPriceOffline : null,
      }
    }
    if (section === 'skills') {
      return {
        specialty: form.specialty,
        secondarySkills: [],
      }
    }
    return {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      experience: form.experience.trim() || null,
      description: form.description.trim() || null,
      tagline: form.tagline.trim() || null,
      issuesHandled: form.issuesHandled.trim() || null,
      brandFocus: form.brandFocus.trim() || null,
      workApproach: form.workApproach.trim() || null,
      price: Number(form.price) || 0,
      specialty: form.specialty,
      serviceScope: form.serviceScope.map((s) => s.trim()).filter(Boolean),
      languages: form.languages.map((s) => s.trim()).filter(Boolean),
      secondarySkills: [],
      providesInspection: form.providesInspection,
      inspectionPriceOnline: form.providesInspection ? form.inspectionPriceOnline : null,
      inspectionPriceOffline: form.providesInspection ? form.inspectionPriceOffline : null,
      isProfileHidden: form.isProfileHidden,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setFormMsg(null)
    try {
      const res = await fetch('/api/teknisi/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPatchBody()),
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
    onCancel?.()
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

      {showHero ? (
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Profil publik</h3>
        <p className="text-[11px] text-surface-500">
          Informasi yang tampil di bagian atas halaman profil publik teknisi.
        </p>

        <div
          className={cn(
            'rounded-xl border p-4 transition-colors',
            form.isProfileHidden
              ? 'border-amber-200/80 bg-amber-50/50'
              : 'border-surface-200/80 bg-surface-50/40',
          )}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.isProfileHidden}
              onChange={(e) => patchForm('isProfileHidden', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {form.isProfileHidden ? (
                  <Lock className="h-4 w-4 shrink-0 text-amber-700" />
                ) : (
                  <Eye className="h-4 w-4 shrink-0 text-primary-600" />
                )}
                <p className="text-sm font-medium text-ink">Sembunyikan profil publik</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-surface-600">
                Profil tidak tampil di halaman Cari Teknisi dan URL profil tidak dapat diakses
                orang lain. Layanan aktif (pesanan, konsultasi) tetap berjalan.
              </p>
              {!form.isProfileHidden && (
                <Link
                  href={`/teknisi/${profile.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-xs font-medium text-primary-700 hover:underline"
                >
                  Lihat profil publik →
                </Link>
              )}
            </div>
          </label>
        </div>

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
            <p className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700">
              {form.responseTime}
            </p>
            <p className="mt-1 text-[11px] text-surface-500">
              Dihitung otomatis dari rata-rata waktu respons sesi konsultasi dan remote Anda.
            </p>
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
            <p className="mt-1 text-[11px] text-surface-500">
              Paket layanan dikelola di{' '}
              <Link href="/teknisi/iklan-konsultasi" className="font-medium text-primary-700 underline">
                Iklan konsultasi
              </Link>
              .
            </p>
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

        {section === 'full' ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
          <textarea
            className={textareaClass}
            rows={4}
            value={form.description}
            onChange={(e) => patchForm('description', e.target.value)}
          />
        </div>
        ) : null}
      </section>
      ) : null}

      {showAbout ? (
      <section className={cn('space-y-4', showHero && 'border-t border-surface-100 pt-6')}>
        {section === 'about' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
            <textarea
              className={textareaClass}
              rows={4}
              value={form.description}
              onChange={(e) => patchForm('description', e.target.value)}
            />
          </div>
        ) : null}
        <h3 className="text-sm font-semibold text-ink">Ringkasan profesional</h3>
        <p className="text-[11px] text-surface-500">Kartu ringkasan di bagian About pada profil publik.</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Issue handled</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.issuesHandled}
            onChange={(e) => patchForm('issuesHandled', e.target.value)}
            placeholder="Contoh: bootloop, layar mati, water damage, performa lambat"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Brand focus</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.brandFocus}
            onChange={(e) => patchForm('brandFocus', e.target.value)}
            placeholder="Contoh: Android, iPhone, laptop consumer"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Work approach</label>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.workApproach}
            onChange={(e) => patchForm('workApproach', e.target.value)}
            placeholder="Contoh: diagnosis awal, estimasi, eksekusi, quality check"
          />
        </div>
      </section>
      ) : null}

      {showInspection ? (
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
      ) : null}

      {showSkills ? (
      <section className="space-y-4 border-t border-surface-100 pt-6">
        <TagListEditor
          label="Spesialisasi & keahlian"
          hint="Ditampilkan di bagian Skills & Expertise pada profil publik."
          tags={form.specialty}
          input={specialtyInput}
          onInputChange={setSpecialtyInput}
          onAdd={() => addSkillTag(specialtyInput, () => setSpecialtyInput(''))}
          onRemove={(item) => patchForm('specialty', form.specialty.filter((s) => s !== item))}
          placeholder="Tambah keahlian"
        />
      </section>
      ) : null}

      {showScope ? (
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
      ) : null}

      <div className="flex gap-2 border-t border-surface-100 pt-4">
        <Button type="submit" variant="primary" disabled={saving || !dirty}>
          {saving ? 'Menyimpan…' : isPartial ? 'Simpan' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
          Batal
        </Button>
      </div>
    </form>
  )
}
