'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Edit, Trash2, FolderKanban, X } from '@/lib/icons'

interface ServiceGroup {
  id: string
  title: string
  description: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { services: number }
}

function AddGroupModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/imei/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal menyimpan')
        setLoading(false)
        return
      }
      onSuccess()
      onClose()
    } catch {
      setError('Terjadi kesalahan jaringan')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-sm rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Tambah Service Group</h3>
            <p className="mt-0.5 text-xs text-surface-500">Grup untuk mengelompokkan layanan digital</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Nama Group</label>
            <Input
              placeholder="Contoh: Samsung Unlock"
              className="h-9 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Deskripsi (opsional)</label>
            <textarea
              placeholder="Deskripsi singkat tentang grup ini..."
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-surface-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export function AdminImeiGroupsPanel() {
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/imei/groups')
      const data = await res.json()
      if (data.success) setGroups(data.data)
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus group "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/imei/groups/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setGroups((prev) => prev.filter((g) => g.id !== id))
      } else {
        alert(data.error || 'Gagal menghapus')
      }
    } catch {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const filtered = groups.filter(
    (g) => !q.trim() || g.title.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Group
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari service group..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat...' : `${filtered.length} service group`}
      </p>

      {/* Loading */}
      {loading && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {/* Groups Grid */}
      {!loading && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-700">
                        <FolderKanban className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{group.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-500">
                          <Badge variant="primary" className="text-[8px] px-1.5 py-0">
                            {group._count?.services ?? 0} services
                          </Badge>
                          <span>Dibuat: {new Date(group.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => handleDelete(group.id, group.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <FolderKanban className="mx-auto h-6 w-6 text-surface-300" />
              <p className="mt-3 text-sm font-semibold text-ink">Belum ada service group</p>
              <p className="mt-1 text-xs text-surface-500">
                Buat group untuk mengelompokkan layanan digital.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddGroupModal onClose={() => setShowAdd(false)} onSuccess={fetchGroups} />}
      </AnimatePresence>
    </div>
  )
}
