'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ProductCategory } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DashboardPageHeader,
  DashboardPanel,
  DataToolbar,
  EmptyState,
  MetricCard,
  StatusBadge,
} from '@/components/dashboard'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  ShoppingCart,
  ExternalLink,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORY_OPTIONS, formatProductPrice } from '@/lib/product-catalog'
import type { TeknisiProductDto } from '@/lib/product-serializer'

const categoryTone: Record<string, string> = {
  Handphone: 'border-primary-200/50 bg-primary-50/80 text-primary-800',
  Software: 'border-accent-200/50 bg-accent-50/80 text-accent-800',
  Laptop: 'border-surface-200/70 bg-surface-100 text-surface-700',
  Aksesoris: 'border-amber-200/50 bg-amber-50/80 text-amber-800',
}

const emptyForm = {
  name: '',
  category: 'HANDPHONE' as ProductCategory,
  price: '',
  description: '',
  stock: '1',
}

export default function TeknisiProdukPage() {
  const [products, setProducts] = useState<TeknisiProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/teknisi/products')
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch {
      setFormError('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const filteredProduk = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery],
  )

  const totalViews = products.reduce((sum, p) => sum + p.views, 0)
  const totalSold = products.reduce((sum, p) => sum + p.sold, 0)
  const approvedCount = products.filter((p) => p.status === 'approved').length
  const pendingCount = products.filter((p) => p.status === 'pending').length
  const publishedCount = products.filter((p) => p.isPublished).length

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
    setEditingId(null)
    setFormError(null)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (p: TeknisiProductDto) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category: p.categoryValue,
      price: String(p.price),
      description: p.description ?? '',
      stock: String(p.stock),
    })
    setImageFile(null)
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('category', form.category)
    fd.append('price', form.price)
    fd.append('description', form.description.trim())
    fd.append('stock', form.stock)
    if (imageFile) fd.append('image', imageFile)

    try {
      const url = editingId ? `/api/teknisi/products/${editingId}` : '/api/teknisi/products'
      const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setFormError(data.error || 'Gagal menyimpan produk')
        return
      }
      setShowForm(false)
      resetForm()
      await loadProducts()
    } catch {
      setFormError('Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (p: TeknisiProductDto) => {
    setActionId(p.id)
    try {
      const res = await fetch(`/api/teknisi/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ togglePublish: true }),
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal mengubah status publikasi')
        return
      }
      await loadProducts()
    } catch {
      alert('Gagal mengubah status publikasi')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (p: TeknisiProductDto) => {
    if (!confirm(`Hapus produk "${p.name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setActionId(p.id)
    try {
      const res = await fetch(`/api/teknisi/products/${p.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal menghapus produk')
        return
      }
      await loadProducts()
    } catch {
      alert('Gagal menghapus produk')
    } finally {
      setActionId(null)
    }
  }

  return (
    <motion.div
      className="space-y-6 pb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <DashboardPageHeader
        title="Iklan Produk"
        description="Kelola produk dan software yang Anda jual di marketplace IndoTeknizi."
        actions={
          <Button
            variant="primary"
            size="sm"
            className="h-8 gap-1 self-start px-3 text-[11px]"
            onClick={() => (showForm ? (setShowForm(false), resetForm()) : openCreate())}
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? 'Tutup Form' : 'Tambah Produk'}
          </Button>
        }
        meta={
          <motion.div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-primary-50 px-2.5 py-1 font-medium text-primary-800">
              <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
              {publishedCount} publik
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount} menunggu review
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-primary-600" />
              {approvedCount} disetujui
            </span>
          </motion.div>
        }
      />

      {showForm && (
        <DashboardPanel
          title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
          description={
            editingId
              ? 'Perbarui detail produk. Perubahan langsung tersimpan ke database.'
              : 'Lengkapi detail produk. Setelah disimpan, Anda bisa mempublikasikan ke marketplace.'
          }
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {formError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Nama Produk</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: iPhone 13 Pro Max"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as ProductCategory }))
                  }
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                >
                  {PRODUCT_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Harga (Rp)</label>
                <Input
                  required
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="8500000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Stok</label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-surface-700">Foto Produk</label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
              <textarea
                className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi lengkap produk..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </DashboardPanel>
      )}

      <motion.div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Total Iklan"
          value={String(products.length)}
          footnote={`${filteredProduk.length} ditampilkan`}
          icon={Package}
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Terjual"
          value={totalSold.toLocaleString('id-ID')}
          footnote="Semua waktu"
          icon={ShoppingCart}
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Dilihat"
          value={totalViews.toLocaleString('id-ID')}
          footnote="Semua waktu"
          icon={Eye}
          tone="primary"
          compact
        />
        <MetricCard
          title="Menunggu Review"
          value={String(pendingCount)}
          footnote={pendingCount > 0 ? 'Perlu persetujuan admin' : 'Tidak ada antrian'}
          icon={Clock}
          tone={pendingCount > 0 ? 'warning' : 'neutral'}
          compact
        />
      </motion.div>

      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari produk..."
        resultLabel={`${filteredProduk.length} produk`}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-surface-500">Memuat produk...</p>
      ) : filteredProduk.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Produk tidak ditemukan"
          description="Coba kata kunci lain atau tambah iklan produk baru."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredProduk.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="overflow-hidden transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft-md">
                <CardContent className="flex items-stretch gap-3 p-3">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100 sm:h-28 sm:w-28">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-surface-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-1.5 top-1.5">
                      <StatusBadge
                        status={
                          p.status === 'approved'
                            ? p.isPublished
                              ? 'approved'
                              : 'draft'
                            : p.status
                        }
                      />
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2 py-0 text-[9px] font-medium',
                            categoryTone[p.category] ?? categoryTone.Handphone,
                          )}
                        >
                          {p.category}
                        </Badge>
                      </div>
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">{p.name}</h3>
                      <p className="mt-0.5 text-[14px] font-bold text-primary-700">
                        {formatProductPrice(p.price)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-500">
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {p.views.toLocaleString('id-ID')}
                        </span>
                        <span>·</span>
                        <span>{p.createdAt}</span>
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-7 flex-1 gap-1 px-2 text-[10px]',
                          p.isPublished && 'border-primary-300 bg-primary-50 text-primary-800',
                        )}
                        disabled={actionId === p.id || p.status === 'pending' || p.status === 'rejected'}
                        onClick={() => void handleTogglePublish(p)}
                        title={
                          p.status === 'pending'
                            ? 'Menunggu review admin'
                            : p.isPublished
                              ? 'Klik untuk jadikan draft'
                              : 'Klik untuk publikasikan'
                        }
                      >
                        <ArrowRight className="h-3 w-3" />
                        {p.isPublished ? 'Publik' : 'Draft'}
                      </Button>
                      {p.isPublished && (
                        <Link href={`/marketplace/${p.id}`} target="_blank">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            aria-label="Lihat di marketplace"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[10px]"
                        onClick={() => openEdit(p)}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                        disabled={actionId === p.id}
                        onClick={() => void handleDelete(p)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
