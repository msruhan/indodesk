'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardMonthFilter, FilterSelect, MetricCard } from '@/components/dashboard'
import { InspeksiDetailModal } from '@/components/teknisi/inspeksi-detail-modal'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import {
  CheckCircle,
  CheckSquare,
  Clock,
  RefreshCw,
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

type StatusTab = 'all' | 'waiting' | 'active' | 'completed'
type RatingFilter = 'all' | 'rated' | 'unrated'

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'waiting', label: 'Menunggu' },
  { id: 'active', label: 'Berjalan' },
  { id: 'completed', label: 'Selesai' },
]

const ACTIVE_STATUSES: InspectionUiStatus[] = ['accepted', 'in_progress', 'report_ready']

export default function TeknisiInspeksiPage() {
  const { period, label: periodLabel } = useDashboardPeriod()
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
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

  const ratingFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Semua rating' },
      { id: 'rated' as const, label: 'Sudah dinilai' },
      { id: 'unrated' as const, label: 'Belum dinilai' },
    ],
    [],
  )

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (!isDateInPeriod(item.createdAt, period)) return false
      if (statusTab === 'waiting' && item.status !== 'waiting') return false
      if (statusTab === 'active' && !ACTIVE_STATUSES.includes(item.status)) return false
      if (statusTab === 'completed' && item.status !== 'completed') return false
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
  }, [items, period, query, statusTab, ratingFilter])

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const hasActiveFilters =
    query.trim() !== '' || statusTab !== 'all' || ratingFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusTab('all')
    setRatingFilter('all')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Inspeksi</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Kelola permintaan inspeksi pra-beli dari user
          </p>
          {stats.waiting > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Total"
          value={stats.total.toLocaleString('id-ID')}
          icon={CheckSquare}
          footnote={periodLabel}
          tone="primary"
          compact
        />
        <MetricCard
          title="Menunggu"
          value={stats.waiting.toLocaleString('id-ID')}
          icon={Clock}
          footnote="Perlu diterima/ditolak"
          tone={stats.waiting > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Berjalan"
          value={stats.active.toLocaleString('id-ID')}
          icon={CheckSquare}
          footnote="Sedang diproses"
          tone="primary"
          compact
        />
        <MetricCard
          title="Selesai"
          value={stats.completed.toLocaleString('id-ID')}
          icon={CheckCircle}
          footnote="Inspeksi tuntas"
          tone="primary"
          compact
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="-mx-1 shrink-0 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusTab(t.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  statusTab === t.id
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-surface-600 hover:text-primary-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari order, produk, user..."
          className="min-w-0 w-full flex-1 sm:min-w-[16rem]"
          inputClassName="h-9 text-xs"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FilterSelect
          options={ratingFilterOptions}
          value={ratingFilter}
          onChange={setRatingFilter}
          ariaLabel="Filter rating inspeksi"
          label="Rating"
          className="w-full sm:w-[11.5rem]"
          disabled={loading}
        />
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${filteredItems.length} inspeksi ditampilkan`}
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      ) : periodItems.length === 0 ? (
        <Card className="shadow-soft-xs">
          <CardContent className="p-8 text-center">
            <CheckSquare className="mx-auto mb-3 h-8 w-8 text-surface-400" />
            <p className="text-sm font-semibold text-ink">Belum ada inspeksi</p>
            <p className="mt-1 text-xs text-surface-500">
              Permintaan inspeksi dari user akan muncul di sini.
            </p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="shadow-soft-xs">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-surface-600">Tidak ada inspeksi yang cocok dengan filter.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
                Reset filter
              </Button>
            )}
          </CardContent>
        </Card>
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
