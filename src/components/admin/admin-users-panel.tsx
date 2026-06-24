'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Plus, Search, Trash2 } from '@/lib/icons'
import { AdminReset2FaButton } from '@/components/admin/admin-reset-2fa-button'
import { AdminPasswordField } from '@/components/admin/admin-password-field'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'
import type { AdminUserDto } from '@/lib/admin-user-serializer'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type UserFormState = {
  name: string
  email: string
  phone: string
  password: string
  isActive: boolean
  role: 'USER' | 'TEKNISI'
}

const emptyForm = (): UserFormState => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  isActive: true,
  role: 'USER',
})

function toForm(row: AdminUserDto): UserFormState {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    password: '',
    isActive: row.isActive,
    role: 'USER',
  }
}

export function AdminUsersPanel() {
  const [items, setItems] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm())
  const [generatedShown, setGeneratedShown] = useState<string | null>(null)
  const [roleChangeMessage, setRoleChangeMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat user')
      setItems(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = items.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  )

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setGeneratedShown(null)
    setShowForm(true)
  }

  const openEdit = (row: AdminUserDto) => {
    setEditingId(row.id)
    setForm(toForm(row))
    setGeneratedShown(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    if (!editingId && !form.password) return

    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        isActive: form.isActive,
      }
      if (editingId) payload.role = form.role
      if (form.password) payload.password = form.password
      if (!editingId) payload.password = form.password

      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan')

      if (json.data?.roleChanged) {
        setRoleChangeMessage(json.data.message ?? 'Akun dipindahkan ke tab Teknisi.')
        setShowForm(false)
        setEditingId(null)
        await load()
        return
      }

      if (!editingId && form.password) {
        setGeneratedShown(form.password)
      } else {
        setShowForm(false)
        setEditingId(null)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus user ini? Semua data terkait ikut terhapus.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
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

      {roleChangeMessage && (
        <p className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-800">
          {roleChangeMessage}
          <Button type="button" variant="ghost" size="sm" className="ml-2 h-7" onClick={() => setRoleChangeMessage(null)}>
            Tutup
          </Button>
        </p>
      )}

      {generatedShown && (
        <p className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-800">
          User berhasil dibuat. Password: <strong className="font-mono">{generatedShown}</strong> — salin sekarang.
          <Button type="button" variant="ghost" size="sm" className="ml-2 h-7" onClick={() => { setGeneratedShown(null); setShowForm(false) }}>
            Tutup
          </Button>
        </p>
      )}

      {showForm && !generatedShown && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit User' : 'Tambah User'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Nama</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Telepon</label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <AdminPasswordField
                  value={form.password}
                  onChange={(password) => setForm((f) => ({ ...f, password }))}
                  required={!editingId}
                  hint={editingId ? 'Isi hanya jika ingin mengganti password.' : undefined}
                />
                {editingId && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700">Role</label>
                    <select
                      className={selectClass}
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value as UserFormState['role'] }))
                      }
                    >
                      <option value="USER">User</option>
                      <option value="TEKNISI">Teknisi</option>
                    </select>
                    {form.role === 'TEKNISI' && (
                      <p className="mt-1 text-[11px] text-surface-500">
                        Akun akan dipindahkan ke tab Teknisi setelah disimpan.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Akun aktif (bisa login)
              </label>
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
          Tambah User
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari user atau email..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{loading ? 'Memuat…' : `${totalItems} user`}</p>

      <div className="space-y-2">
        {!loading &&
          paginatedItems.map((user, idx) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white">
                  {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
                    <Badge variant="default" className="text-[9px] px-1.5 py-0">User</Badge>
                  </div>
                  <p className="truncate text-[11px] text-surface-500">{user.email}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-400">
                    <span>{user.totalOrder} order</span>
                    <span>·</span>
                    <Badge variant={user.isActive ? 'success' : 'default'} className="text-[8px] px-1 py-0">
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {user.twoFactorEnabled && (
                      <Badge variant="warning" className="text-[8px] px-1 py-0">
                        2FA
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <AdminReset2FaButton
                    userId={user.id}
                    userName={user.name}
                    apiPath={`/api/admin/users/${user.id}/reset-2fa`}
                    twoFactorEnabled={user.twoFactorEnabled}
                    hasPendingSetup={user.hasPending2faSetup}
                    onSuccess={() => void load()}
                  />
                  <button type="button" onClick={() => openEdit(user)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(user.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600">
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
    </div>
  )
}
