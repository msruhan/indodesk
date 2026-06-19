'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2 } from '@/lib/icons'
import { ManagementToolbar } from '@/components/admin/admin-management-toolbar'
import {
  PRICING_ICON_OPTIONS,
  type LandingPricingMeta,
  type PricingPlanDto,
  type PricingPlanIcon,
} from '@/lib/pricing-plans'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

const textareaClass =
  'min-h-[120px] w-full rounded-xl border border-surface-200/80 bg-white px-3 py-2 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type PlanFormState = {
  name: string
  description: string
  price: string
  priceSubtext: string
  cta: string
  ctaHref: string
  highlight: boolean
  badge: string
  icon: PricingPlanIcon
  featuresText: string
  sortOrder: number
  isActive: boolean
}

const emptyMeta = (): LandingPricingMeta => ({
  badge: 'Pricing',
  title: 'Paket pricing yang',
  titleHighlight: ' transparan',
  subtitle: 'Mulai gratis dan upgrade sesuai kebutuhan. Tanpa biaya tersembunyi.',
})

const emptyPlanForm = (): PlanFormState => ({
  name: '',
  description: '',
  price: '',
  priceSubtext: '',
  cta: 'Mulai',
  ctaHref: '/register',
  highlight: false,
  badge: '',
  icon: 'sparkles',
  featuresText: '',
  sortOrder: 0,
  isActive: true,
})

function featuresToText(features: string[]) {
  return features.join('\n')
}

function textToFeatures(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function planToForm(plan: PricingPlanDto): PlanFormState {
  return {
    name: plan.name,
    description: plan.description,
    price: plan.price,
    priceSubtext: plan.priceSubtext,
    cta: plan.cta,
    ctaHref: plan.ctaHref,
    highlight: plan.highlight,
    badge: plan.badge ?? '',
    icon: plan.icon,
    featuresText: featuresToText(plan.features),
    sortOrder: plan.sortOrder,
    isActive: plan.isActive,
  }
}

export function AdminPricingView() {
  const [meta, setMeta] = useState<LandingPricingMeta>(emptyMeta())
  const [plans, setPlans] = useState<PricingPlanDto[]>([])
  const [loading, setLoading] = useState(true)
  const [savingMeta, setSavingMeta] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyPlanForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pricing')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat pricing')
        return
      }
      setMeta(json.data.meta ?? emptyMeta())
      setPlans(json.data.plans ?? [])
    } catch {
      setError('Gagal memuat pricing')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()),
  )

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q])

  const saveMeta = async () => {
    setSavingMeta(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan header section')
        return
      }
      setMeta(json.data.meta)
    } catch {
      setError('Gagal menyimpan header section')
    } finally {
      setSavingMeta(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyPlanForm())
    setShowForm(true)
  }

  const openEdit = (plan: PricingPlanDto) => {
    setEditingId(plan.id)
    setForm(planToForm(plan))
    setShowForm(true)
  }

  const savePlan = async () => {
    const features = textToFeatures(form.featuresText)
    if (!form.name.trim() || !form.price.trim() || features.length === 0) {
      setError('Nama, harga, dan minimal satu fitur wajib diisi')
      return
    }

    setSavingPlan(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        priceSubtext: form.priceSubtext,
        cta: form.cta,
        ctaHref: form.ctaHref,
        highlight: form.highlight,
        badge: form.badge.trim() || null,
        icon: form.icon,
        features,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      }

      const res = editingId
        ? await fetch(`/api/admin/pricing/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan paket')
        return
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyPlanForm())
      await load()
    } catch {
      setError('Gagal menyimpan paket')
    } finally {
      setSavingPlan(false)
    }
  }

  const toggleActive = async (plan: PricingPlanDto) => {
    try {
      const res = await fetch(`/api/admin/pricing/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })
      if (res.ok) await load()
    } catch {
      setError('Gagal memperbarui status')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus paket pricing ini?')) return
    try {
      const res = await fetch(`/api/admin/pricing/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } catch {
      setError('Gagal menghapus paket')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-surface-500">
          Atur teks section dan kartu pricing di landing page homepage.
        </p>
        <Link href="/#pricing" className="text-sm font-medium text-primary-600 hover:underline">
          Lihat di homepage
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Header Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-ink">Badge</span>
              <Input
                value={meta.badge}
                onChange={(e) => setMeta((m) => ({ ...m, badge: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink">Judul (bagian pertama)</span>
              <Input
                value={meta.title}
                onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink">Judul (highlight / gradient)</span>
              <Input
                value={meta.titleHighlight}
                onChange={(e) => setMeta((m) => ({ ...m, titleHighlight: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink">Subjudul</span>
              <textarea
                className={textareaClass}
                value={meta.subtitle}
                onChange={(e) => setMeta((m) => ({ ...m, subtitle: e.target.value }))}
              />
            </label>
          </div>
          <Button onClick={() => void saveMeta()} disabled={savingMeta}>
            {savingMeta ? 'Menyimpan…' : 'Simpan Header'}
          </Button>
        </CardContent>
      </Card>

      <ManagementToolbar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Cari paket pricing…"
        onAddClick={openCreate}
        addLabel="Tambah Paket"
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Paket Pricing' : 'Tambah Paket Pricing'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Nama paket</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Icon</span>
                <select
                  className={selectClass}
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value as PricingPlanIcon }))
                  }
                >
                  {PRICING_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-ink">Deskripsi singkat</span>
                <textarea
                  className={textareaClass}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Harga</span>
                <Input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="Gratis / Rp 49.000"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Subteks harga</span>
                <Input
                  value={form.priceSubtext}
                  onChange={(e) => setForm((f) => ({ ...f, priceSubtext: e.target.value }))}
                  placeholder="Selamanya / per bulan"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Label tombol CTA</span>
                <Input
                  value={form.cta}
                  onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Link CTA</span>
                <Input
                  value={form.ctaHref}
                  onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Badge (opsional)</span>
                <Input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="Paling populer"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Urutan</span>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                  }
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.checked }))}
              />
              <span className="font-medium text-ink">Tandai sebagai paket highlight (scale + primary)</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span className="font-medium text-ink">Aktif (tampil di homepage)</span>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-ink">Daftar fitur (satu per baris)</span>
              <textarea
                className={`${textareaClass} min-h-[180px]`}
                value={form.featuresText}
                onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
                placeholder={'Browse marketplace produk\nKonsultasi dengan teknisi\n...'}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void savePlan()} disabled={savingPlan}>
                {savingPlan ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Paket'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-surface-500">Memuat paket pricing…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Fitur</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-medium text-ink">{plan.name}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-surface-500">
                          {plan.description}
                        </div>
                        {plan.highlight && (
                          <Badge variant="primary" className="mt-1">
                            Highlight
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-ink">{plan.price}</div>
                        <div className="text-xs text-surface-500">{plan.priceSubtext}</div>
                      </TableCell>
                      <TableCell className="text-xs text-surface-600">
                        {plan.features.length} item
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => void toggleActive(plan)}
                          className="text-left"
                        >
                          <Badge variant={plan.isActive ? 'primary' : 'secondary'}>
                            {plan.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void remove(plan.id)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataPagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
