'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2 } from '@/lib/icons'
import { ManagementToolbar } from '@/components/admin/admin-management-toolbar'
import type { MarketplaceBanner } from '@/lib/marketplace-banners'
import {
  ADMIN_BANNER_PLACEMENT_OPTIONS,
  placementLabel,
  placementPath,
  type BannerPlacement,
} from '@/lib/marketplace-banners'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type BannerFormState = Omit<MarketplaceBanner, 'id' | 'sortOrder' | 'link'>

const emptyForm = (): BannerFormState => ({
  title: '',
  subtitle: '',
  image: '',
  buttonText: 'Lihat',
  active: true,
  placement: 'marketplace',
})

export function AdminBannersView() {
  const [banners, setBanners] = useState<MarketplaceBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/banners')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat banner')
        return
      }
      setBanners(json.data ?? [])
    } catch {
      setError('Gagal memuat banner')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(q.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(q.toLowerCase()),
  )

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (banner: MarketplaceBanner) => {
    setEditingId(banner.id)
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      buttonText: banner.buttonText,
      active: banner.active,
      placement: banner.placement,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.image.trim()) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        image: form.image,
        buttonText: form.buttonText,
        active: form.active,
        placement: form.placement,
      }

      const res = editingId
        ? await fetch(`/api/admin/banners/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan banner')
        return
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      await load()
    } catch {
      setError('Gagal menyimpan banner')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (banner: MarketplaceBanner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !banner.active }),
      })
      if (res.ok) await load()
    } catch {
      setError('Gagal memperbarui status')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } catch {
      setError('Gagal menghapus banner')
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-surface-600">
        Kelola slide promosi untuk halaman Marketplace (/marketplace) dan Shop (/shop). Data
        disimpan di database.
      </p>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Banner' : 'Tambah Banner'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Judul</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Promo Spesial Handphone"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Teks Tombol</label>
                  <Input
                    value={form.buttonText}
                    onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                    placeholder="Beli sekarang"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Subjudul</label>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    placeholder="Diskon hingga 30%..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">URL Gambar</label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">
                    Tampilkan di halaman
                  </label>
                  <select
                    value={form.placement}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        placement: e.target.value as BannerPlacement,
                      }))
                    }
                    className={selectClass}
                  >
                    {ADMIN_BANNER_PLACEMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.path}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-surface-500">
                    Tombol banner mengarah ke halaman yang dipilih ({placementPath(form.placement)}).
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-surface-300"
                />
                Banner aktif (tampil ke pengunjung)
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ManagementToolbar
        addLabel="Tambah Banner"
        onAddClick={openCreate}
        searchPlaceholder="Cari banner..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Banner ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-surface-500">Memuat banner…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Halaman</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="relative h-12 w-24 overflow-hidden rounded-lg bg-surface-100">
                          {b.image ? (
                            <Image src={b.image} alt={b.title} fill className="object-cover" sizes="96px" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{b.title}</div>
                        <div className="max-w-[200px] truncate text-xs text-surface-500">{b.subtitle}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{placementLabel(b.placement)}</Badge>
                        <p className="mt-0.5 text-xs text-surface-500">{placementPath(b.placement)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.active ? 'default' : 'outline'}>
                          {b.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{b.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" type="button" onClick={() => openEdit(b)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" type="button" onClick={() => void toggleActive(b)}>
                            {b.active ? 'Nonaktif' : 'Aktif'}
                          </Button>
                          <Button size="sm" variant="outline" type="button" onClick={() => void remove(b.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalItems > 0 && (
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
        </CardContent>
      </Card>
    </div>
  )
}
