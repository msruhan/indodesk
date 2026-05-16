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
import type { MarketplaceBanner } from '@/data/mock-marketplace-banners'
import {
  BANNERS_UPDATED_EVENT,
  loadMarketplaceBanners,
  saveMarketplaceBanners,
} from '@/lib/platform-content-storage'

const emptyForm = (): Omit<MarketplaceBanner, 'id' | 'sortOrder'> => ({
  title: '',
  subtitle: '',
  image: '',
  link: '/marketplace',
  buttonText: 'Lihat',
  active: true,
})

export function AdminBannersView() {
  const [banners, setBanners] = useState<MarketplaceBanner[]>([])
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const persist = useCallback((next: MarketplaceBanner[]) => {
    setBanners(next)
    saveMarketplaceBanners(next)
  }, [])

  useEffect(() => {
    setBanners(loadMarketplaceBanners())
    const sync = () => setBanners(loadMarketplaceBanners())
    window.addEventListener(BANNERS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(BANNERS_UPDATED_EVENT, sync)
  }, [])

  const filtered = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(q.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(q.toLowerCase()),
  )

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
      link: banner.link,
      buttonText: banner.buttonText,
      active: banner.active,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.image.trim()) return

    if (editingId) {
      persist(banners.map((b) => (b.id === editingId ? { ...b, ...form, id: editingId } : b)))
    } else {
      const id = String(Date.now())
      const sortOrder = banners.length ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 1
      persist([...banners, { ...form, id, sortOrder }])
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const toggleActive = (id: string) => {
    persist(banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b)))
  }

  const remove = (id: string) => {
    persist(banners.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-surface-600">
        Kelola slide banner di halaman marketplace. Hanya banner berstatus aktif yang ditampilkan ke
        pengunjung.
      </p>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Banner' : 'Tambah Banner'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                  <label className="mb-1 block text-sm font-medium text-surface-700">Link Tujuan</label>
                  <Input
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    placeholder="/marketplace?category=handphone"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-surface-300"
                />
                Tampilkan di marketplace
              </label>
              <div className="flex gap-2">
                <Button type="submit">Simpan</Button>
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
          <CardTitle>Daftar Banner ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
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
                  <TableCell className="max-w-[140px] truncate text-sm text-surface-600">{b.link}</TableCell>
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
                      <Button size="sm" variant="outline" type="button" onClick={() => toggleActive(b.id)}>
                        {b.active ? 'Nonaktif' : 'Aktif'}
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
