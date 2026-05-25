'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Eye, Plus, Search, Trash2 } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  CategoryFilterDropdown,
  type CategoryFilterOption,
} from '@/components/ui/category-filter-dropdown'
import type { AdminProductDto } from '@/lib/admin-product-serializer'
import { PRODUCT_CATEGORY_OPTIONS, formatProductPrice } from '@/lib/product-catalog'
import type { ProductCategory } from '@prisma/client'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

const FILTER_CATEGORIES: CategoryFilterOption[] = [
  { value: 'all', label: 'Semua Kategori' },
  ...PRODUCT_CATEGORY_OPTIONS.map((c) => ({
    value: c.value.toLowerCase(),
    label: c.label,
  })),
]

const categoryBadge: Record<string, string> = {
  Handphone: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  Software: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  Laptop: 'bg-accent-50 text-accent-700 ring-accent-200/70',
  Aksesoris: 'bg-amber-50 text-amber-700 ring-amber-200/70',
}

type SellerOption = { id: string; name: string; email: string | null }

type ProductFormState = {
  name: string
  category: ProductCategory
  price: string
  description: string
  stock: string
  image: string
  sellerId: string
  listingStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  isPublished: boolean
  isActive: boolean
}

const emptyForm = (sellerId = ''): ProductFormState => ({
  name: '',
  category: 'HANDPHONE',
  price: '',
  description: '',
  stock: '1',
  image: '',
  sellerId,
  listingStatus: 'APPROVED',
  isPublished: true,
  isActive: true,
})

function toForm(row: AdminProductDto): ProductFormState {
  return {
    name: row.name,
    category: row.categoryValue,
    price: String(row.price),
    description: row.description ?? '',
    stock: String(row.stock),
    image: row.image ?? '',
    sellerId: row.seller.id,
    listingStatus: row.listingStatus,
    isPublished: row.isPublished,
    isActive: row.isActive,
  }
}

export function AdminServicesProdukPanel() {
  const [items, setItems] = useState<AdminProductDto[]>([])
  const [sellers, setSellers] = useState<SellerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qProd, setQProd] = useState('')
  const [catProd, setCatProd] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, sellerRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/products/sellers'),
      ])
      const prodJson = await prodRes.json()
      const sellerJson = await sellerRes.json()
      if (!prodRes.ok) throw new Error(prodJson.error ?? 'Gagal memuat produk')
      setItems(prodJson.data ?? [])
      if (sellerRes.ok) setSellers(sellerJson.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categoryOptions = useMemo(
    () =>
      FILTER_CATEGORIES.map((opt) => ({
        ...opt,
        count:
          opt.value === 'all'
            ? items.length
            : items.filter((p) => p.categorySlug === opt.value).length,
      })),
    [items],
  )

  const filteredProd = items.filter((p) => {
    const okQ =
      p.name.toLowerCase().includes(qProd.toLowerCase()) ||
      p.seller.name.toLowerCase().includes(qProd.toLowerCase())
    const okC = catProd === 'all' || p.categorySlug === catProd
    return okQ && okC
  })

  const {
    page: prodPage,
    setPage: setProdPage,
    pageSize: prodPageSize,
    setPageSize: setProdPageSize,
    paginatedItems: paginatedProd,
    totalItems: totalProd,
  } = useClientPagination(filteredProd, [qProd, catProd])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm(sellers[0]?.id ?? ''))
    setShowForm(true)
  }

  const openEdit = (row: AdminProductDto) => {
    setEditingId(row.id)
    setForm(toForm(row))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sellerId || !form.price) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        description: form.description || undefined,
        stock: Number(form.stock) || 0,
        image: form.image.trim() || undefined,
        sellerId: form.sellerId,
        listingStatus: form.listingStatus,
        isPublished: form.isPublished,
        isActive: form.isActive,
      }

      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    if (!confirm('Hapus produk ini?')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const togglePublish = async (row: AdminProductDto) => {
    const nextPublished = !row.isPublished
    const res = await fetch(`/api/admin/products/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isPublished: nextPublished,
        listingStatus: nextPublished ? 'APPROVED' : row.listingStatus,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Gagal memperbarui')
      return
    }
    await load()
  }

  return (
    <motion.div className="space-y-4" initial={false}>
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Produk' : 'Tambah Produk'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Nama produk</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Teknisi / penjual</label>
                  <select
                    value={form.sellerId}
                    onChange={(e) => setForm((f) => ({ ...f, sellerId: e.target.value }))}
                    className={selectClass}
                    required
                  >
                    <option value="">Pilih teknisi…</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ProductCategory }))}
                    className={selectClass}
                  >
                    {PRODUCT_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Harga (IDR)</label>
                  <Input type="number" min={1} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Stok</label>
                  <Input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Status listing</label>
                  <select
                    value={form.listingStatus}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        listingStatus: e.target.value as ProductFormState['listingStatus'],
                      }))
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
                  <label className="mb-1 block text-sm font-medium text-surface-700">URL gambar</label>
                  <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${selectClass} min-h-[80px] py-2`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-surface-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                  Tampil di marketplace
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                  Aktif
                </label>
              </div>
              <p className="text-xs text-surface-500">
                Produk hanya muncul di /marketplace jika status Approved, publish aktif, dan produk aktif.
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
          Tambah Produk
        </Button>
        <CategoryFilterDropdown value={catProd} onChange={setCatProd} options={categoryOptions} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={qProd} onChange={(e) => setQProd(e.target.value)} placeholder="Cari produk..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${totalProd} produk`}
      </p>

      <div className="space-y-2">
        {!loading &&
          paginatedProd.map((p, idx) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
              <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                    <Badge variant={p.status === 'approved' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0">
                      {p.listingStatus === 'APPROVED' ? 'Approved' : p.listingStatus}
                    </Badge>
                    {!p.isPublished && <Badge variant="outline" className="text-[8px]">Unpublished</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                    <span className={cn('inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset', categoryBadge[p.category] ?? categoryBadge.Handphone)}>
                      {p.category}
                    </span>
                    <span className="font-semibold text-primary-700 tabular-nums">{formatProductPrice(p.price)}</span>
                    <span>·</span>
                    <span>{p.seller.name}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{p.views.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-1">
                  {p.isPublished ? (
                    <Link href={`/marketplace/${p.id}`} target="_blank">
                      <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ) : null}
                  <button type="button" onClick={() => openEdit(p)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => togglePublish(p)} className="rounded-lg px-2 py-1 text-[10px] font-medium text-primary-700 hover:bg-primary-50">
                    {p.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => remove(p.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {!loading && totalProd > 0 && (
        <DataPagination
          page={prodPage}
          pageSize={prodPageSize}
          totalItems={totalProd}
          onPageChange={setProdPage}
          onPageSizeChange={setProdPageSize}
        />
      )}

      {!loading && filteredProd.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Tidak ada produk</p>
        </div>
      )}
    </motion.div>
  )
}
