'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import {
  DashboardMonthFilter,
  DashboardPageHeader,
  FilterSelect,
  MetricCard,
} from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  CheckSquare,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Star,
  User,
  XCircle,
} from '@/lib/icons'
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

const statusConfig: Record<
  InspectionUiStatus,
  { label: string; icon: typeof Clock; cardClass: string }
> = {
  waiting: {
    label: 'Menunggu',
    icon: Clock,
    cardClass: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  },
  accepted: {
    label: 'Diterima',
    icon: CheckCircle,
    cardClass: 'bg-blue-50 text-blue-800 ring-blue-200/70',
  },
  in_progress: {
    label: 'Berjalan',
    icon: Clock,
    cardClass: 'bg-indigo-50 text-indigo-800 ring-indigo-200/70',
  },
  report_ready: {
    label: 'Laporan siap',
    icon: CheckSquare,
    cardClass: 'bg-primary-50 text-primary-800 ring-primary-200/70',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    cardClass: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  },
  rejected: {
    label: 'Ditolak',
    icon: XCircle,
    cardClass: 'bg-rose-50 text-rose-800 ring-rose-200/70',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    cardClass: 'bg-surface-100 text-surface-700 ring-surface-200/80',
  },
  disputed: {
    label: 'Dispute',
    icon: Clock,
    cardClass: 'bg-amber-50 text-amber-900 ring-amber-200/70',
  },
}

type StatusFilter = InspectionUiStatus | 'all'
type ModeFilter = 'all' | 'ONLINE' | 'OFFLINE'
type RatingFilter = 'all' | 'rated' | 'unrated'

