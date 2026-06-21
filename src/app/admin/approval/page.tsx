'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { FilterGroupSheet } from '@/components/ui/filter-group-sheet'
import { CheckCircle, XCircle, Clock, ChevronRight } from '@/lib/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminApprovalRekberPanel } from '@/components/admin/admin-approval-rekber-panel'
import { AdminApprovalDetailModal } from '@/components/admin/admin-approval-detail-modal'
import type { ApprovalDetail } from '@/lib/approval-detail-types'
import {
  countApprovalQueueByType,
  filterApprovalQueueItems,
  type ApprovalItemStatus,
  type ApprovalQueueItem,
  type ApprovalStats,
  type ApprovalStatusFilter,
  type ApprovalTypeFilter,
} from '@/lib/approval-queue'
import { cn } from '@/lib/utils'

const typeBadge: Record<string, { variant: 'primary' | 'info' | 'warning'; label: string }> = {
  Produk: { variant: 'primary', label: 'Produk' },
  Teknisi: { variant: 'info', label: 'Teknisi' },
  Toko: { variant: 'warning', label: 'Toko' },
}

const statusBadge: Record<
  ApprovalItemStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Menunggu',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  approved: {
    label: 'Disetujui',
    className: 'border-primary-200 bg-primary-50 text-primary-800',
  },
  rejected: {
    label: 'Ditolak',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

const emptyStats: ApprovalStats = { pending: 0, approved: 0, rejected: 0 }

const STATUS_FILTERS: { id: ApprovalStatusFilter; label: string }[] = [
  { id: 'all', label: 'Semua status' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
]

const TYPE_FILTERS: { id: ApprovalTypeFilter; label: string }[] = [
  { id: 'all', label: 'Semua jenis' },
  { id: 'Produk', label: 'Produk' },
  { id: 'Toko', label: 'Toko' },
  { id: 'Teknisi', label: 'Teknisi' },
]

export default function AdminApprovalPage() {
  const [section, setSection] = useState('queue')
  const [items, setItems] = useState<ApprovalQueueItem[]>([])
  const [stats, setStats] = useState<ApprovalStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApprovalStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<ApprovalTypeFilter>('all')

  const [selectedItem, setSelectedItem] = useState<ApprovalQueueItem | null>(null)
  const [detail, setDetail] = useState<ApprovalDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/approval')
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal memuat antrian approval')
        return
      }
      setItems(data.data.items)
      setStats(data.data.stats)
    } catch {
      setError('Gagal memuat antrian approval')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  const filteredItems = useMemo(
    () =>
      filterApprovalQueueItems(items, {
        q: search,
        status: statusFilter,
        type: typeFilter,
      }),
    [items, search, statusFilter, typeFilter],
  )

  const typeCounts = useMemo(() => countApprovalQueueByType(items), [items])

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== 'all' || typeFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
  }

  const closeDetail = useCallback(() => {
    setSelectedItem(null)
    setDetail(null)
    setDetailLoading(false)
  }, [])

  const openDetail = useCallback(async (item: ApprovalQueueItem) => {
    setSelectedItem(item)
    setDetail(null)
    setDetailLoading(true)
    try {
      const params = new URLSearchParams({
        entityType: item.entityType,
        id: item.id,
      })
      const res = await fetch(`/api/admin/approval/detail?${params}`)
      const data = await res.json()
      if (data.success) setDetail(data.data as ApprovalDetail)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleAction = async (
    item: ApprovalQueueItem,
    action: 'approve' | 'reject',
    fromModal = false,
  ) => {
    setActionId(`${item.entityType}-${item.id}`)
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: item.entityType,
          id: item.id,
          action,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Gagal memproses approval')
        return
      }
      setItems(data.data.items)
      setStats(data.data.stats)
      if (fromModal) closeDetail()
    } catch {
      alert('Gagal memproses approval')
    } finally {
      setActionId(null)
    }
  }

  return (
    <motion.div className="space-y-5">
      <motion.div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Approval</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">
          Review dan approve produk, teknisi, dan toko dari database
        </p>
      </motion.div>

      <Tabs value={section} onValueChange={setSection}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="queue" className="shrink-0 px-3 text-xs sm:px-4">
              Permintaan approval
            </TabsTrigger>
            <TabsTrigger value="rekber" className="shrink-0 px-3 text-xs sm:px-4">
              Transaksi Aman
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              className={cn(
                'rounded-xl border p-3 text-left transition-all',
                statusFilter === 'pending'
                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200/80'
                  : 'border-amber-200/60 bg-amber-50/40 hover:border-amber-300',
              )}
            >
              <Clock className="mb-1 h-4 w-4 text-amber-600" />
              <p className="text-xl font-bold text-ink tabular-nums">{stats.pending}</p>
              <p className="text-[10px] font-medium text-surface-500">Pending</p>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
              className={cn(
                'rounded-xl border p-3 text-left transition-all',
                statusFilter === 'approved'
                  ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200/80'
                  : 'border-primary-200/60 bg-primary-50/40 hover:border-primary-300',
              )}
            >
              <CheckCircle className="mb-1 h-4 w-4 text-primary-600" />
              <p className="text-xl font-bold text-ink tabular-nums">{stats.approved}</p>
              <p className="text-[10px] font-medium text-surface-500">Approved</p>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
              className={cn(
                'rounded-xl border p-3 text-left transition-all',
                statusFilter === 'rejected'
                  ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200/80'
                  : 'border-rose-200/60 bg-rose-50/40 hover:border-rose-300',
              )}
            >
              <XCircle className="mb-1 h-4 w-4 text-rose-600" />
              <p className="text-xl font-bold text-ink tabular-nums">{stats.rejected}</p>
              <p className="text-[10px] font-medium text-surface-500">Rejected</p>
            </button>
          </div>

          <div className="rounded-xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, deskripsi, pengaju..."
                className="min-w-0 flex-1"
                inputClassName="h-9 text-xs"
              />
              <FilterGroupSheet
                groups={[
                  {
                    id: 'type',
                    label: 'Jenis',
                    value: typeFilter,
                    onChange: (value) => setTypeFilter(value as ApprovalTypeFilter),
                    options: TYPE_FILTERS.map((f) => ({
                      id: f.id,
                      label: f.id === 'all' ? f.label : `${f.label} (${typeCounts[f.id]})`,
                    })),
                  },
                  {
                    id: 'status',
                    label: 'Status',
                    value: statusFilter,
                    onChange: (value) => setStatusFilter(value as ApprovalStatusFilter),
                    options: STATUS_FILTERS.map((f) => ({ id: f.id, label: f.label })),
                  },
                ]}
                onReset={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                }}
                disabled={loading}
              />
            </div>
            {hasActiveFilters && (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-surface-100 pt-2">
                <p className="text-[11px] text-surface-500">
                  Menampilkan {filteredItems.length} dari {items.length} permintaan
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 text-[11px] font-medium text-primary-700 hover:underline"
                >
                  Reset filter
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-ink">
              Daftar permintaan ({filteredItems.length}
              {hasActiveFilters ? ` / ${items.length}` : ''})
            </h2>
            <p className="mb-3 text-[11px] text-surface-500">
              Item yang sudah disetujui atau ditolak tetap ditampilkan. Klik kartu untuk detail
              lengkap termasuk foto produk.
            </p>

            {loading ? (
              <p className="py-8 text-center text-sm text-surface-500">Memuat antrian...</p>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => void loadQueue()}>
                  Coba lagi
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {filteredItems.map((item, idx) => {
                    const badge = typeBadge[item.type] ?? typeBadge.Produk
                    const status = statusBadge[item.status]
                    const isPending = item.status === 'pending'
                    const busy = actionId === `${item.entityType}-${item.id}`
                    return (
                      <motion.div
                        key={`${item.entityType}-${item.id}`}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => void openDetail(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              void openDetail(item)
                            }
                          }}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 transition-all hover:shadow-soft-sm sm:p-4 ${
                            isPending
                              ? 'border-surface-200/70 hover:border-primary-200/70 hover:bg-primary-50/20'
                              : item.status === 'approved'
                                ? 'border-primary-100/80 bg-primary-50/10 hover:border-primary-200/70'
                                : 'border-rose-100/80 bg-rose-50/10 hover:border-rose-200/70'
                          }`}
                        >
                          {item.thumbnailUrl ? (
                            <div className="aspect-[4/3] h-14 w-[4.75rem] flex-shrink-0 overflow-hidden rounded-lg border border-surface-200 bg-surface-100 sm:h-16 sm:w-[5.5rem]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[4/3] h-14 w-[4.75rem] flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-surface-200 bg-surface-50 text-[10px] text-surface-400 sm:h-16 sm:w-[5.5rem]">
                              {item.type}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge variant={badge.variant} className="px-1.5 py-0.5 text-[9px]">
                                {badge.label}
                              </Badge>
                              <span
                                className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                              <h3 className="text-[13px] font-semibold text-ink">{item.name}</h3>
                            </div>
                            <p className="line-clamp-2 text-[11px] text-surface-500">
                              {item.description}
                            </p>
                            <p className="mt-1 text-[10px] text-surface-400">
                              {item.submitter} · {item.date}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-primary-600">
                              Klik untuk detail lengkap
                            </p>
                          </div>

                          <div
                            className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronRight className="hidden h-4 w-4 text-surface-300 sm:mb-0 sm:block" />
                            {isPending ? (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  className="h-8 px-2.5 text-[11px] text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                                  onClick={() => void handleAction(item, 'reject')}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span className="ml-1 hidden sm:inline">Tolak</span>
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  className="h-8 bg-primary-600 px-2.5 text-[11px] hover:bg-primary-700"
                                  onClick={() => void handleAction(item, 'approve')}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span className="ml-1 hidden sm:inline">Setujui</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-surface-400">
                                {status.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </AnimatePresence>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-primary-400" />
                <p className="mt-2 text-sm font-semibold text-ink">Belum ada permintaan</p>
                <p className="mt-1 text-xs text-surface-500">
                  Tidak ada produk, toko, atau teknisi dalam sistem approval.
                </p>
              </div>
            )}

            {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
                <p className="text-sm font-semibold text-ink">Tidak ada hasil</p>
                <p className="mt-1 text-xs text-surface-500">
                  Coba ubah kata kunci atau reset filter pencarian.
                </p>
                <Button size="sm" variant="outline" className="mt-3" onClick={clearFilters}>
                  Reset filter
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rekber" className="mt-4">
          <AdminApprovalRekberPanel />
        </TabsContent>
      </Tabs>

      <AdminApprovalDetailModal
        item={selectedItem}
        detail={detail}
        loading={detailLoading}
        busy={Boolean(actionId)}
        onClose={closeDetail}
        onAction={(action) => {
          if (selectedItem) void handleAction(selectedItem, action, true)
        }}
      />
    </motion.div>
  )
}
