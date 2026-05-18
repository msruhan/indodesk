'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Package } from '@/lib/icons'
import { parseServerFieldDefs } from '@/lib/server-fields'
import { AdminServerServiceEditModal } from '@/components/admin/admin-server-service-edit-modal'

interface ServerServiceItem {
  id: string
  title: string
  description: string | null
  price: string | number
  deliveryTime: string | null
  status: 'ACTIVE' | 'INACTIVE'
  requiredFields: string | null
  box: { id: string; title: string }
  api: { id: string; title: string }
}

interface ServerBox {
  id: string
  title: string
}

function formatPrice(price: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(price))
}

export function AdminServerServicesPanel() {
  const [q, setQ] = useState('')
  const [boxFilter, setBoxFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [services, setServices] = useState<ServerServiceItem[]>([])
  const [boxes, setBoxes] = useState<ServerBox[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ServerServiceItem | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [svcRes, boxRes] = await Promise.all([
        fetch('/api/admin/imei/server-services'),
        fetch('/api/admin/imei/server-boxes'),
      ])
      const [svcData, boxData] = await Promise.all([svcRes.json(), boxRes.json()])
      if (svcData.success) setServices(svcData.data)
      if (boxData.success) setBoxes(boxData.data)
    } catch (e) {
      console.error('Failed to fetch:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus service "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/imei/server-services/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) setServices((prev) => prev.filter((s) => s.id !== id))
      else alert(data.error || 'Gagal menghapus')
    } catch {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const filtered = useMemo(
    () =>
      services.filter((s) => {
        const okQ =
          !q.trim() ||
          s.title.toLowerCase().includes(q.toLowerCase()) ||
          s.box.title.toLowerCase().includes(q.toLowerCase())
        const okBox = boxFilter === 'all' || s.box.id === boxFilter
        const okStatus = statusFilter === 'all' || s.status === statusFilter
        return okQ && okBox && okStatus
      }),
    [q, boxFilter, statusFilter, services],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <Button variant="primary" size="sm" className="h-9 self-start" disabled title="Segera">
          <Plus className="h-3.5 w-3.5" />
          Tambah Server Service
        </Button>
        <select
          value={boxFilter}
          onChange={(e) => setBoxFilter(e.target.value)}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Box</option>
          {boxes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ACTIVE' | 'INACTIVE')}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari server service..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat...' : `${filtered.length} server service`}
      </p>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50"
            />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {filtered.map((service, idx) => {
            const fieldDefs = parseServerFieldDefs(service.requiredFields)
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{service.title}</p>
                      <Badge
                        variant={service.status === 'ACTIVE' ? 'success' : 'default'}
                        className="text-[8px] px-1.5 py-0"
                      >
                        {service.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                      <Badge variant="info" className="text-[8px] px-1 py-0">
                        {service.box.title}
                      </Badge>
                      <span>·</span>
                      <span>{service.api.title}</span>
                      <span>·</span>
                      <span className="font-semibold text-primary-700 tabular-nums">
                        {formatPrice(service.price)}
                      </span>
                      {service.deliveryTime && (
                        <>
                          <span>·</span>
                          <span>{service.deliveryTime}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {fieldDefs.length === 0 ? (
                        <span className="text-[9px] text-amber-600">Belum ada field order</span>
                      ) : (
                        fieldDefs.map((f) => (
                          <span
                            key={f.key}
                            className="rounded bg-surface-100 px-1.5 py-0.5 text-[8px] font-medium text-surface-600"
                          >
                            {f.label}
                            {f.required ? '*' : ''}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"
                      title="Edit layanan & field order"
                      onClick={() => setEditing(service)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleDelete(service.id, service.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <Package className="mx-auto h-6 w-6 text-surface-300" />
              <p className="mt-3 text-sm font-semibold text-ink">Belum ada server service</p>
              <p className="mt-1 text-xs text-surface-500">
                Sync dari API supplier lalu atur field order per layanan.
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <AdminServerServiceEditModal
            service={editing}
            boxes={boxes}
            onClose={() => setEditing(null)}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
