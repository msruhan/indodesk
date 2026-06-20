'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ProductCategory, ProductSaleCondition } from '@prisma/client'
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
} from '@/components/dashboard'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Lock,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { PRODUCT_CATEGORY_OPTIONS, formatProductPrice } from '@/lib/product-catalog'
import {
  resolveProductListingUi,
} from '@/lib/product-listing-ui'
import type { TeknisiProductDto } from '@/lib/product-serializer'
import {
  ProductImagesEditor,
  buildProductImagesFormData,
  slotsFromProduct,
  type ProductImageSlot,
} from '@/components/teknisi/product-images-editor'
import {
  ProductSpecsFields,
  emptyProductSpecsForm,
  type ProductSpecsFormState,
} from '@/components/teknisi/product-specs-fields'
import {
  ProductBenchmarkFields,
  emptyBenchmarkForm,
  type BenchmarkFormState,
} from '@/components/teknisi/product-benchmark-fields'
import {
  categorySupportsBenchmark,
  categorySupportsThreeUtools,
} from '@/lib/product-category-config'
import { normalizeReplacedParts } from '@/lib/replaced-parts'
import {
  ProductCouponFields,
  appendCouponToFormData,
  emptyProductCouponForm,
  productCouponFormFromDto,
  type ProductCouponFormState,
} from '@/components/teknisi/product-coupon-fields'
import { validateProductCouponInput } from '@/lib/product-coupon'
import { validateProductSpecs } from '@/lib/product-specs'
import {
  categoryRequiresShippingWeight,
  MAX_PRODUCT_WEIGHT_KG,
  MIN_PRODUCT_WEIGHT_KG,
  validateProductWeightKg,
} from '@/lib/product-weight'
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/filter-dropdown'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'
import { TeknisiProductShippingSettings } from '@/components/teknisi/teknisi-product-shipping-settings'
import {
  PRODUCT_SALE_CONDITION_OPTIONS,
  newProductBenchmarkFormState,
  shouldSkipUsedProductBenchmarkInput,
} from '@/lib/product-sale-condition'

const categoryTone: Record<string, string> = {
  iPhone: 'border-primary-200/50 bg-primary-50/80 text-primary-800',
  Android: 'border-primary-200/50 bg-primary-50/80 text-primary-800',
  iPad: 'border-blue-200/50 bg-blue-50/80 text-blue-800',
  Macbook: 'border-surface-200/70 bg-surface-100 text-surface-700',
  Laptop: 'border-surface-200/70 bg-surface-100 text-surface-700',
  PC: 'border-surface-200/70 bg-surface-100 text-surface-700',
  Software: 'border-accent-200/50 bg-accent-50/80 text-accent-800',
  Aksesoris: 'border-amber-200/50 bg-amber-50/80 text-amber-800',
  Lainnya: 'border-surface-200/70 bg-surface-50 text-surface-700',
}

import { MapPin } from '@/lib/icons'

const emptyForm = {
  name: '',
  category: 'IPHONE' as ProductCategory,
  price: '',
  description: '',
  stock: '1',
  weightKg: '0.5',
  saleCondition: 'USED' as ProductSaleCondition,
}

type CategoryFilter = 'all' | ProductCategory
type PageTab = 'products' | 'shipping'

const PAGE_TABS: Array<{ id: PageTab; label: string; icon: typeof Package }> = [
  { id: 'products', label: 'Daftar Produk', icon: Package },
  { id: 'shipping', label: 'Pengiriman', icon: MapPin },
]