export default function UserInspeksiPage() {
  const { period } = useDashboardPeriod()
  const [items, setItems] = useState<InspectionOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/inspeksi')
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

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const stats = useMemo(
    () => ({
      total: periodItems.length,
      active: periodItems.filter(
        (i) =>
          i.status === 'waiting' ||
          i.status === 'accepted' ||
          i.status === 'in_progress' ||
          i.status === 'report_ready',
      ).length,
      completed: periodItems.filter((i) => i.status === 'completed').length,
      report_ready: periodItems.filter((i) => i.status === 'report_ready').length,
      pendingRating: periodItems.filter((i) => i.canRate).length,
    }),
    [periodItems],
  )

  const statusFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Semua status' },
      { id: 'waiting' as const, label: statusConfig.waiting.label },
      { id: 'accepted' as const, label: statusConfig.accepted.label },
      { id: 'in_progress' as const, label: statusConfig.in_progress.label },
      { id: 'report_ready' as const, label: statusConfig.report_ready.label },
      { id: 'completed' as const, label: statusConfig.completed.label },
      { id: 'rejected' as const, label: statusConfig.rejected.label },
      { id: 'cancelled' as const, label: statusConfig.cancelled.label },
    ],
    [],
  )

  const modeFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Semua mode' },
      { id: 'ONLINE' as const, label: 'Online' },
      { id: 'OFFLINE' as const, label: 'Offline' },
    ],
    [],
  )

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
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (modeFilter !== 'all' && item.mode !== modeFilter) return false
      if (ratingFilter === 'rated' && item.ratingByUser == null) return false
      if (ratingFilter === 'unrated' && !item.canRate) return false
      if (!q) return true
      const haystack = [
        item.orderCode,
        item.productName,
        item.productBrand,
        item.productModel,
        item.teknisi.name ?? '',
        item.modeLabel,
        item.categoryLabel,
        item.productSourceLabel,
        item.statusLabel,
        item.city ?? '',
        item.location ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, period, query, statusFilter, modeFilter, ratingFilter])

  const hasActiveFilters =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    modeFilter !== 'all' ||
    ratingFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setModeFilter('all')
    setRatingFilter('all')
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Inspeksi"
        description="Riwayat permintaan inspeksi pra-beli dengan teknisi bersertifikat."
        meta={
          stats.report_ready > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/80 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-800">
              <CheckSquare className="h-3.5 w-3.5" />
              {stats.report_ready} laporan siap ditinjau
            </span>
          ) : undefined
        }
        actions={
          <>
            <DashboardMonthFilter />
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button asChild size="sm">
              <Link href="/user/inspeksi/baru">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Inspeksi baru
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {stats.pendingRating > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Beri rating teknisi</strong> — Anda punya {stats.pendingRating} inspeksi selesai yang
          belum dinilai. Buka detail inspeksi untuk memberikan ulasan.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={stats.total.toString()}
          icon={CheckSquare}
          footnote="Semua permintaan"
          tone="primary"
          compact
        />
        <MetricCard
          title="Aktif"
          value={stats.active.toString()}
          icon={Clock}
          footnote="Sedang berjalan"
          tone={stats.active > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Selesai"
          value={stats.completed.toString()}
          icon={CheckCircle}
          footnote="Inspeksi tuntas"
          tone="primary"
          compact
        />
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, produk, teknisi, lokasi..."
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
              disabled={loading}
            />
          </div>
          <FilterSelect
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter status inspeksi"
            label="Status"
            className="w-full sm:w-[11.5rem]"
            disabled={loading}
          />
          <FilterSelect
            options={modeFilterOptions}
            value={modeFilter}
            onChange={setModeFilter}
            ariaLabel="Filter mode inspeksi"
            label="Mode"
            className="w-full sm:w-[10.5rem]"
            disabled={loading}
          />
          <FilterSelect
            options={ratingFilterOptions}
            value={ratingFilter}
            onChange={setRatingFilter}
            ariaLabel="Filter rating inspeksi"
            label="Rating"
            className="w-full sm:w-[11rem]"
            disabled={loading}
          />
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat…' : `${filteredItems.length} inspeksi`}
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24 p-4" />
              </Card>
            ))}
          </div>
        ) : periodItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="mx-auto mb-4 h-12 w-12 text-surface-300" />
              <p className="text-sm text-surface-600">Belum ada inspeksi.</p>
              <Button asChild className="mt-4" variant="primary" size="sm">
                <Link href="/user/inspeksi/baru">Buat permintaan pertama</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
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
          <div className="space-y-3">
              {filteredItems.map((item) => {
                const cfg = statusConfig[item.status]
                const StatusIcon = cfg.icon
                return (
                  <Card
                    key={item.id}
                    className="transition-shadow hover:shadow-soft-md"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
                              cfg.cardClass,
                            )}
                          >
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-surface-500">{item.orderCode}</span>
                              <Badge variant={statusBadgeVariant(item.status)} className="text-[10px]">
                                {item.statusLabel}
                              </Badge>
                              {item.canRate && (
                                <Badge variant="warning" className="text-[10px]">
                                  Perlu rating
                                </Badge>
                              )}
                            </div>
                            <h3 className="mt-1 font-semibold text-ink">{item.productName}</h3>
                            <p className="mt-0.5 text-sm text-surface-600">
                              {item.productBrand} {item.productModel}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-surface-500">
                              <span>{item.modeLabel}</span>
                              <span>{item.categoryLabel}</span>
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.teknisi.name ?? 'Teknisi'}
                              </span>
                              {(item.city || item.location) && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.city ?? item.location}
                                </span>
                              )}
                              <span>{formatDateShort(item.createdAt)}</span>
                            </div>
                            {item.report && item.status === 'report_ready' && (
                              <p className="mt-2 text-xs font-medium text-primary-700">
                                Rekomendasi: {item.report.recommendationLabel}
                              </p>
                            )}
                            {item.ratingByUser != null && (
                              <p className="mt-1 text-xs text-amber-700">
                                Rating Anda: {item.ratingByUser}/5
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 sm:pl-2">
                          <p className="text-base font-bold tabular-nums text-ink">
                            {formatPrice(item.price)}
                          </p>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/user/inspeksi/${item.id}`}>Lihat detail</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
        )}
      </div>
    </div>
  )
}
