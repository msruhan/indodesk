'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardPanel } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import {
  DEFAULT_STORE_JOURNEY,
  assignJourneyIcons,
  emptyJourneyMilestone,
  type StoreJourneyMilestone,
} from '@/lib/store-content'
import { defaultOperatingHours, type StoreOperatingHours } from '@/lib/store-operating-hours'
import { OperatingHoursEditor } from './operating-hours-editor'
import {
  StoreGalleryEditor,
  buildStoreGalleryFormData,
  slotsFromGallery,
  type StoreGallerySlot,
} from './store-gallery-editor'
import { Plus, Trash2, ChevronUp, ChevronDown } from '@/lib/icons'

export type TeknisiStoreFormValues = {
  name: string
  city: string
  address: string
  phone: string
  email: string
  instagram: string
  tiktok: string
  operatingHours: StoreOperatingHours
  journeyIntro: string
  layanan: string[]
  journey: StoreJourneyMilestone[]
  gallery: string[]
}

export const defaultStoreFormValues: TeknisiStoreFormValues = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  instagram: '',
  tiktok: '',
  operatingHours: defaultOperatingHours(),
  journeyIntro:
    'Dari servis online hingga toko fisik — perjalanan membangun kepercayaan pelanggan satu per satu.',
  layanan: ['Service HP', 'Jual Beli', 'Unlock', 'Flashing'],
  journey: DEFAULT_STORE_JOURNEY.map((m) => ({ ...m })),
  gallery: [],
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function StringListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
  maxItems = 24,
}: {
  label: string
  hint: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
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
          Tambah layanan
        </Button>
      )}
    </div>
  )
}