export default function TeknisiProdukPage() {
  const confirmDialog = useConfirm()
  const [products, setProducts] = useState<TeknisiProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [specs, setSpecs] = useState<ProductSpecsFormState>(emptyProductSpecsForm)
  const [benchmark, setBenchmark] = useState<BenchmarkFormState>(emptyBenchmarkForm)
  const [imageSlots, setImageSlots] = useState<ProductImageSlot[]>([])
  const [threeUtoolsSlots, setThreeUtoolsSlots] = useState<ProductImageSlot[]>([])
  const [coupon, setCoupon] = useState<ProductCouponFormState>(emptyProductCouponForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [pageTab, setPageTab] = useState<PageTab>('products')
  const formPanelRef = useRef<HTMLDivElement>(null)

  const scrollToForm = useCallback(() => {
    requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

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

  const categoryFilterOptions = useMemo((): FilterDropdownOption<CategoryFilter>[] => {
    const countFor = (category?: ProductCategory) =>
      category ? products.filter((p) => p.categoryValue === category).length : products.length

    return [
      { id: 'all', label: 'Semua kategori', tone: 'neutral', icon: Package },
      ...PRODUCT_CATEGORY_OPTIONS.map((c) => ({
        id: c.value as CategoryFilter,
        label: c.label,
        tone: 'primary' as const,
        icon: Package,
        count: countFor(c.value),
      })),
    ]
  }, [products])

  const filteredProduk = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.categoryValue !== categoryFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    })
  }, [products, searchQuery, categoryFilter])

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filteredProduk, [searchQuery, categoryFilter])

  const approvedCount = products.filter((p) => p.status === 'approved').length
  const pendingCount = products.filter((p) => p.status === 'pending').length
  const publishedCount = products.filter((p) => p.isPublished).length
  const draftCount = products.filter((p) => p.status === 'approved' && !p.isPublished).length
  const isNewProductForm = shouldSkipUsedProductBenchmarkInput(form.saleCondition, form.category)

  const handleSaleConditionChange = (saleCondition: ProductSaleCondition) => {
    setForm((current) => ({ ...current, saleCondition }))
    if (saleCondition === 'NEW') {
      setBenchmark(newProductBenchmarkFormState())
      setThreeUtoolsSlots([])
      return
    }
    setBenchmark(emptyBenchmarkForm)
  }

  const resetForm = () => {
    setForm(emptyForm)
    setSpecs(emptyProductSpecsForm)
    setBenchmark(emptyBenchmarkForm)
    setImageSlots([])
    setThreeUtoolsSlots([])
    setCoupon(emptyProductCouponForm)
    setEditingId(null)
    setFormError(null)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
    scrollToForm()
  }

  const openEdit = (p: TeknisiProductDto) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category: p.categoryValue,
      price: String(p.price),
      description: p.description ?? '',
      stock: String(p.stock),
      weightKg: String(p.weightKg),
      saleCondition: p.saleCondition,
    })
    setSpecs({
      color: p.color,
      ram: p.ram,
      processor: p.processor,
      storage: p.storage,
      warranty: p.warranty,
      completeness: p.completeness,
    })
    setBenchmark({
      conditionGrade: p.conditionGrade,
      conditionPercent: p.conditionPercent != null ? String(p.conditionPercent) : '',
      minusNotes: p.minusNotes ?? '',
      batteryHealth: p.batteryHealth != null ? String(p.batteryHealth) : '',
      batteryCycle: p.batteryCycle != null ? String(p.batteryCycle) : '',
      isAllOriginal: p.isAllOriginal,
      replacedParts: normalizeReplacedParts(p.replacedParts),
      trueToneActive: p.trueToneActive,
      faceIdWorks: p.faceIdWorks,
    })
    setImageSlots(slotsFromProduct(p.images))
    setThreeUtoolsSlots(slotsFromProduct(p.threeUtoolsImages ?? []))
    setCoupon(productCouponFormFromDto(p.coupon))
    setFormError(null)
    setShowForm(true)
    scrollToForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const specsError = validateProductSpecs({ ...specs, category: form.category })
    if (specsError) {
      setFormError(specsError)
      setSaving(false)
      return
    }

    const couponError = validateProductCouponInput(coupon, Number(form.price))
    if (couponError) {
      setFormError(couponError)
      setSaving(false)
      return
    }

    const weightError = validateProductWeightKg(
      Number(form.weightKg),
      form.category,
    )
    if (weightError) {
      setFormError(weightError)
      setSaving(false)
      return
    }

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('category', form.category)
    fd.append('price', form.price)
    fd.append('description', form.description.trim())
    fd.append('stock', form.stock)
    if (categoryRequiresShippingWeight(form.category)) {
      fd.append('weightKg', form.weightKg)
    }
    if (categorySupportsBenchmark(form.category)) {
      fd.append('saleCondition', form.saleCondition)
    }
    fd.append('color', specs.color.trim())
    fd.append('ram', specs.ram.trim())
    fd.append('processor', specs.processor.trim())
    fd.append('storage', specs.storage.trim())
    fd.append('warranty', specs.warranty)
    fd.append('completeness', JSON.stringify(specs.completeness))

    const isNewProduct = shouldSkipUsedProductBenchmarkInput(
      form.saleCondition,
      form.category,
    )

    if (!isNewProduct) {
      if (benchmark.conditionGrade) fd.append('conditionGrade', benchmark.conditionGrade)
      if (benchmark.conditionPercent) fd.append('conditionPercent', benchmark.conditionPercent)
      if (benchmark.minusNotes.trim()) fd.append('minusNotes', benchmark.minusNotes.trim())
      if (benchmark.batteryHealth) fd.append('batteryHealth', benchmark.batteryHealth)
      if (benchmark.batteryCycle) fd.append('batteryCycle', benchmark.batteryCycle)
      if (benchmark.isAllOriginal !== null) {
        fd.append('isAllOriginal', String(benchmark.isAllOriginal))
      }
      if (benchmark.replacedParts.length > 0) {
        fd.append('replacedParts', benchmark.replacedParts.join(','))
      }
      if (benchmark.trueToneActive !== null) {
        fd.append('trueToneActive', String(benchmark.trueToneActive))
      }
      if (benchmark.faceIdWorks !== null) fd.append('faceIdWorks', String(benchmark.faceIdWorks))
      buildProductImagesFormData(threeUtoolsSlots, fd, '3utools_')
    }

    buildProductImagesFormData(imageSlots, fd)
    appendCouponToFormData(fd, coupon)

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
    const confirmed = await confirmDialog({
      title: 'Hapus Produk',
      description: `Hapus produk "${p.name}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
    })
    if (!confirmed) return
    setActionId(p.id)
    try {
      const res = await fetch(`/api/teknisi/products/${p.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        void confirmDialog({
          title: 'Gagal Menghapus',
          description: data.error || 'Gagal menghapus produk. Silakan coba lagi.',
          variant: 'warning',
          confirmLabel: 'OK',
          hideCancel: true,
        })
        return
      }
      await loadProducts()
    } catch {
      void confirmDialog({
        title: 'Error',
        description: 'Gagal menghapus produk. Periksa koneksi internet Anda.',
        variant: 'warning',
        confirmLabel: 'OK',
        hideCancel: true,
      })
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
        description="Kelola produk dan software yang Anda jual di marketplace Bantoo."
        actions={
          pageTab === 'products' ? (
          <Button
            variant="primary"
            size="sm"
            className="h-8 gap-1 self-start px-3 text-[11px]"
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                resetForm()
              } else {
                openCreate()
              }
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? 'Tutup Form' : 'Tambah Produk'}
          </Button>
          ) : undefined
        }
        meta={
          pageTab === 'products' ? (
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
          ) : undefined
        }
      />

      <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
          {PAGE_TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setPageTab(t.id)
                  if (t.id === 'shipping') {
                    setShowForm(false)
                    resetForm()
                  }
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  pageTab === t.id
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-surface-600 hover:text-primary-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {pageTab === 'shipping' ? (
        <TeknisiProductShippingSettings />
      ) : (
        <>
      {showForm && (
        <div ref={formPanelRef} className="scroll-mt-24">
        <DashboardPanel
          title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
          description={
            editingId
              ? 'Setiap perubahan konten (nama, harga, foto, spesifikasi, stok, deskripsi) dikirim ulang ke review admin. Iklan disembunyikan sampai disetujui.'
              : 'Lengkapi detail produk. Setelah disimpan, admin akan mereview sebelum produk bisa dipublikasikan.'
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
                  onChange={(e) => {
                    const nextCategory = e.target.value as ProductCategory
                    setForm((f) => ({ ...f, category: nextCategory }))
                    setSpecs({
                      ...emptyProductSpecsForm,
                      warranty: specs.warranty,
                    })
                    setBenchmark(emptyBenchmarkForm)
                    setThreeUtoolsSlots([])
                  }}
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
              {categoryRequiresShippingWeight(form.category) && (
                <div
                  className={cn(
                    'grid gap-3',
                    categorySupportsBenchmark(form.category) ? 'sm:col-span-2 sm:grid-cols-2' : '',
                  )}
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700">
                      Berat produk (kg)
                    </label>
                    <Input
                      required
                      type="number"
                      min={MIN_PRODUCT_WEIGHT_KG}
                      max={MAX_PRODUCT_WEIGHT_KG}
                      step={0.01}
                      value={form.weightKg}
                      onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                      placeholder="0.5"
                    />
                    <p className="mt-1 text-[11px] text-surface-500">
                      Dipakai untuk hitung ongkir. Contoh: HP ~0,2 kg, laptop ~2 kg.
                    </p>
                  </div>
                  {categorySupportsBenchmark(form.category) && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-surface-700">
                        Kondisi
                      </label>
                      <select
                        value={form.saleCondition}
                        onChange={(e) =>
                          handleSaleConditionChange(e.target.value as ProductSaleCondition)
                        }
                        className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                      >
                        {PRODUCT_SALE_CONDITION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {isNewProductForm && (
                        <p className="mt-1 text-[11px] text-primary-700">
                          Produk baru — benchmark otomatis sempurna, tanpa upload 3uTools.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <ProductCouponFields
                value={coupon}
                onChange={setCoupon}
                productPrice={Number(form.price) || undefined}
              />

              <ProductImagesEditor slots={imageSlots} onChange={setImageSlots} />

              {categorySupportsThreeUtools(form.category) && !isNewProductForm && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-surface-700">
                      Screenshot / Foto 3uTools <span className="text-surface-400">(opsional)</span>
                    </p>
                    <p className="text-[11px] text-surface-500">
                      Upload screenshot dari 3uTools untuk membuktikan kualitas hardware iPhone/iPad (baterai, True Tone, Face ID, dll).
                    </p>
                  </div>
                  <ProductImagesEditor
                    slots={threeUtoolsSlots}
                    onChange={setThreeUtoolsSlots}
                    showTitle={false}
                  />
                </div>
              )}

              <ProductSpecsFields category={form.category} value={specs} onChange={setSpecs} />
              {!isNewProductForm && (
                <ProductBenchmarkFields
                  category={form.category}
                  value={benchmark}
                  onChange={setBenchmark}
                />
              )}
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
              <Button type="submit" variant="primary" disabled={saving}>
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
        </div>
      )}

      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          title="Iklan Publish"
          value={String(publishedCount)}
          footnote={publishedCount > 0 ? 'Tampil di marketplace' : 'Belum ada yang publik'}
          icon={CheckCircle}
          tone="primary"
          compact
        />
        <MetricCard
          title="Disembunyikan"
          value={String(draftCount)}
          footnote={draftCount > 0 ? 'Disembunyikan sementara' : 'Semua iklan aktif tampil'}
          icon={Package}
          tone="neutral"
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
        resultLabel={`${totalItems} produk`}
        filters={
          <FilterDropdown
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            ariaLabel="Filter kategori produk"
            label="Kategori"
            triggerIcon={Package}
            placeholder="Semua kategori"
            className="w-full sm:w-[11.5rem]"
            align="right"
            disabled={loading}
          />
        }
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-surface-500">Memuat produk...</p>
      ) : filteredProduk.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Produk tidak ditemukan"
          description={
            categoryFilter !== 'all' || searchQuery.trim()
              ? 'Coba ubah filter kategori atau kata kunci pencarian.'
              : 'Belum ada iklan produk. Tambah produk pertama Anda.'
          }
          action={
            categoryFilter !== 'all' || searchQuery.trim() ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                }}
              >
                Reset filter
              </Button>
            ) : (
              <Button variant="primary" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {paginatedItems.map((p, index) => {
            const listing = resolveProductListingUi(p)
            return (
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
                      <Badge variant={listing.reviewBadge.variant} className="text-[9px]">
                        {listing.reviewBadge.label}
                      </Badge>
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2 py-0 text-[9px] font-medium',
                            categoryTone[p.category] ?? categoryTone.iPhone,
                          )}
                        >
                          {p.category}
                        </Badge>
                        {p.coupon && (
                          <Badge variant="primary" className="rounded-full px-2 py-0 text-[9px]">
                            Kupon {p.coupon.code}
                          </Badge>
                        )}
                      </div>
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">{p.name}</h3>
                      <p className="mt-0.5 text-[14px] font-bold text-primary-700">
                        {formatProductPrice(p.price)}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-surface-500">
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {p.views.toLocaleString('id-ID')} dilihat
                        </span>
                        <span className="text-surface-300">·</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 font-medium',
                            p.stock <= 0 ? 'text-rose-600' : 'text-surface-600',
                          )}
                        >
                          <Package className="h-3 w-3" />
                          Stok {p.stock.toLocaleString('id-ID')}
                        </span>
                        {p.sold > 0 && (
                          <>
                            <span className="text-surface-300">·</span>
                            <span>{p.sold.toLocaleString('id-ID')} terjual</span>
                          </>
                        )}
                        <span className="text-surface-300">·</span>
                        <span>{p.createdAt}</span>
                      </p>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <p
                        className={cn(
                          'text-[10px] font-medium',
                          listing.visibilityTone === 'primary' && 'text-primary-700',
                          listing.visibilityTone === 'warning' && 'text-amber-700',
                          listing.visibilityTone === 'danger' && 'text-rose-700',
                          listing.visibilityTone === 'neutral' && 'text-surface-500',
                        )}
                      >
                        {listing.visibilityLabel}
                      </p>
                      <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant={listing.action === 'publish' ? 'primary' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-7 flex-1 gap-1 px-2 text-[10px]',
                          listing.action === 'unpublish' &&
                            'border-surface-300 text-surface-700 hover:bg-surface-50',
                        )}
                        disabled={actionId === p.id || listing.actionDisabled}
                        title={listing.actionHint}
                        onClick={() => {
                          if (listing.action === 'edit_resubmit') {
                            openEdit(p)
                            return
                          }
                          if (listing.action === 'publish' || listing.action === 'unpublish') {
                            void handleTogglePublish(p)
                          }
                        }}
                      >
                        {listing.action === 'publish' && <Globe className="h-3 w-3" />}
                        {listing.action === 'unpublish' && <Lock className="h-3 w-3" />}
                        {listing.action === 'wait' && <Clock className="h-3 w-3" />}
                        {listing.action === 'edit_resubmit' && <Edit className="h-3 w-3" />}
                        {listing.actionLabel}
                      </Button>
                      {listing.showMarketplaceLink && (
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
                        className={cn(
                          'h-7 gap-1 px-2 text-[10px]',
                          editingId === p.id && 'border-primary-400 bg-primary-50 text-primary-800',
                        )}
                        aria-pressed={editingId === p.id}
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )
          })}
        </div>
      )}

      {!loading && totalItems > 0 && (
        <DataPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="mt-4"
        />
      )}
        </>
      )}
    </motion.div>
  )
}
