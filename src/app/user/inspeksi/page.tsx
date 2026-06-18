'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/filter-dropdown'
import { DashboardMonthFilter } from '@/components/dashboard'
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
      report_ready: periodItems.filter((i) => i.status === 'report_ready').length,
      pendingRating: periodItems.filter((i) => i.canRate).length,
    }
  }, [items, period])

  const statusFilterOptions = useMemo((): FilterDropdownOption<StatusFilter>[] => {
    const periodItems = items.filter((i) => isDateInPeriod(i.createdAt, period))
    const countFor = (status?: InspectionUiStatus) =>
      status ? periodItems.filter((i) => i.status === status).length : periodItems.length

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
        tone: 'success',
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
      {
        id: 'rejected',
        label: statusConfig.rejected.label,
        tone: 'danger',
        icon: statusConfig.rejected.icon,
        count: countFor('rejected'),
      },
      {
        id: 'cancelled',
        label: statusConfig.cancelled.label,
        tone: 'danger',
        icon: statusConfig.cancelled.icon,
        count: countFor('cancelled'),
      },
    ]
  }, [items, period])

  const modeFilterOptions = useMemo((): FilterDropdownOption<ModeFilter>[] => {
    const periodItems = items.filter((i) => isDateInPeriod(i.createdAt, period))
    return [
      { id: 'all', label: 'Semua mode', tone: 'neutral', icon: MapPin },
      {
        id: 'ONLINE',
        label: 'Online',
        tone: 'info',
        icon: CheckSquare,
        count: periodItems.filter((i) => i.mode === 'ONLINE').length,
      },
      {
        id: 'OFFLINE',
        label: 'Offline',
        tone: 'neutral',
        icon: MapPin,
        count: periodItems.filter((i) => i.mode === 'OFFLINE').length,
      },
    ]
  }, [items, period])

  const ratingFilterOptions = useMemo((): FilterDropdownOption<RatingFilter>[] => {
    const periodItems = items.filter((i) => isDateInPeriod(i.createdAt, period))
    const rated = periodItems.filter((i) => i.ratingByUser != null).length
    const unrated = periodItems.filter((i) => i.canRate).length

    return [
      { id: 'all', label: 'Semua rating', tone: 'neutral', icon: Star },
      { id: 'rated', label: 'Sudah dinilai', tone: 'success', icon: Star, count: rated },
      { id: 'unrated', label: 'Belum dinilai', tone: 'warning', icon: Star, count: unrated },
    ]
  }, [items, period])

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Inspeksi</h1>
          <p className="mt-1 text-sm text-surface-500">
            Riwayat permintaan inspeksi pra-beli dengan teknisi bersertifikat
          </p>
          {stats.report_ready > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary-200/80 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-800">
              <CheckSquare className="h-3.5 w-3.5" />
              {stats.report_ready} laporan siap ditinjau
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardMonthFilter />
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button asChild variant="primary" size="sm" className="h-9">
            <Link href="/user/inspeksi/baru">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Inspeksi baru
            </Link>
          </Button>
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
            <p className="text-xs text-surface-500">Semua permintaan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.waiting}</div>
            <p className="text-xs text-surface-500">Belum diterima teknisi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berjalan</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.active}</div>
            <p className="text-xs text-surface-500">Sedang diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.completed}</div>
            <p className="text-xs text-surface-500">Inspeksi tuntas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Daftar Inspeksi</CardTitle>
          {!loading && items.length > 0 && (
            <span className="text-xs text-surface-500">{filteredItems.length} inspeksi</span>
          )}
        </CardHeader>
        <CardContent>
          {items.length > 0 && (
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
                options={modeFilterOptions}
                value={modeFilter}
                onChange={setModeFilter}
                ariaLabel="Filter mode inspeksi"
                label="Mode"
                triggerIcon={MapPin}
                placeholder="Semua mode"
                className="w-full sm:w-[10.5rem]"
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
                className="w-full sm:w-[11rem]"
                align="right"
                disabled={loading}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-surface-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Memuat inspeksi…
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="mx-auto h-10 w-10 text-surface-300" />
              <p className="mt-3 font-medium text-ink">Belum ada inspeksi</p>
              <p className="mt-1 text-sm text-surface-500">
                Verifikasi kondisi gadget sebelum membeli — online atau datang ke lokasi.
              </p>
              <Button asChild className="mt-4" variant="primary">
                <Link href="/user/inspeksi/baru">Buat permintaan pertama</Link>
              </Button>
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
        </CardContent>
      </Card>
    </div>
  )
}