function JourneyEditor({
  intro,
  items,
  onIntroChange,
  onItemsChange,
}: {
  intro: string
  items: StoreJourneyMilestone[]
  onIntroChange: (v: string) => void
  onItemsChange: (items: StoreJourneyMilestone[]) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">
          Ringkasan cerita (opsional)
        </label>
        <Input
          value={intro}
          onChange={(e) => onIntroChange(e.target.value)}
          placeholder="Dari servis online hingga toko fisik..."
        />
        <p className="mt-1 text-[11px] text-surface-500">
          Teks pendek di bawah judul &quot;Cerita di Balik Toko&quot; pada halaman publik.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-surface-700">Tahapan perjalanan</p>
        {items.map((step, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-surface-200/80 bg-surface-50/40 p-3 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary-700">
                Tahap {idx + 1}
                {idx === items.length - 1 && items.length > 0 ? ' · terbaru' : ''}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={idx === 0}
                  onClick={() => onItemsChange(moveItem(items, idx, idx - 1))}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={idx === items.length - 1}
                  onClick={() => onItemsChange(moveItem(items, idx, idx + 1))}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-rose-600"
                  onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Tahun</label>
                <Input
                  value={step.year}
                  onChange={(e) => {
                    const next = [...items]
                    next[idx] = { ...step, year: e.target.value }
                    onItemsChange(next)
                  }}
                  placeholder="2024"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Judul</label>
                <Input
                  value={step.title}
                  onChange={(e) => {
                    const next = [...items]
                    next[idx] = { ...step, title: e.target.value }
                    onItemsChange(next)
                  }}
                  placeholder="Toko Resmi"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">
                  Deskripsi
                </label>
                <textarea
                  value={step.description}
                  onChange={(e) => {
                    const next = [...items]
                    next[idx] = { ...step, description: e.target.value }
                    onItemsChange(next)
                  }}
                  rows={2}
                  placeholder="Ceritakan milestone toko Anda..."
                  className={cn(
                    'w-full resize-y rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink',
                    'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                  )}
                />
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
            onClick={() => onItemsChange([...items, emptyJourneyMilestone()])}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah tahapan
          </Button>
        )}
        {items.length === 0 && (
          <p className="text-[11px] text-surface-500">
            Kosongkan semua tahapan jika tidak ingin menampilkan bagian perjalanan di halaman publik.
          </p>
        )}
      </div>
    </div>
  )
}

export function TeknisiStoreForm({
  title,
  description,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
  error,
}: {
  title: string
  description: string
  initial: TeknisiStoreFormValues
  submitLabel: string
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  const [form, setForm] = useState(initial)
  const [gallerySlots, setGallerySlots] = useState<StoreGallerySlot[]>(() =>
    slotsFromGallery(initial.gallery),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const layanan = form.layanan.map((s) => s.trim()).filter(Boolean)
    const journey = assignJourneyIcons(
      form.journey
        .map((m) => ({
          year: m.year.trim(),
          title: m.title.trim(),
          description: m.description.trim(),
        }))
        .filter((m) => m.year || m.title || m.description),
    )

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('city', form.city.trim())
    fd.append('address', form.address.trim())
    fd.append('phone', form.phone.trim())
    fd.append('email', form.email.trim())
    fd.append('instagram', form.instagram.trim())
    fd.append('tiktok', form.tiktok.trim())
    fd.append('operatingHoursJson', JSON.stringify(form.operatingHours))
    fd.append('journeyIntro', form.journeyIntro.trim())
    fd.append('layananJson', JSON.stringify(layanan))
    fd.append('journeyJson', JSON.stringify(journey))

    const coverInput = (e.target as HTMLFormElement).elements.namedItem('cover') as HTMLInputElement
    if (coverInput?.files?.[0]) fd.append('cover', coverInput.files[0])

    buildStoreGalleryFormData(gallerySlots, fd)

    await onSubmit(fd)
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <DashboardPanel
        title={title}
        description={description}
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-ink">Profil & lokasi</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Nama toko</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="HandPhone Center Jakarta"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Kota</label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Jakarta"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-surface-700">Alamat lengkap</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Jl. Thamrin No. 123, Jakarta Pusat"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-surface-700">Foto cover</label>
                <Input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/gif" />
                <p className="mt-1 text-[11px] text-surface-500">Banner di bagian atas halaman detail toko.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-surface-100 pt-6">
            <h3 className="text-sm font-semibold text-ink">Galeri &amp; suasana</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <StoreGalleryEditor slots={gallerySlots} onChange={setGallerySlots} />
            </div>
          </section>

          <section className="space-y-4 border-t border-surface-100 pt-6">
            <h3 className="text-sm font-semibold text-ink">Hubungi & kunjungi</h3>
            <p className="text-[11px] text-surface-500">
              Sesuai bagian kontak di halaman publik (telepon, email, jam operasional, Instagram, TikTok).
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Telepon</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0812-3456-7890"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="info@handphonecenter.id"
                />
              </div>
              <OperatingHoursEditor
                title="Jam operasional"
                hint="Atur jam buka per hari — ditampilkan di halaman publik toko."
                className="md:col-span-2 space-y-3"
                hours={form.operatingHours}
                onChange={(operatingHours) => setForm((f) => ({ ...f, operatingHours }))}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Instagram</label>
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="handphonecenter.jkt"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">TikTok</label>
                <Input
                  value={form.tiktok}
                  onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
                  placeholder="handphonecenter.jkt"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-surface-100 pt-6">
            <StringListEditor
              label="Layanan kami"
              hint="Daftar layanan di halaman publik. Urutan dapat diatur."
              items={form.layanan}
              onChange={(layanan) => setForm((f) => ({ ...f, layanan }))}
              placeholder="Service HP"
            />
          </section>

          <section className="space-y-4 border-t border-surface-100 pt-6">
            <h3 className="text-sm font-semibold text-ink">Cerita di balik toko</h3>
            <JourneyEditor
              intro={form.journeyIntro}
              items={form.journey}
              onIntroChange={(journeyIntro) => setForm((f) => ({ ...f, journeyIntro }))}
              onItemsChange={(journey) => setForm((f) => ({ ...f, journey }))}
            />
          </section>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-surface-100 pt-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Menyimpan...' : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
        </div>
      </DashboardPanel>
    </form>
  )
}
