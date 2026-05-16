'use client'

import { useState } from 'react'
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
} from '@/lib/icons'
const toko = {
  id: '1',
  name: 'HandPhone Center Jakarta',
  location: 'Jl. Thamrin No. 123, Jakarta',
  city: 'Jakarta',
  rating: 4.8,
  reviewCount: 456,
  totalPenjualan: 2341,
  profileViews: 1284,
  status: 'approved' as const,
  badge: 'Top Seller',
  phone: '0812-3456-7890',
  email: 'info@handphonecenter.id',
  jamWeekdays: '09:00 – 21:00',
  jamWeekend: '10:00 – 20:00',
  coverImage:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
  layanan: ['Service HP', 'Jual Beli', 'Unlock', 'Flashing'],
}

const hasToko = true

export default function TeknisiTokoPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  if (!hasToko && !showAddForm) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          eyebrow="Toko & mitra"
          title="Toko HP"
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

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <DashboardPageHeader
        title="Toko HP"
        description="Kelola informasi toko handphone Anda agar mudah ditemukan pelanggan."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/toko/${toko.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Lihat publik
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowEditForm((open) => !open)}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit toko
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <StatusBadge status="approved" />
            {toko.badge && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {toko.badge}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
              Tampil di marketplace
            </span>
          </div>
        }
      />

      {showEditForm && (
        <DashboardPanel
          title="Edit Toko"
          description="Perbarui profil, foto, layanan, jam operasional, dan kontak toko Anda."
        >
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Nama Toko</label>
                <Input defaultValue={toko.name} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Kota</label>
                <Input defaultValue={toko.city} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-surface-700">Alamat Lengkap</label>
                <Input defaultValue={toko.location} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Telepon</label>
                <Input defaultValue={toko.phone} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
                <Input type="email" defaultValue={toko.email} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Jam Sen–Jum</label>
                <Input defaultValue={toko.jamWeekdays} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Jam Sab–Min</label>
                <Input defaultValue={toko.jamWeekend} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-surface-700">Foto cover</label>
                <Input type="file" accept="image/*" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Simpan perubahan</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        </DashboardPanel>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard
          title="Rating"
          value={toko.rating.toFixed(1)}
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
          <img src={toko.coverImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white backdrop-blur-md sm:h-14 sm:w-14">
                <Store className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0 text-white">
                <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{toko.name}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/85 sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{toko.location}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {toko.layanan.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="rounded-full border border-primary-200/50 bg-primary-50/80 px-3 py-1 text-xs font-medium text-primary-800"
              >
                {item}
              </Badge>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                <Clock className="h-3.5 w-3.5" />
                Jam operasional
              </p>
              <p className="text-sm font-medium text-ink">Sen–Jum: {toko.jamWeekdays}</p>
              <p className="mt-1 text-sm text-surface-600">Sab–Min: {toko.jamWeekend}</p>
            </div>
            <div className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-3.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                Kontak
              </p>
              <p className="flex items-center gap-2 text-sm text-ink">
                <Phone className="h-3.5 w-3.5 text-primary-600" />
                {toko.phone}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-surface-600">
                <Mail className="h-3.5 w-3.5 text-primary-600" />
                {toko.email}
              </p>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  )
}
