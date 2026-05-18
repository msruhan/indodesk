'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Unlock, Eye, RefreshCw, Clock } from '@/lib/icons'

interface ImeiServiceItem {
  id: string
  title: string
  description: string | null
  price: string | number
  deliveryTime: string | null
  status: 'ACTIVE' | 'INACTIVE'
  requiresImei: boolean
  requiresNetwork: boolean
  requiresModel: boolean
  requiresProvider: boolean
  group: { id: string; title: string }
  api: { id: string; title: string }
  createdAt: string
}

interface ServiceGroup {
  id: string
  title: string
}

function formatPrice(price: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price))
}

export function AdminImeiServicesPanel() {
  const [q, setQ] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [services, setServices] = useState<ImeiServiceItem[]>([])
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [svcRes, grpRes] = await Promise.all([
        fetch('/api/admin/imei/services'),
        fetch('/api/admin/imei/groups'),
      ])
      const [svcData, grpData] = await Promise.all([svcRes.json(), grpRes.json()])
      if (svcData.success) setServices(svcData.data)
      if (grpData.success) setGroups(grpData.data)
    } catch (e) {
      console.error('Failed to fetch services:', e)
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
      const res = await fetch(`/api/admin/imei/services/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.id !== id))
      } else {
        alert(data.error || 'Gagal menghapus')
      }
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
          s.group.title.toLowerCase().includes(q.toLowerCase()) ||
          s.api.title.toLowerCase().includes(q.toLowerCase())
        const okGroup = groupFilter === 'all' || s.group.id === groupFilter
        const okStatus = statusFilter === 'all' || s.status === statusFilter
        return okQ && okGroup && okStatus
      }),
    [q, groupFilter, statusFilter, services],
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <Button variant="primary" size="sm" className="h-9 self-start">
          <Plus className="h-3.5 w-3.5" />
          Tambah Service
        </Button>
        <Button variant="outline" size="sm" className="h-9 self-start">
          <RefreshCw className="h-3.5 w-3.5" />
          Sync dari API
        </Button>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
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
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari service..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat...' : `${filtered.length} service IMEI`}
      </p>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {/* Service List */}
      {!loading && (
        <div className="space-y-2">
          {filtered.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700">
                  <Unlock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2 flex-wrap">
                    <p className="truncate text-[13px] font-semibold text-ink">{service.title}</p>
                    <Badge
                      variant={service.status === 'ACTIVE' ? 'success' : 'default'}
                      className="text-[8px] px-1.5 py-0"
                    >
                      {service.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                    <Badge variant="info" className="text-[8px] px-1 py-0">{service.group.title}</Badge>
                    <span>·</span>
                    <span>{service.api.title}</span>
                    <span>·</span>
                    <span className="font-semibold text-primary-700 tabular-nums">{formatPrice(service.price)}</span>
                    {service.deliveryTime && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {service.deliveryTime}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Required fields */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {service.requiresImei && (
                      <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600">IMEI</span>
                    )}
                    {service.requiresNetwork && (
                      <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600">Network</span>
                    )}
                    {service.requiresModel && (
                      <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600">Model</span>
                    )}
                    {service.requiresProvider && (
                      <span className="rounded bg-surface-100 px-1 py-0.5 text-[8px] font-medium text-surface-600">Provider</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => handleDelete(service.id, service.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <Unlock className="mx-auto h-6 w-6 text-surface-300" />
              <p className="mt-3 text-sm font-semibold text-ink">Tidak ada service ditemukan</p>
              <p className="mt-1 text-xs text-surface-500">Coba ubah filter atau kata kunci pencarian.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
