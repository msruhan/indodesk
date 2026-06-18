'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/filter-dropdown'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardMonthFilter } from '@/components/dashboard'
import { InspeksiDetailModal } from '@/components/teknisi/inspeksi-detail-modal'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import {
  CheckCircle,
  CheckSquare,
  Clock,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { InspectionOrderDto } from '@/lib/inspection-serializer'
import type { InspectionUiStatus } from '@/lib/inspection-labels'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

function formatDateShort(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function statusBadgeVariant(status: InspectionUiStatus) {
  switch (status) {
    case 'completed':
      return 'success' as const
    case 'waiting':
    case 'accepted':
      return 'warning' as const
    case 'in_progress':
    case 'report_ready':
      return 'default' as const
    case 'rejected':
    case 'cancelled':
      return 'danger' as const
    case 'disputed':
      return 'warning' as const
    default:
      return 'default' as const
  }
}

type StatusFilter = InspectionUiStatus | 'all'
type RatingFilter = 'all' | 'rated' | 'unrated'

const statusConfig: Record<
  InspectionUiStatus,
  { label: string; icon: typeof Clock }
> = {
  waiting: { label: 'Menunggu', icon: Clock },
  accepted: { label: 'Diterima', icon: CheckCircle },
  in_progress: { label: 'Berjalan', icon: Clock },
  report_ready: { label: 'Laporan siap', icon: CheckSquare },
  completed: { label: 'Selesai', icon: CheckCircle },
  rejected: { label: 'Ditolak', icon: XCircle },
  cancelled: { label: 'Dibatalkan', icon: XCircle },
  disputed: { label: 'Dispute', icon: Clock },
}

export default function TeknisiInspeksiPage() {
  const { period } = useDashboardPeriod()
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [detailOrder, setDetailOrder] = useState<InspectionOrderDto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/inspeksi')
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal memuat inspeksi')
        return
      }
      setItems(data.data ?? [])
    } catch {
      setError('Gagal memuat inspeksi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchAction = async (id: string, action: 'accept' | 'reject' | 'start') => {
    setActingId(id)
    try {
      const res = await fetch(`/api/teknisi/inspeksi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui inspeksi')
        return
      }
      await load()
      if (detailOrder?.id === id) {
        setDetailOrder(json.data)
      }
    } catch {
      setError('Gagal memperbarui inspeksi')
    } finally {
      setActingId(null)
    }
  }

  const stats = useMemo(() => {
    const periodItems = items.filter((i) => isDateInPeriod(i.createdAt, period))
    return {
      total: periodItems.length,
      waiting: periodItems.filter((i) => i.status === 'waiting').length,
      active: periodItems.filter(
        (i) =>
          i.status === 'accepted' ||
          i.status === 'in_progress' ||
          i.status === 'report_ready',
      ).length,
      completed: periodItems.filter((i) => i.status === 'completed').length,
    }
  }, [items, period])

  const statusFilterOptions = useMemo((): FilterDropdownOption<StatusFilter>[] => {
    const countFor = (status?: InspectionUiStatus) =>
      status ? items.filter((i) => i.status === status).length : items.length

    return [
      { id: 'all', label: 'Semua status', tone: 'neutral', icon: CheckSquare },
      {
        id: 'waiting',
        label: statusConfig.waiting.label,
        tone: 'warning',
        icon: statusConfig.waiting.icon,
        count: countFor('waiting'),
      },
      {
        id: 'accepted',
        label: statusConfig.accepted.label,
        tone: 'info',
        icon: statusConfig.accepted.icon,
        count: countFor('accepted'),
      },
      {
        id: 'in_progress',
        label: statusConfig.in_progress.label,
        tone: 'info',
        icon: statusConfig.in_progress.icon,
        count: countFor('in_progress'),
      },
      {
        id: 'report_ready',
        label: statusConfig.report_ready.label,
        tone: 'primary',
        icon: statusConfig.report_ready.icon,
        count: countFor('report_ready'),
      },
      {
        id: 'completed',
        label: statusConfig.completed.label,
        tone: 'success',
        icon: statusConfig.completed.icon,
        count: countFor('completed'),
      },
    ]
  }, [items])

  const ratingFilterOptions = useMemo((): FilterDropdownOption<RatingFilter>[] => {
    const rated = items.filter((i) => i.ratingByUser != null).length
    const unrated = items.filter(
      (i) => i.status === 'completed' && i.ratingByUser == null,
    ).length

    return [
      { id: 'all', label: 'Semua rating', tone: 'neutral', icon: Star },
      { id: 'rated', label: 'Sudah dinilai', tone: 'success', icon: Star, count: rated },
      { id: 'unrated', label: 'Belum dinilai', tone: 'warning', icon: Star, count: unrated },
    ]
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (!isDateInPeriod(item.createdAt, period)) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (ratingFilter === 'rated' && item.ratingByUser == null) return false
      if (ratingFilter === 'unrated') {
        if (item.status !== 'completed' || item.ratingByUser != null) return false
      }
      if (!q) return true
      const haystack = [
        item.orderCode,
        item.productName,
        item.user?.name ?? '',
        item.user?.email ?? '',
        item.statusLabel,
        item.ratingByUser != null ? String(item.ratingByUser) : '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, period, query, statusFilter, ratingFilter])

  const hasActiveFilters =
    query.trim() !== '' || statusFilter !== 'all' || ratingFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setRatingFilter('all')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Inspeksi</h1>
          <p className="mt-1 text-sm text-surface-500">
            Kelola permintaan inspeksi pra-beli dari user
          </p>
          {stats.waiting > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Clock className="h-3.5 w-3.5" />
              {stats.waiting} menunggu respons
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DashboardMonthFilter />
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspeksi</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-surface-500">Periode terpilih</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-surface-500">Perlu diterima/ditolak</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berjalan</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-surface-500">Sedang diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-surface-500">Inspeksi selesai</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Inspeksi</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 && (
            <>
              <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari order, produk, user..."
                    className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
                    disabled={loading}
                  />
                </div>
                <FilterDropdown
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel="Filter status inspeksi"
                  label="Status"
                  triggerIcon={Clock}
                  placeholder="Semua status"
                  className="w-full sm:w-[11.5rem]"
                  align="right"
                  disabled={loading}
                />
                <FilterDropdown
                  options={ratingFilterOptions}
                  value={ratingFilter}
                  onChange={setRatingFilter}
                  ariaLabel="Filter rating inspeksi"
                  label="Rating"
                  triggerIcon={Star}
                  placeholder="Semua rating"
                  className="w-full sm:w-[11.5rem]"
                  align="right"
                  disabled={loading}
                />
              </div>
              <p className="mb-3 text-[11px] text-surface-500">
                {loading ? 'Memuat…' : `${filteredItems.length} inspeksi`}
              </p>
            </>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-surface-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Memuat...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-surface-500">
              Belum ada permintaan inspeksi. Order dari user akan muncul di sini.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-surface-600">Tidak ada inspeksi yang cocok dengan filter.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
                  Reset filter
                </Button>
              )}
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Pemesan</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap font-medium font-mono text-xs">
                        {item.orderCode}
                      </TableCell>
                      <TableCell>{item.user?.name ?? '—'}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate">{item.productName}</span>
                          <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                            {item.categoryLabel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(item.status)}>{item.statusLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.ratingByUser != null ? (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{item.ratingByUser}</span>
                            <span className="text-yellow-400">★</span>
                          </div>
                        ) : item.status === 'completed' ? (
                          <span className="text-[11px] text-amber-700">Menunggu</span>
                        ) : (
                          <span className="text-surface-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-surface-600">
                        {formatDateShort(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setDetailOrder(item)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {item.canAccept && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={actingId === item.id}
                                onClick={() => void patchAction(item.id, 'accept')}
                              >
                                Terima
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actingId === item.id}
                                onClick={() => void patchAction(item.id, 'reject')}
                              >
                                Tolak
                              </Button>
                            </>
                          )}
                          {item.canStart && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={actingId === item.id}
                              onClick={() => void patchAction(item.id, 'start')}
                            >
                              Mulai
                            </Button>
                          )}
                          {item.canSubmitReport && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/teknisi/inspeksi/${item.id}`}>Laporan</Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InspeksiDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        acting={actingId === detailOrder?.id}
        onAccept={
          detailOrder?.canAccept
            ? () => void patchAction(detailOrder.id, 'accept')
            : undefined
        }
        onReject={
          detailOrder?.canReject
            ? () => void patchAction(detailOrder.id, 'reject')
            : undefined
        }
        onStart={
          detailOrder?.canStart
            ? () => void patchAction(detailOrder.id, 'start')
            : undefined
        }
      />
    </div>
  )
}
