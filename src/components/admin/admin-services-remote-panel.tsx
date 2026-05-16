'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Edit, Eye, Laptop, Plus, Radio, Search, XCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'

type RemoteStatus = 'waiting' | 'active' | 'completed' | 'cancelled'

const remoteSeed = [
  { id: '1', user: 'Budi Santoso', teknisi: 'Ahmad Hidayat', remoteId: '987 654 321', platform: 'Windows 11', status: 'waiting' as RemoteStatus, requestedAt: '2 menit lalu' },
  { id: '2', user: 'Siti Nurhaliza', teknisi: '—', remoteId: '456 123 789', platform: 'Android', status: 'waiting' as RemoteStatus, requestedAt: '8 menit lalu' },
  { id: '3', user: 'Rudi Hartono', teknisi: 'Budi Santoso', remoteId: '111 222 333', platform: 'macOS', status: 'active' as RemoteStatus, requestedAt: '25 menit lalu' },
  { id: '4', user: 'Dewi Lestari', teknisi: 'Ahmad Hidayat', remoteId: '444 555 666', platform: 'Windows 10', status: 'completed' as RemoteStatus, requestedAt: '1 jam lalu' },
  { id: '5', user: 'Fajar Pratama', teknisi: '—', remoteId: '777 888 999', platform: 'Linux', status: 'cancelled' as RemoteStatus, requestedAt: '3 jam lalu' },
]

const statusConfig: Record<RemoteStatus, { label: string; variant: 'warning' | 'success' | 'default' | 'danger'; icon: typeof Clock }> = {
  waiting: { label: 'Menunggu', variant: 'warning', icon: Clock },
  active: { label: 'Aktif', variant: 'success', icon: Radio },
  completed: { label: 'Selesai', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: XCircle },
}

export function AdminServicesRemotePanel() {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = remoteSeed.filter((r) => {
    const okQ = r.user.toLowerCase().includes(q.toLowerCase()) || r.remoteId.includes(q) || r.teknisi.toLowerCase().includes(q.toLowerCase())
    const okS = statusFilter === 'all' || r.status === statusFilter
    return okQ && okS
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="primary" size="sm" className="h-9 self-start">
          <Plus className="h-3.5 w-3.5" />
          Tambah Paket
        </Button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700"
        >
          <option value="all">Semua Status</option>
          <option value="waiting">Menunggu</option>
          <option value="active">Aktif</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari user, ID remote..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-surface-500">{filtered.length} sesi remote</p>
        <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => window.open('/remote', '_blank')}>
          Halaman publik
        </Button>
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {filtered.map((r, idx) => {
          const cfg = statusConfig[r.status]
          const StatusIcon = cfg.icon
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <div className={cn(
                'flex items-center gap-3 rounded-xl border bg-white p-3 transition-all hover:shadow-soft-sm',
                r.status === 'waiting' ? 'border-amber-200/70' : r.status === 'active' ? 'border-primary-200/70' : 'border-surface-200/70',
              )}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                  <Laptop className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{r.user}</p>
                    <Badge variant={cfg.variant} className="text-[8px] px-1.5 py-0">
                      <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                    <span>Teknisi: <span className="font-medium text-ink">{r.teknisi}</span></span>
                    <span>·</span>
                    <span className="font-mono">{r.remoteId}</span>
                    <span>·</span>
                    <span>{r.platform}</span>
                    <span>·</span>
                    <span>{r.requestedAt}</span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Eye className="h-3.5 w-3.5" /></button>
                  {r.status === 'waiting' && (
                    <Button size="sm" variant="primary" className="h-7 px-2 text-[10px]">Assign</Button>
                  )}
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Edit className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
