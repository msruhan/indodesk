'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Eye, Plus, Search, Star, Trash2 } from '@/lib/icons'
import { AdminReset2FaButton } from '@/components/admin/admin-reset-2fa-button'
import { AdminPasswordField } from '@/components/admin/admin-password-field'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'
import type { AdminTeknisiDto } from '@/lib/admin-user-serializer'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type TeknisiFormState = {
  name: string
  email: string
  phone: string
  password: string
  specialty: string
  experience: string
  location: string
  description: string
  isVerified: boolean
}

const emptyForm = (): TeknisiFormState => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  specialty: 'Service HP, Unlock',
  experience: '',
  location: '',
  description: '',
  isVerified: false,
})

function toForm(row: AdminTeknisiDto): TeknisiFormState {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    password: '',
    specialty: row.specialty.join(', '),
    experience: row.experience ?? '',
    location: row.location ?? '',
    description: row.description ?? '',
    isVerified: row.isVerified,
  }
}

export function AdminTeknisiPanel() {
  const [items, setItems] = useState<AdminTeknisiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TeknisiFormState>(emptyForm())
  const [generatedShown, setGeneratedShown] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/teknisi')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat teknisi')
      setItems(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat teknisi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = items.filter(
    (t) =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.email.toLowerCase().includes(q.toLowerCase()),
  )

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setGeneratedShown(null)
    setShowForm(true)
  }

  const openEdit = (row: AdminTeknisiDto) => {
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
        specialty: form.specialty,
        experience: form.experience || null,
        location: form.location || null,
        description: form.description || null,
        isVerified: form.isVerified,
      }
      if (form.password) payload.password = form.password
      if (!editingId) payload.password = form.password

      const url = editingId ? `/api/admin/teknisi/${editingId}` : '/api/admin/teknisi'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan')

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
    if (!confirm('Hapus teknisi ini? Profil, toko, dan data terkait ikut terhapus.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/teknisi/${id}`, { method: 'DELETE' })
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

      {generatedShown && (
        <p className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-800">
          Teknisi berhasil dibuat. Password: <strong className="font-mono">{generatedShown}</strong> — salin sekarang.
          <Button type="button" variant="ghost" size="sm" className="ml-2 h-7" onClick={() => { setGeneratedShown(null); setShowForm(false) }}>
            Tutup
          </Button>
        </p>
      )}

      {showForm && !generatedShown && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Teknisi' : 'Tambah Teknisi'}</CardTitle>
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
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Spesialisasi (pisahkan koma)</label>
                  <Input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Pengalaman</label>
                  <Input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="8 tahun" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Lokasi</label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${selectClass} min-h-[72px] py-2`}
                  />
                </div>
              </div>
              <label className="flex flex-col gap-1 text-sm text-surface-700">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))} />
                  Tandai sebagai Verified (persetujuan admin)
                </span>
                <span className="text-xs text-surface-500">
                  Menyetujui teknisi juga mengaktifkan email agar akun bisa login.
                </span>
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
          Tambah Teknisi
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari teknisi..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{loading ? 'Memuat…' : `${totalItems} teknisi`}</p>

      <div className="space-y-2">
        {!loading &&
          paginatedItems.map((t, idx) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white">
                  {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                    <Badge variant={t.badge === 'Top Teknisi' ? 'warning' : t.badge === 'Verified' ? 'success' : 'default'} className="text-[9px] px-1.5 py-0">{t.badge}</Badge>
                  </div>
                  <p className="truncate text-[11px] text-surface-500">{t.email}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] text-surface-400">
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />{t.rating}</span>
                    <span>{t.totalKonsultasi} sesi</span>
                    <Badge variant={t.status === 'verified' ? 'success' : 'warning'} className="text-[8px] px-1 py-0">
                      {t.status === 'verified' ? 'Verified' : 'Pending'}
                    </Badge>
                    <Badge variant={t.emailVerified ? 'success' : 'warning'} className="text-[8px] px-1 py-0">
                      {t.emailVerified ? 'Email OK' : 'Email belum'}
                    </Badge>
                    {t.twoFactorEnabled && (
                      <Badge variant="warning" className="text-[8px] px-1 py-0">
                        2FA
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <AdminReset2FaButton
                    userId={t.id}
                    userName={t.name}
                    apiPath={`/api/admin/teknisi/${t.id}/reset-2fa`}
                    twoFactorEnabled={t.twoFactorEnabled}
                    hasPendingSetup={t.hasPending2faSetup}
                    onSuccess={() => void load()}
                  />
                  <Link href={`/teknisi/${t.id}`} target="_blank">
                    <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </Link>
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
    </div>
  )
}
