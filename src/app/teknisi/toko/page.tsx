'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DashboardPageHeader,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import {
  TeknisiStoreForm,
  defaultStoreFormValues,
  type TeknisiStoreFormValues,
} from '@/components/teknisi/teknisi-store-form'
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
  Trash2,
  Instagram,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { listingStatusLabel } from '@/lib/product-catalog'
import type { TeknisiStoreDto } from '@/lib/teknisi-store-serializer'
import { formatOperatingHoursLines, STORE_WEEKDAYS } from '@/lib/store-operating-hours'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop'

function storeToForm(s: TeknisiStoreDto): TeknisiStoreFormValues {
  return {
    name: s.name,
    city: s.city ?? '',
    address: s.address ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    instagram: s.instagram ?? '',
    tiktok: s.tiktok ?? '',
    operatingHours: Object.fromEntries(
      STORE_WEEKDAYS.map(({ key }) => [key, { ...s.operatingHours[key] }]),
    ) as TeknisiStoreFormValues['operatingHours'],
    journeyIntro: s.journeyIntro ?? '',
    layanan: s.layanan.length > 0 ? [...s.layanan] : [''],
    journey: s.journey.map((m) => ({ ...m })),
  }
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
          description="Daftarkan toko handphone Anda. Setelah admin menyetujui, Anda bisa mempublikasikan ke website."
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
        <TeknisiStoreForm
          title="Data Toko Baru"
          description="Setelah disimpan, status awal toko adalah menunggu review admin sebelum bisa tampil di website."
          initial={defaultStoreFormValues}
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
  const isPending = toko.listingStatus === 'PENDING'
  const isRejected = toko.listingStatus === 'REJECTED'
  const isApproved = toko.listingStatus === 'APPROVED'
  const canPublish = isApproved
  const canViewPublic = isApproved && toko.isPublished

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
          <div className="flex flex-nowrap items-center gap-1.5 sm:flex-wrap sm:gap-2">
            {canViewPublic ? (
              <Link href={`/toko/${toko.id}`} target="_blank" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Lihat publik
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                disabled
                title="Tersedia setelah disetujui admin dan dipublikasikan"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Lihat publik
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={saving || !canPublish}
              title={
                isPending
                  ? 'Menunggu review admin'
                  : isRejected
                    ? 'Toko ditolak — edit lalu kirim ulang'
                    : undefined
              }
              onClick={() => void handleTogglePublish()}
            >
              {toko.isPublished ? 'Jadikan draft' : 'Publikasikan'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setShowEditForm((open) => !open)}
            >
              <Edit className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">{showEditForm ? 'Tutup' : 'Edit'}</span>
              <span className="hidden sm:inline">{showEditForm ? 'Tutup' : 'Edit toko'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 gap-0 p-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-4"
              disabled={saving}
              aria-label="Hapus toko"
              title="Hapus toko"
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hapus toko</span>
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            {isPending ? (
              <Badge variant="warning">{listingStatusLabel('PENDING')}</Badge>
            ) : isRejected ? (
              <Badge variant="danger">{listingStatusLabel('REJECTED')}</Badge>
            ) : (
              <StatusBadge status={toko.isPublished ? 'approved' : 'draft'} />
            )}
            {isApproved && !toko.isPublished && (
              <span className="text-surface-500">Disembunyikan sementara</span>
            )}
            {toko.badge && isApproved && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {toko.badge}
              </span>
            )}
            {toko.isPublished && (
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                Tampil di website
              </span>
            )}
          </div>
        }
      />

      {isPending && (
        <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Toko Anda sedang <strong>menunggu review oleh Admin</strong>. Setelah disetujui, Anda dapat
          mempublikasikan toko agar tampil di website.
        </p>
      )}
      {isRejected && (
        <p className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
          Toko ditolak admin. Perbarui data toko lalu simpan — permintaan akan dikirim ulang ke menu
          Approval admin.
        </p>
      )}

      {showEditForm && (
        <TeknisiStoreForm
          title="Edit Toko"
          description="Perbarui profil toko. Jika sebelumnya ditolak, simpan akan mengirim ulang ke review admin."
          initial={storeToForm(toko)}
          submitLabel="Simpan perubahan"
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
          saving={saving}
          error={formError}
        />
      )}

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

          {toko.journey.length > 0 && (
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                Cerita di balik toko
              </p>
              {toko.journeyIntro && (
                <p className="text-sm text-surface-600">{toko.journeyIntro}</p>
              )}
              <ul className="mt-2 space-y-1.5">
                {toko.journey.map((step) => (
                  <li key={`${step.year}-${step.title}`} className="text-sm text-ink">
                    <span className="font-mono text-[10px] font-bold text-primary-700">{step.year}</span>
                    {' · '}
                    <span className="font-medium">{step.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                <Clock className="h-3.5 w-3.5" />
                Jam operasional
              </p>
              <ul className="mt-1 space-y-1">
                {formatOperatingHoursLines(toko.operatingHours).map((line) => (
                  <li key={line} className="text-sm text-surface-700">
                    {line}
                  </li>
                ))}
              </ul>
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
              {toko.instagram && (
                <p className="mt-1.5 flex items-center gap-2 text-sm text-surface-600">
                  <Instagram className="h-3.5 w-3.5 text-primary-600" />
                  @{toko.instagram.replace(/^@/, '')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
