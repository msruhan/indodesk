'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  Star,
  RefreshCw,
  Search,
  XCircle,
  Radio,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { UserKonsultasiDto } from '@/lib/user-konsultasi-serializer'
import type { TeknisiKonsultasiStatus } from '@/lib/teknisi-layanan-serializer'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)

function statusBadgeVariant(status: UserKonsultasiDto['status']) {
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
  { label: string; variant: 'warning' | 'success' | 'danger' | 'default'; icon: typeof Clock }
> = {
  pending: { label: 'Menunggu', variant: 'warning', icon: Clock },
  active: { label: 'Berjalan', variant: 'default', icon: Radio },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: XCircle },
}

export default function UserKonsultasiPage() {
  const [items, setItems] = useState<UserKonsultasiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [ratingId, setRatingId] = useState<string | null>(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/konsultasi')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat konsultasi')
        return
      }
      setItems(json.data ?? [])
    } catch {
      setError('Gagal memuat konsultasi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchAction = async (
    id: string,
    body: { action: 'cancel' } | { action: 'rate'; rating: number; review?: string },
  ) => {
    setActingId(id)
    try {
      const res = await fetch(`/api/user/konsultasi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memperbarui konsultasi')
        return
      }
      setRatingId(null)
      setReviewText('')
      await load()
    } catch {
      setError('Gagal memperbarui konsultasi')
    } finally {
      setActingId(null)
    }
  }

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      active: items.filter((i) => i.status === 'active').length,
      completed: items.filter((i) => i.status === 'completed').length,
    }),
    [items],
  )

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
        item.teknisiName,
        item.service,
        item.statusLabel,
        item.review ?? '',
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
          <p className="mt-1 text-sm text-surface-500">Riwayat konsultasi dengan teknisi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Link href="/teknisi">
            <Button variant="primary" size="sm" className="h-9">
              Cari Teknisi
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berjalan</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending + stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Konsultasi</CardTitle>
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
                    placeholder="Cari kode, teknisi, layanan, ulasan..."
                    className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
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
                />
              </div>
              <p className="mb-3 text-[11px] text-surface-500">
                {loading ? 'Memuat…' : `${filteredItems.length} konsultasi`}
              </p>
            </>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-surface-500">Memuat…</p>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-ink">Belum ada konsultasi</p>
              <p className="mt-1 text-xs text-surface-500">
                Pesan konsultasi dari profil teknisi favorit Anda
              </p>
              <Link href="/teknisi">
                <Button variant="primary" size="sm" className="mt-4">
                  Jelajahi Teknisi
                </Button>
              </Link>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.teknisiName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{k.service}</TableCell>
                    <TableCell>{formatPrice(k.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(k.status)}>{k.statusLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      {k.rating != null ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {k.rating}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Link href={k.chatHref}>
                          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]">
                            Chat
                          </Button>
                        </Link>
                        {k.canCancel && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-rose-600"
                            disabled={actingId === k.id}
                            onClick={() => void patchAction(k.id, { action: 'cancel' })}
                          >
                            Batal
                          </Button>
                        )}
                        {k.canRate && ratingId !== k.id && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                              setRatingId(k.id)
                              setRatingValue(5)
                              setReviewText('')
                            }}
                          >
                            Rating
                          </Button>
                        )}
                      </div>
                      {ratingId === k.id && (
                        <div className="mt-2 space-y-2 rounded-lg border border-surface-200 p-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setRatingValue(n)}
                                className="p-0.5"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    n <= ratingValue
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-surface-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <Input
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Ulasan (opsional)"
                            className="h-8 text-xs"
                          />
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-[10px]"
                              disabled={actingId === k.id}
                              onClick={() =>
                                void patchAction(k.id, {
                                  action: 'rate',
                                  rating: ratingValue,
                                  review: reviewText.trim() || undefined,
                                })
                              }
                            >
                              Kirim
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => setRatingId(null)}
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
