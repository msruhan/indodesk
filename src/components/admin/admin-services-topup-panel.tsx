'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Eye, Plus, Search, Trash2, Zap } from '@/lib/icons'
import { topupCategories } from '@/data/mock-topup'
import { CategoryFilterDropdown } from '@/components/ui/category-filter-dropdown'
import type { AdminTopupProductDto } from '@/lib/topup-catalog-serializer'
import type { TopupCategorySlug } from '@/data/topup-types'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

type TopupFormState = {
  category: TopupCategorySlug
  name: string
  publisher: string
  logo: string
  cover: string
  accent: string
  description: string
  idLabel: string
  serverLabel: string
  idHelp: string
  isHot: boolean
  isActive: boolean
}

const emptyForm = (): TopupFormState => ({
  category: 'mobile-game',
  name: '',
  publisher: '',
  logo: '',
  cover: '',
  accent: 'from-primary-500/20 to-transparent',
  description: '',
  idLabel: 'User ID',
  serverLabel: '',
  idHelp: 'Masukkan ID akun game Anda.',
  isHot: false,
  isActive: true,
})

function toForm(row: AdminTopupProductDto): TopupFormState {
  return {
    category: row.category,
    name: row.name,
    publisher: row.publisher,
    logo: row.logo,
    cover: row.cover,
    accent: row.accent,
    description: row.description,
    idLabel: row.idLabel,
    serverLabel: row.serverLabel ?? '',
    idHelp: row.idHelp,
    isHot: row.isHot ?? false,
    isActive: row.isActive,
  }
}

export function AdminServicesTopupPanel() {
  const [items, setItems] = useState<AdminTopupProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState<TopupFormState>(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/topup/products')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat produk topup')
      setItems(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat produk topup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(
    () =>
      items.map((p) => ({
        ...p,
        categoryLabel: topupCategories.find((c) => c.slug === p.category)?.label ?? p.category,
        minPrice: 0,
      })),
    [items],
  )

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Semua Kategori', count: rows.length },
      ...topupCategories.map((c) => ({
        value: c.label,
        label: c.label,
        count: rows.filter((r) => r.category === c.slug).length,
      })),
    ],
    [rows],
  )

  const filtered = rows.filter((r) => {
    const okQ =
      !q.trim() ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.publisher.toLowerCase().includes(q.toLowerCase())
    const okC = cat === 'all' || r.categoryLabel === cat
    return okQ && okC
  })

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q, cat])

  const openCreate = () => {
    setEditingSlug(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (row: AdminTopupProductDto) => {
    setEditingSlug(row.slug)
    setForm(toForm(row))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.logo.trim() || !form.cover.trim()) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        category: form.category,
        name: form.name,
        publisher: form.publisher,
        logo: form.logo,
        cover: form.cover,
        accent: form.accent,
        description: form.description,
        idLabel: form.idLabel,
        serverLabel: form.serverLabel.trim() || null,
        idHelp: form.idHelp,
        isHot: form.isHot,
        isActive: form.isActive,
      }

      const url = editingSlug ? `/api/admin/topup/products/${editingSlug}` : '/api/admin/topup/products'
      const method = editingSlug ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan')

      setShowForm(false)
      setEditingSlug(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (slug: string) => {
    if (!confirm('Hapus produk topup ini? Denominasi ikut terhapus.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/topup/products/${slug}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const toggleActive = async (row: AdminTopupProductDto) => {
    const res = await fetch(`/api/admin/topup/products/${row.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !row.isActive }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Gagal memperbarui')
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSlug ? 'Edit Produk Topup' : 'Tambah Produk Topup'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <motion.div className="grid gap-4 md:grid-cols-2">
                <motion.div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Nama</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </motion.div>
                <motion.div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Publisher</label>
                  <Input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} required />
                </motion.div>
                <motion.div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TopupCategorySlug }))}
                    className={selectClass}
                  >
                    {topupCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </motion.div>
                <motion.div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Label ID</label>
                  <Input value={form.idLabel} onChange={(e) => setForm((f) => ({ ...f, idLabel: e.target.value }))} />
                </motion.div>
                <motion.div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">URL Logo</label>
                  <Input value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://..." required />
                </motion.div>
                <motion.div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">URL Cover</label>
                  <Input value={form.cover} onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))} placeholder="https://..." required />
                </motion.div>
                <motion.div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${selectClass} min-h-[80px] py-2`}
                    required
                  />
                </motion.div>
                <motion.div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Bantuan ID</label>
                  <Input value={form.idHelp} onChange={(e) => setForm((f) => ({ ...f, idHelp: e.target.value }))} required />
                </motion.div>
              </motion.div>
              <motion.div className="flex flex-wrap gap-4 text-sm text-surface-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isHot} onChange={(e) => setForm((f) => ({ ...f, isHot: e.target.checked }))} />
                  Popular / hot
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                  Aktif di /topup
                </label>
              </motion.div>
              <p className="text-xs text-surface-500">
                Denominasi harga diatur lewat seed awal. Produk baru tampil di katalog tanpa denom sampai ditambahkan di DB.
              </p>
              <motion.div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      )}

      <motion.div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Topup
        </Button>
        <CategoryFilterDropdown value={cat} onChange={setCat} options={categoryOptions} />
        <motion.div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk topup..." className="h-9 pl-9 text-xs" />
        </motion.div>
      </motion.div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${totalItems} produk topup`}
      </p>

      <motion.div className="space-y-2">
        {!loading &&
          paginatedItems.map((r, idx) => (
            <motion.div key={r.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <motion.div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <motion.div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50">
                  {r.logo ? (
                    <img src={r.logo} alt="" className="h-8 w-8 object-contain" />
                  ) : (
                    <Zap className="h-4 w-4 text-amber-700" />
                  )}
                </motion.div>
                <motion.div className="min-w-0 flex-1">
                  <motion.div className="mb-0.5 flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                    <Badge variant={r.isActive ? 'success' : 'default'} className="text-[8px] px-1.5 py-0">
                      {r.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {r.isHot && <Badge variant="warning" className="text-[8px] px-1 py-0">Hot</Badge>}
                  </motion.div>
                  <motion.div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                    <span>{r.publisher}</span>
                    <span>·</span>
                    <Badge variant="info" className="text-[8px] px-1 py-0">{r.categoryLabel}</Badge>
                    <span>·</span>
                    <span>{r.denominationCount} denom</span>
                    <span>·</span>
                    <span>{r.ordersToday.toLocaleString()} order/hari</span>
                  </motion.div>
                </motion.div>
                <motion.div className="flex flex-shrink-0 gap-1">
                  {r.isActive && (
                    <Link href={`/topup/${r.slug}`} target="_blank">
                      <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  )}
                  <button type="button" onClick={() => openEdit(r)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => toggleActive(r)} className="rounded-lg px-2 py-1 text-[10px] font-medium text-primary-700 hover:bg-primary-50">
                    {r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button type="button" onClick={() => remove(r.slug)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
      </motion.div>

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
        <motion.div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Tidak ada produk topup</p>
        </motion.div>
      )}
    </div>
  )
}
