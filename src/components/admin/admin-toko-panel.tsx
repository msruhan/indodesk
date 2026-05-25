'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Eye, Plus, Search, Star, Trash2, MapPin } from '@/lib/icons'
import { listingStatusLabel } from '@/lib/product-catalog'
import type { AdminTokoDto } from '@/lib/admin-store-serializer'
import type { TeknisiStoreOption } from '@/lib/admin-store-serializer'
import type { ProductListingStatus } from '@prisma/client'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type TokoFormState = {
  userId: string
  name: string
  city: string
  address: string
  phone: string
  email: string
  jamWeekdays: string
  jamWeekend: string
  layanan: string
  badge: string
  coverImage: string
  listingStatus: ProductListingStatus
  isPublished: boolean
}

const emptyForm = (): TokoFormState => ({
  userId: '',
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  jamWeekdays: '09:00 – 21:00',
  jamWeekend: '10:00 – 20:00',
  layanan: 'Service HP, Jual Beli',
  badge: '',
  coverImage: '',
  listingStatus: 'APPROVED',
  isPublished: true,
})

function toForm(row: AdminTokoDto): TokoFormState {
  return {
    userId: row.userId,
    name: row.name,
    city: row.city ?? '',
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    jamWeekdays: row.jamWeekdays ?? '',
    jamWeekend: row.jamWeekend ?? '',
    layanan: row.layanan.join(', '),
    badge: row.badge ?? '',
    coverImage: row.coverImage ?? '',
    listingStatus: row.listingStatus,
    isPublished: row.isPublished,
  }
}

function statusBadgeVariant(status: AdminTokoDto['status']) {
  if (status === 'approved') return 'success' as const
  if (status === 'pending') return 'warning' as const
  if (status === 'rejected') return 'default' as const
  return 'outline' as const
}

export function AdminTokoPanel() {
  const [items, setItems] = useState<AdminTokoDto[]>([])
  const [teknisiOptions, setTeknisiOptions] = useState<TeknisiStoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TokoFormState>(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tokoRes, optRes] = await Promise.all([
        fetch('/api/admin/toko'),
        fetch('/api/admin/toko/teknisi-options'),
      ])
      const tokoJson = await tokoRes.json()
      const optJson = await optRes.json()
      if (!tokoRes.ok) throw new Error(tokoJson.error ?? 'Gagal memuat toko')
      setItems(tokoJson.data ?? [])
      if (optRes.ok) setTeknisiOptions(optJson.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat toko')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = items.filter((t) => {
    const hay = q.toLowerCase()
    return (
      t.name.toLowerCase().includes(hay) ||
      t.ownerName.toLowerCase().includes(hay) ||
      (t.city ?? '').toLowerCase().includes(hay)
    )
  })

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (row: AdminTokoDto) => {
    setEditingId(row.id)
    setForm(toForm(row))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (!editingId && !form.userId) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        userId: form.userId,
        name: form.name,
        city: form.city || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || '',
        jamWeekdays: form.jamWeekdays || undefined,
        jamWeekend: form.jamWeekend || undefined,
        layanan: form.layanan,
        badge: form.badge || undefined,
        coverImage: form.coverImage || '',
        listingStatus: form.listingStatus,
        isPublished: form.isPublished,
      }

      const url = editingId ? `/api/admin/toko/${editingId}` : '/api/admin/toko'
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { ...payload, userId: undefined } : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan')

      setShowForm(false)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus toko ini?')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/toko/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Toko' : 'Tambah Toko'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                {!editingId && (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-surface-700">Teknisi pemilik</label>
                    <select
                      value={form.userId}
                      onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                      className={selectClass}
                      required
                    >
                      <option value="">Pilih teknisi…</option>
                      {teknisiOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                    {teknisiOptions.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">Semua teknisi sudah punya toko. Tambah teknisi baru dulu.</p>
                    )}
                  </div>
                )}
                {editingId && (
                  <div className="md:col-span-2 rounded-xl bg-surface-50 px-3 py-2 text-sm text-surface-600">
                    Pemilik: <strong>{items.find((i) => i.id === editingId)?.ownerName}</strong>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Nama toko</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Kota</label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Alamat</label>
                  <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Telepon</label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Email toko</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Jam weekdays</label>
                  <Input value={form.jamWeekdays} onChange={(e) => setForm((f) => ({ ...f, jamWeekdays: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Jam weekend</label>
                  <Input value={form.jamWeekend} onChange={(e) => setForm((f) => ({ ...f, jamWeekend: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Layanan (pisahkan koma)</label>
                  <Input value={form.layanan} onChange={(e) => setForm((f) => ({ ...f, layanan: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Badge</label>
                  <Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="Top Seller" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Status listing</label>
                  <select
                    value={form.listingStatus}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, listingStatus: e.target.value as ProductListingStatus }))
                    }
                    className={selectClass}
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="DRAFT">Draft</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">URL cover image</label>
                  <Input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Tampil di halaman publik /toko
              </label>
              <p className="text-xs text-surface-500">
                Toko publik hanya tampil jika status Approved dan publish aktif.
              </p>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Toko
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari toko..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{loading ? 'Memuat…' : `${totalItems} toko`}</p>

      <div className="space-y-2">
        {!loading &&
          paginatedItems.map((t, idx) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-200/70 bg-surface-50 text-[11px] font-bold text-primary-700">
                  {t.coverImage ? (
                    <img src={t.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    t.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                    <Badge variant={statusBadgeVariant(t.status)} className="text-[9px] px-1.5 py-0">
                      {listingStatusLabel(t.listingStatus)}
                    </Badge>
                    {!t.isPublished && <Badge variant="outline" className="text-[8px]">Unpublished</Badge>}
                  </div>
                  <p className="truncate text-[11px] text-surface-500">{t.ownerName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px] text-surface-400">
                    {t.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {t.city}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {t.rating}
                    </span>
                    <span>{t.totalPenjualan.toLocaleString()} sales</span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  {t.isPublished && t.listingStatus === 'APPROVED' && (
                    <Link href={`/toko/${t.id}`} target="_blank">
                      <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  )}
                  <button type="button" onClick={() => openEdit(t)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(t.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {!loading && totalItems > 0 && (
        <DataPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Tidak ada toko</p>
        </div>
      )}
    </div>
  )
}
