'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Check, X, Clock, RefreshCw, Package } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatOrderFieldEntries } from '@/lib/server-fields'

type OrderStatus = 'PENDING' | 'IN_PROCESS' | 'SUCCESS' | 'REJECTED' | 'CANCELLED'

interface ServerOrderItem {
  id: string
  orderCode: string
  price: string | number
  status: OrderStatus
  email: string | null
  notes: string | null
  code: string | null
  comments: string | null
  requiredFields: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string }
  service: { id: string; title: string; requiredFields?: string | null; box?: { title: string } }
}

function formatPrice(price: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price))
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'danger' | 'default' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  IN_PROCESS: { label: 'In Process', variant: 'info' },
  SUCCESS: { label: 'Success', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
}

function OrderDetailModal({ order, onClose, onUpdate }: { order: ServerOrderItem; onClose: () => void; onUpdate: () => void }) {
  const config = statusConfig[order.status]
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!confirm(`Ubah status ke ${statusConfig[newStatus].label}?`)) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/imei/server-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) { onUpdate(); onClose() }
      else alert(data.error || 'Gagal')
    } catch { alert('Error') }
    finally { setUpdating(false) }
  }

  const fieldEntries = formatOrderFieldEntries(
    order.requiredFields,
    order.service.requiredFields ?? null,
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="w-full max-w-lg rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Detail Server Order</h3>
            <p className="mt-0.5 text-xs text-surface-500">#{order.orderCode}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
            <span className="text-xs text-surface-500">Status</span>
            <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500">Harga</p>
              <p className="mt-0.5 text-xs font-semibold text-primary-600">{formatPrice(order.price)}</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500">User</p>
              <p className="mt-0.5 text-xs font-medium text-ink">{order.user.name}</p>
              <p className="text-[10px] text-surface-400">{order.user.email}</p>
            </div>
          </div>

          <div className="rounded-xl bg-surface-50 p-3">
            <p className="text-[10px] text-surface-500">Service</p>
            <p className="mt-0.5 text-xs font-semibold text-ink">{order.service.title}</p>
            {order.service.box && <p className="text-[10px] text-surface-400">{order.service.box.title}</p>}
          </div>

          {order.email && (
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500">Email</p>
              <p className="mt-0.5 text-xs text-ink">{order.email}</p>
            </div>
          )}

          {fieldEntries.length > 0 && (
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500 mb-1">Data order</p>
              {fieldEntries.map((entry) => (
                <div key={entry.label} className="flex justify-between gap-2 py-0.5 text-[11px]">
                  <span className="shrink-0 text-surface-500">{entry.label}</span>
                  <span className="break-all text-right font-medium text-ink">{entry.value}</span>
                </div>
              ))}
            </div>
          )}

          {order.notes && (
            <div className="rounded-xl bg-surface-50 p-3">
              <p className="text-[10px] text-surface-500">Notes</p>
              <p className="mt-0.5 text-xs text-ink">{order.notes}</p>
            </div>
          )}

          {order.code && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
              <p className="text-[10px] font-medium text-primary-700">Hasil</p>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-ink">{order.code}</pre>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {order.status === 'PENDING' && (
              <>
                <Button variant="primary" size="sm" className="flex-1" disabled={updating} onClick={() => handleStatusChange('IN_PROCESS')}><RefreshCw className="h-3.5 w-3.5" />Proses</Button>
                <Button variant="destructive" size="sm" className="flex-1" disabled={updating} onClick={() => handleStatusChange('REJECTED')}><X className="h-3.5 w-3.5" />Reject</Button>
              </>
            )}
            {order.status === 'IN_PROCESS' && (
              <>
                <Button variant="primary" size="sm" className="flex-1" disabled={updating} onClick={() => handleStatusChange('SUCCESS')}><Check className="h-3.5 w-3.5" />Selesaikan</Button>
                <Button variant="destructive" size="sm" className="flex-1" disabled={updating} onClick={() => handleStatusChange('REJECTED')}><X className="h-3.5 w-3.5" />Reject</Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AdminServerOrdersPanel() {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<ServerOrderItem | null>(null)
  const [orders, setOrders] = useState<ServerOrderItem[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inProcess: 0, success: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (q.trim()) params.set('q', q)
      const res = await fetch(`/api/admin/imei/server-orders?${params}`)
      const data = await res.json()
      if (data.success) { setOrders(data.data.orders); setStats(data.data.stats) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [statusFilter, q])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total, color: 'bg-surface-100 text-ink' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
          { label: 'In Process', value: stats.inProcess, color: 'bg-blue-50 text-blue-700' },
          { label: 'Success', value: stats.success, color: 'bg-primary-50 text-primary-700' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl p-3 text-center', stat.color)}>
            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
            <p className="text-[10px] font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')} className="h-9 rounded-xl border border-surface-200/80 bg-white px-3 text-xs text-surface-700">
          <option value="all">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROCESS">In Process</option>
          <option value="SUCCESS">Success</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari order..." className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">{loading ? 'Memuat...' : `${orders.length} order`}</p>

      {loading && <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />)}</div>}

      {!loading && (
        <div className="space-y-2">
          {orders.map((order, idx) => {
            const config = statusConfig[order.status]
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-white p-3 transition-all hover:border-primary-200/70 hover:shadow-soft-sm cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                    order.status === 'PENDING' && 'bg-amber-50 text-amber-600',
                    order.status === 'IN_PROCESS' && 'bg-blue-50 text-blue-600',
                    order.status === 'SUCCESS' && 'bg-primary-50 text-primary-600',
                    order.status === 'REJECTED' && 'bg-red-50 text-red-600',
                    order.status === 'CANCELLED' && 'bg-surface-100 text-surface-500',
                  )}>
                    {order.status === 'PENDING' && <Clock className="h-4 w-4" />}
                    {order.status === 'IN_PROCESS' && <RefreshCw className="h-4 w-4" />}
                    {order.status === 'SUCCESS' && <Check className="h-4 w-4" />}
                    {(order.status === 'REJECTED' || order.status === 'CANCELLED') && <X className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-ink">{order.orderCode}</p>
                      <Badge variant={config.variant} className="text-[8px] px-1.5 py-0">{config.label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-surface-500">
                      <span className="truncate max-w-[200px]">{order.service.title}</span>
                      <span>·</span>
                      <span>{order.user.name}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-surface-400">
                      <span className="font-semibold text-primary-700">{formatPrice(order.price)}</span>
                      <span>·</span>
                      <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <button className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-ink"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            )
          })}
          {orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <Package className="mx-auto h-6 w-6 text-surface-300" />
              <p className="mt-3 text-sm font-semibold text-ink">Belum ada server order</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={fetchOrders} />}
      </AnimatePresence>
    </div>
  )
}
