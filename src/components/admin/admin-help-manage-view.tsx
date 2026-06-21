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
import { AdminHelpSupportContactPanel } from '@/components/admin/admin-help-support-contact-panel'
import type { HelpArticleDto } from '@/lib/help-serializer'
import { DataPagination } from '@/components/ui/data-pagination'
import { useClientPagination } from '@/hooks/use-client-pagination'

const selectClass =
  'h-10 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'

type Audience = 'user' | 'teknisi' | 'admin'

type FormState = {
  audience: Audience
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}

const emptyForm = (): FormState => ({
  audience: 'user',
  question: '',
  answer: '',
  sortOrder: 0,
  isActive: true,
})

const audienceLabel: Record<Audience, string> = {
  user: 'User',
  teknisi: 'Teknisi',
  admin: 'Admin',
}

export function AdminHelpManageView() {
  const [articles, setArticles] = useState<HelpArticleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [filterAudience, setFilterAudience] = useState<Audience | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/help')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat FAQ')
        return
      }
      setArticles(json.data ?? [])
    } catch {
      setError('Gagal memuat FAQ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = articles.filter((a) => {
    const matchQ =
      a.question.toLowerCase().includes(q.toLowerCase()) ||
      a.answer.toLowerCase().includes(q.toLowerCase())
    const matchAudience = filterAudience === 'all' || a.audience === filterAudience
    return matchQ && matchAudience
  })

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalItems } =
    useClientPagination(filtered, [q, filterAudience])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (row: HelpArticleDto) => {
    setEditingId(row.id)
    setForm({
      audience: row.audience as Audience,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    })
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const url = editingId ? `/api/admin/help/${editingId}` : '/api/admin/help'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan FAQ')
        return
      }
      setShowForm(false)
      await load()
    } catch {
      setError('Gagal menyimpan FAQ')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus FAQ ini?')) return
    try {
      const res = await fetch(`/api/admin/help/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menghapus FAQ')
        return
      }
      await load()
    } catch {
      setError('Gagal menghapus FAQ')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-surface-500">
          Kelola kontak support dan pertanyaan umum untuk halaman Help user, teknisi, dan admin.
        </p>
        <Link href="/admin/help/preview" className="text-sm font-medium text-primary-600 hover:underline">
          Pratinjau halaman Help
        </Link>
      </div>

      <AdminHelpSupportContactPanel />

      <ManagementToolbar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Cari pertanyaan atau jawaban…"
        onAddClick={openCreate}
        addLabel="Tambah FAQ"
      />

      <div className="flex flex-wrap gap-2">
        {(['all', 'user', 'teknisi', 'admin'] as const).map((a) => (
          <Button
            key={a}
            size="sm"
            variant={filterAudience === a ? 'primary' : 'outline'}
            onClick={() => setFilterAudience(a)}
          >
            {a === 'all' ? 'Semua' : audienceLabel[a]}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit FAQ' : 'Tambah FAQ'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Audience</span>
                <select
                  className={selectClass}
                  value={form.audience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, audience: e.target.value as Audience }))
                  }
                >
                  <option value="user">User</option>
                  <option value="teknisi">Teknisi</option>
                  <option value="admin">Admin</option>
                </select>
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
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-ink">Pertanyaan</span>
              <Input
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-ink">Jawaban</span>
              <textarea
                className={`${selectClass} min-h-[120px] py-2`}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Aktif
            </label>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan'}
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
            <p className="p-6 text-sm text-surface-500">Memuat FAQ…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audience</TableHead>
                    <TableHead>Pertanyaan</TableHead>
                    <TableHead className="w-20">Urutan</TableHead>
                    <TableHead className="w-24 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {audienceLabel[row.audience as Audience] ?? row.audience}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-1 font-medium text-ink">{row.question}</p>
                        <p className="line-clamp-1 text-xs text-surface-500">{row.answer}</p>
                      </TableCell>
                      <TableCell>{row.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void remove(row.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
