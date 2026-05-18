'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DashboardPageHeader,
  DashboardPanel,
  EmptyState,
  MetricCard,
  StatusBadge,
} from '@/components/dashboard'
import {
  Plus,
  Edit,
  MapPin,
  Clock,
  Star,
  Store,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  Eye,
  Trash2,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { TeknisiStoreDto } from '@/lib/teknisi-store-serializer'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop'

const emptyForm = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  jamWeekdays: '09:00 – 21:00',
  jamWeekend: '10:00 – 20:00',
  layanan: 'Service HP, Jual Beli, Unlock, Flashing',
}

function StoreForm({
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
  initial: typeof emptyForm
  submitLabel: string
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  const [form, setForm] = useState(initial)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('city', form.city.trim())
    fd.append('address', form.address.trim())
    fd.append('phone', form.phone.trim())
    fd.append('email', form.email.trim())
    fd.append('jamWeekdays', form.jamWeekdays.trim())
    fd.append('jamWeekend', form.jamWeekend.trim())
    fd.append('layanan', form.layanan.trim())
    const coverInput = (e.target as HTMLFormElement).elements.namedItem('cover') as HTMLInputElement
    if (coverInput?.files?.[0]) fd.append('cover', coverInput.files[0])
    await onSubmit(fd)
  }

  return (
    <DashboardPanel title={title} description={description}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Nama Toko</label>
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
            <label className="mb-1 block text-sm font-medium text-surface-700">Alamat Lengkap</label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Jl. Thamrin No. 123"
            />
          </div>
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
              placeholder="info@toko.id"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Jam Sen–Jum</label>
            <Input
              value={form.jamWeekdays}
              onChange={(e) => setForm((f) => ({ ...f, jamWeekdays: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Jam Sab–Min</label>
            <Input
              value={form.jamWeekend}
              onChange={(e) => setForm((f) => ({ ...f, jamWeekend: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Layanan (pisahkan dengan koma)
            </label>
            <Input
              value={form.layanan}
              onChange={(e) => setForm((f) => ({ ...f, layanan: e.target.value }))}
              placeholder="Service HP, Unlock, Flashing"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-surface-700">Foto cover</label>
            <Input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/gif" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
        </div>
      </form>
    </DashboardPanel>
  )
}

export default function TeknisiTokoPage() {
  const [toko, setToko] = useState<TeknisiStoreDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadToko = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/teknisi/toko')
      const data = await res.json()
      if (data.success) setToko(data.data)
    } catch {
      setFormError('Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadToko()
  }, [loadToko])

  const storeToForm = (s: TeknisiStoreDto) => ({
    name: s.name,
    city: s.city ?? '',
    address: s.address ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    jamWeekdays: s.jamWeekdays ?? '',
    jamWeekend: s.jamWeekend ?? '',
    layanan: s.layanan.join(', '),
  })

  const handleCreate = async (fd: FormData) => {
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/teknisi/toko', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setFormError(data.error || 'Gagal membuat toko')
        return
      }
      setToko(data.data)
      setShowAddForm(false)
    } catch {
      setFormError('Gagal membuat toko')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (fd: FormData) => {
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/teknisi/toko', { method: 'PATCH', body: fd })
      const data = await res.json()
      if (!data.success) {
        setFormError(data.error || 'Gagal menyimpan perubahan')
        return
      }
      setToko(data.data)
      setShowEditForm(false)
    } catch {
      setFormError('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toko) return
    if (!confirm(`Hapus toko "${toko.name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/teknisi/toko', { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal menghapus toko')
        return
      }
      setToko(null)
      setShowEditForm(false)
    } catch {
      alert('Gagal menghapus toko')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!toko) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('togglePublish', 'true')
      const res = await fetch('/api/teknisi/toko', { method: 'PATCH', body: fd })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal mengubah status publikasi')
        return
      }
      setToko(data.data)
    } catch {
      alert('Gagal mengubah status publikasi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-surface-500">Memuat data toko...</p>
  }

  if (!toko && !showAddForm) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          eyebrow="Toko & mitra"
          title="Toko"
          description="Kelola informasi toko handphone Anda agar mudah ditemukan pelanggan."
          actions={
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Toko
            </Button>
          }
        />
        <EmptyState
          icon={Store}
          title="Belum ada toko terdaftar"
          description="Daftarkan toko handphone Anda untuk tampil di marketplace dan menerima order."
          action={
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Daftarkan Toko
            </Button>
          }
        />
      </div>
    )
  }

  if (!toko && showAddForm) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Tambah Toko"
          description="Lengkapi profil toko handphone Anda."
        />
        <StoreForm
          title="Data Toko Baru"
          description="Informasi ini akan ditampilkan di halaman publik toko Anda."
          initial={emptyForm}
          submitLabel="Daftarkan Toko"
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
          error={formError}
        />
      </div>
    )
  }

  if (!toko) return null

  const locationLabel = [toko.address, toko.city].filter(Boolean).join(', ')

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <DashboardPageHeader
        title="Toko"
        description="Kelola informasi toko handphone Anda agar mudah ditemukan pelanggan."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/toko/${toko.id}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Lihat publik
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={saving}
              onClick={() => void handleTogglePublish()}
            >
              {toko.isPublished ? 'Jadikan draft' : 'Publikasikan'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowEditForm((open) => !open)}
            >
              <Edit className="h-3.5 w-3.5" />
              {showEditForm ? 'Tutup' : 'Edit toko'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
              disabled={saving}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus toko
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <StatusBadge status={toko.isPublished ? 'approved' : 'draft'} />
            {toko.badge && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {toko.badge}
              </span>
            )}
            {toko.isPublished && (
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                Tampil di marketplace
              </span>
            )}
          </div>
        }
      />

      {showEditForm && (
        <StoreForm
          title="Edit Toko"
          description="Perbarui profil, foto, layanan, jam operasional, dan kontak toko Anda."
          initial={storeToForm(toko)}
          submitLabel="Simpan perubahan"
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
          saving={saving}
          error={formError}
        />
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard
          title="Rating"
          value={toko.rating > 0 ? toko.rating.toFixed(1) : '—'}
          footnote={`${toko.reviewCount} ulasan`}
          icon={Star}
          tone="primary"
          compact
          dense
        />
        <MetricCard
          title="Total Penjualan"
          value={toko.totalPenjualan.toLocaleString('id-ID')}
          footnote="Semua waktu"
          icon={Store}
          tone="primary"
          compact
          dense
        />
        <MetricCard
          title="Dilihat Profil"
          value={toko.profileViews.toLocaleString('id-ID')}
          footnote="30 hari terakhir"
          icon={Eye}
          tone="neutral"
          compact
          dense
        />
      </div>

      <Card tone="glass" className="overflow-hidden p-0">
        <div className="relative h-36 sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={toko.coverImage ?? DEFAULT_COVER}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white backdrop-blur-md sm:h-14 sm:w-14">
                <Store className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0 text-white">
                <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{toko.name}</h2>
                {locationLabel && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/85 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-4 sm:p-5">
          {toko.layanan.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {toko.layanan.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className={cn(
                    'rounded-full border border-primary-200/50 bg-primary-50/80 px-3 py-1 text-xs font-medium text-primary-800',
                  )}
                >
                  {item}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                <Clock className="h-3.5 w-3.5" />
                Jam operasional
              </p>
              <p className="text-sm font-medium text-ink">
                Sen–Jum: {toko.jamWeekdays ?? '—'}
              </p>
              <p className="mt-1 text-sm text-surface-600">
                Sab–Min: {toko.jamWeekend ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                Kontak
              </p>
              {toko.phone && (
                <p className="flex items-center gap-2 text-sm text-ink">
                  <Phone className="h-3.5 w-3.5 text-primary-600" />
                  {toko.phone}
                </p>
              )}
              {toko.email && (
                <p className="mt-1.5 flex items-center gap-2 text-sm text-surface-600">
                  <Mail className="h-3.5 w-3.5 text-primary-600" />
                  {toko.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
