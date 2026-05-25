'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/filter-dropdown'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  MessageCircle,
  Clock,
  CheckCircle,
  Radio,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type {
  TeknisiKonsultasiDto,
  TeknisiKonsultasiStats,
  TeknisiKonsultasiStatus,
} from '@/lib/teknisi-layanan-serializer'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

function statusBadgeVariant(status: TeknisiKonsultasiDto['status']) {
  switch (status) {
    case 'completed':
      return 'success' as const
    case 'pending':
      return 'warning' as const
    case 'active':
      return 'default' as const
    case 'cancelled':
      return 'danger' as const
  }
}

type StatusFilter = TeknisiKonsultasiStatus | 'all'
type RatingFilter = 'all' | 'rated' | 'unrated'

const statusConfig: Record<
  TeknisiKonsultasiStatus,
  { label: string; icon: typeof Clock }
> = {
  pending: { label: 'Menunggu', icon: Clock },
  active: { label: 'Berjalan', icon: Radio },
  completed: { label: 'Selesai', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', icon: XCircle },
}

export default function TeknisiKonsultasiPage() {
  const [items, setItems] = useState<TeknisiKonsultasiDto[]>([])
  const [stats, setStats] = useState<TeknisiKonsultasiStats>({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teknisi/konsultasi')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat konsultasi')
        return
      }
      setItems(json.data.items)
      setStats(json.data.stats)
    } catch {
      setError('Gagal memuat konsultasi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchAction = async (id: string, action: 'start' | 'complete' | 'cancel') => {
    setActingId(id)
    try {
      const res = await fetch(`/api/teknisi/konsultasi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui konsultasi')
        return
      }
      await load()
    } catch {
      setError('Gagal memperbarui konsultasi')
    } finally {
      setActingId(null)
    }
  }

  const statusFilterOptions = useMemo((): FilterDropdownOption<StatusFilter>[] => {
    const countFor = (status?: TeknisiKonsultasiStatus) =>
      status ? items.filter((i) => i.status === status).length : items.length

    return [
      { id: 'all', label: 'Semua status', tone: 'neutral', icon: MessageCircle },
      {
        id: 'pending',
        label: statusConfig.pending.label,
        tone: 'warning',
        icon: statusConfig.pending.icon,
        count: countFor('pending'),
      },
      {
        id: 'active',
        label: statusConfig.active.label,
        tone: 'info',
        icon: statusConfig.active.icon,
        count: countFor('active'),
      },
      {
        id: 'completed',
        label: statusConfig.completed.label,
        tone: 'success',
        icon: statusConfig.completed.icon,
        count: countFor('completed'),
      },
      {
        id: 'cancelled',
        label: statusConfig.cancelled.label,
        tone: 'danger',
        icon: statusConfig.cancelled.icon,
        count: countFor('cancelled'),
      },
    ]
  }, [items])

  const ratingFilterOptions = useMemo((): FilterDropdownOption<RatingFilter>[] => {
    const rated = items.filter((i) => i.rating != null).length
    const unrated = items.filter((i) => i.status === 'completed' && i.rating == null).length

    return [
      { id: 'all', label: 'Semua rating', tone: 'neutral', icon: Star },
      { id: 'rated', label: 'Sudah dinilai', tone: 'success', icon: Star, count: rated },
      { id: 'unrated', label: 'Belum dinilai', tone: 'warning', icon: Star, count: unrated },
    ]
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (ratingFilter === 'rated' && item.rating == null) return false
      if (ratingFilter === 'unrated') {
        if (item.status !== 'completed' || item.rating != null) return false
      }
      if (!q) return true
      const haystack = [
        item.orderId,
        item.userName,
        item.userEmail ?? '',
        item.service,
        item.statusLabel,
        item.date,
        item.rating != null ? String(item.rating) : '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query, statusFilter, ratingFilter])

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
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Konsultasi</h1>
          <p className="mt-1 text-sm text-surface-500">Kelola konsultasi dari user</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-surface-500">Semua waktu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-surface-500">Menunggu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berjalan</CardTitle>
            <Radio className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-surface-500">Sedang berjalan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-surface-500">Selesai</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Konsultasi</CardTitle>
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
                    placeholder="Cari order, user, layanan..."
                    className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
                    disabled={loading}
                  />
                </div>
                <FilterDropdown
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel="Filter status konsultasi"
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
                  ariaLabel="Filter rating konsultasi"
                  label="Rating"
                  triggerIcon={Star}
                  placeholder="Semua rating"
                  className="w-full sm:w-[11.5rem]"
                  align="right"
                  disabled={loading}
                />
              </div>
              <p className="mb-3 text-[11px] text-surface-500">
                {loading ? 'Memuat…' : `${filteredItems.length} konsultasi`}
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
              Belum ada konsultasi. Order dari user akan muncul di sini.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-surface-600">Tidak ada konsultasi yang cocok dengan filter.</p>
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
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium whitespace-nowrap">{k.orderId}</TableCell>
                      <TableCell>{k.userName}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{k.service}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatPrice(k.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(k.status)}>{k.statusLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {k.rating ? (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{k.rating}</span>
                            <span className="text-yellow-400">★</span>
                          </div>
                        ) : (
                          <span className="text-surface-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-surface-600">{k.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {k.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={actingId === k.id}
                                onClick={() => void patchAction(k.id, 'start')}
                              >
                                Mulai
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actingId === k.id}
                                onClick={() => void patchAction(k.id, 'cancel')}
                              >
                                Batalkan
                              </Button>
                            </>
                          )}
                          {k.status === 'active' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={actingId === k.id}
                              onClick={() => void patchAction(k.id, 'complete')}
                            >
                              Selesai
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
    </div>
  )
}
