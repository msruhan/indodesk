'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, MapPin } from '@/lib/icons'
import { ManagementToolbar } from '@/components/admin/admin-management-toolbar'
import type { AdminLowonganDto, JobTypeSlug } from '@/lib/lowongan-serializer'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type FormState = {
  title: string
  company: string
  location: string
  salary: string
  type: JobTypeSlug
  description: string
  requirements: string
  skills: string
  isActive: boolean
}

const emptyForm = (): FormState => ({
  title: '',
  company: '',
  location: '',
  salary: '',
  type: 'full-time',
  description: '',
  requirements: '',
  skills: '',
  isActive: true,
})

function toForm(row: AdminLowonganDto): FormState {
  return {
    title: row.title,
    company: row.company,
    location: row.location,
    salary: row.salary ?? '',
    type: row.type,
    description: row.description,
    requirements: row.requirements.join('\n'),
    skills: row.skills.join(', '),
    isActive: row.isActive,
  }
}

export function AdminLowonganView() {
  const [items, setItems] = useState<AdminLowonganDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/lowongan')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat data')
      setItems(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat lowongan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = items.filter(
    (l) =>
      l.title.toLowerCase().includes(q.toLowerCase()) ||
      l.company.toLowerCase().includes(q.toLowerCase()) ||
      l.location.toLowerCase().includes(q.toLowerCase()),
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (row: AdminLowonganDto) => {
    setEditingId(row.id)
    setForm(toForm(row))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        company: form.company,
        location: form.location,
        salary: form.salary || undefined,
        type: form.type,
        description: form.description,
        requirements: form.requirements,
        skills: form.skills,
        isActive: form.isActive,
      }

      const url = editingId ? `/api/admin/lowongan/${editingId}` : '/api/admin/lowongan'
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
      setForm(emptyForm())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus lowongan ini? Tindakan tidak dapat dibatalkan.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/lowongan/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const toggleActive = async (row: AdminLowonganDto) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/lowongan/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memperbarui status')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Lowongan' : 'Tambah Lowongan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Judul</label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Perusahaan</label>
                  <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Lokasi</label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Gaji</label>
                  <Input value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} placeholder="Rp 5 - 8 jt/bln" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">Tipe kerja</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as JobTypeSlug }))} className={selectClass}>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${selectClass} min-h-[100px] py-2`} required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Persyaratan (satu per baris)</label>
                  <textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} className={`${selectClass} min-h-[80px] py-2`} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-surface-700">Keahlian (pisahkan koma)</label>
                  <Input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-surface-300" />
                Lowongan aktif (tampil di halaman publik)
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ManagementToolbar addLabel="Tambah" onAddClick={openCreate} searchPlaceholder="Cari lowongan..." searchValue={q} onSearchChange={setQ} />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Lowongan ({filtered.length}){loading ? ' — memuat…' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-surface-500">Belum ada lowongan.</TableCell>
                </TableRow>
              )}
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-surface-400" />{l.location}</div></TableCell>
                  <TableCell><Badge variant="secondary">{l.typeLabel}</Badge></TableCell>
                  <TableCell>{l.applicants}</TableCell>
                  <TableCell><Badge variant={l.isActive ? 'default' : 'outline'}>{l.isActive ? 'active' : 'nonaktif'}</Badge></TableCell>
                  <TableCell>{l.postedDate}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" type="button" onClick={() => openEdit(l)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => toggleActive(l)}>{l.isActive ? 'Nonaktif' : 'Aktif'}</Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
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
