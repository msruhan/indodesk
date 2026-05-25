'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Trash2 } from '@/lib/icons'
import { ManagementToolbar } from '@/components/admin/admin-management-toolbar'
import type {
  NotificationAudience,
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import {
  NOTIFICATIONS_KEY,
  loadPlatformNotifications,
} from '@/lib/platform-content-storage'
import { formatNotificationTimeLabel } from '@/lib/notification-display'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'
import { cn } from '@/lib/utils'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

type AudienceFilter = 'all' | NotificationAudience

const audienceLabels: Record<NotificationAudience, string> = {
  USER: 'User',
  TEKNISI: 'Teknisi',
  ADMIN: 'Admin',
}

const emptyForm = (): Omit<PlatformNotification, 'id' | 'createdAt'> => ({
  title: '',
  body: '',
  audiences: ['USER'],
  tone: 'primary',
  icon: 'bell',
  active: true,
})

export function AdminNotificationsView() {
  const [items, setItems] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      const json = (await res.json()) as { success?: boolean; data?: PlatformNotification[] }
      if (res.ok && json.success && Array.isArray(json.data)) {
        setItems(sortNotificationsNewestFirst(json.data))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const migrateLocalStorageOnce = useCallback(async () => {
    if (typeof window === 'undefined') return
    const local = loadPlatformNotifications()
    if (local.length === 0) return

    const res = await fetch('/api/admin/notifications')
    const json = (await res.json()) as { success?: boolean; data?: PlatformNotification[] }
    if (!res.ok || !json.success || !Array.isArray(json.data)) return

    const existingTitles = new Set(json.data.map((n) => n.title.trim().toLowerCase()))
    let migrated = false

    for (const n of local) {
      if (existingTitles.has(n.title.trim().toLowerCase())) continue
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: n.title,
          body: n.body,
          audiences: n.audiences,
          tone: n.tone,
          icon: n.icon,
          active: n.active,
        }),
      })
      migrated = true
    }

    if (migrated) localStorage.removeItem(NOTIFICATIONS_KEY)
  }, [])

  useEffect(() => {
    void (async () => {
      await migrateLocalStorageOnce()
      await fetchItems()
    })()
  }, [fetchItems, migrateLocalStorageOnce])

  const filtered = items.filter((n) => {
    const matchQ =
      n.title.toLowerCase().includes(q.toLowerCase()) ||
      n.body.toLowerCase().includes(q.toLowerCase())
    const matchAudience =
      audienceFilter === 'all' || n.audiences.includes(audienceFilter)
    return matchQ && matchAudience
  })

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q, audienceFilter])

  const toggleAudience = (audience: NotificationAudience) => {
    setForm((f) => ({
      ...f,
      audiences: f.audiences.includes(audience)
        ? f.audiences.filter((a) => a !== audience)
        : [...f.audiences, audience],
    }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (item: PlatformNotification) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      body: item.body,
      audiences: [...item.audiences],
      tone: item.tone,
      icon: item.icon,
      active: item.active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim() || form.audiences.length === 0) return

    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/notifications/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) return
      } else {
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) return
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      await fetchItems()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: PlatformNotification) => {
    const res = await fetch(`/api/admin/notifications/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active }),
    })
    if (res.ok) await fetchItems()
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
    if (res.ok) await fetchItems()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-surface-600">
        Atur notifikasi yang muncul di ikon lonceng header untuk user, teknisi, dan admin. Data
        disimpan di server sehingga semua peran melihat notifikasi yang sama sesuai penerima yang
        dipilih. Notifikasi terbaru selalu tampil paling atas.
      </p>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Notifikasi' : 'Tambah Notifikasi'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Judul</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Pesanan dikirim"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Isi Pesan</label>
                  <Input
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Deskripsi singkat notifikasi..."
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Tone</label>
                  <select
                    value={form.tone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tone: e.target.value as NotificationTone }))
                    }
                    className="h-10 w-full rounded-lg border border-surface-200 px-3 text-sm"
                  >
                    <option value="primary">Primary</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Ikon</label>
                  <select
                    value={form.icon}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, icon: e.target.value as NotificationIconKey }))
                    }
                    className="h-10 w-full rounded-lg border border-surface-200 px-3 text-sm"
                  >
                    <option value="bell">Lonceng</option>
                    <option value="message">Chat</option>
                    <option value="shield">Escrow</option>
                    <option value="check">Selesai</option>
                    <option value="package">Pesanan</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-surface-700">Penerima</span>
                <div className="flex flex-wrap gap-2">
                  {(['USER', 'TEKNISI', 'ADMIN'] as NotificationAudience[]).map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => toggleAudience(aud)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        form.audiences.includes(aud)
                          ? 'border-primary-500 bg-primary-50 text-primary-800'
                          : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300',
                      )}
                    >
                      {audienceLabels[aud]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-surface-300"
                />
                Aktif (tampil di popup lonceng)
              </label>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as AudienceFilter)}>
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-surface-100/80 p-1">
          <TabsTrigger value="all" className="shrink-0 px-3 sm:px-4">
            Semua
          </TabsTrigger>
          <TabsTrigger value="USER" className="shrink-0 px-3 sm:px-4">
            User
          </TabsTrigger>
          <TabsTrigger value="TEKNISI" className="shrink-0 px-3 sm:px-4">
            Teknisi
          </TabsTrigger>
          <TabsTrigger value="ADMIN" className="shrink-0 px-3 sm:px-4">
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value={audienceFilter} className="mt-4 space-y-4">
          <ManagementToolbar
            addLabel="Tambah"
            onAddClick={openCreate}
            searchPlaceholder="Cari notifikasi..."
            searchValue={q}
            onSearchChange={setQ}
          />

          <Card>
            <CardHeader>
              <CardTitle>Daftar Notifikasi ({totalItems})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <p className="py-8 text-center text-sm text-surface-500">Memuat…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Penerima</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell>
                          <div className="font-medium">{n.title}</div>
                          <div className="max-w-xs truncate text-xs text-surface-500">{n.body}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {n.audiences.map((a) => (
                              <Badge key={a} variant="secondary" className="text-[10px]">
                                {audienceLabels[a]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-surface-600">
                          {formatNotificationTimeLabel(n.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={n.active ? 'default' : 'outline'}>
                            {n.active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant="outline" type="button" onClick={() => openEdit(n)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => void toggleActive(n)}
                            >
                              {n.active ? 'Nonaktif' : 'Aktif'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => void remove(n.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}