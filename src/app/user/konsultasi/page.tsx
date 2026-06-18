'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
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
import {
  DashboardMonthFilter,
  DashboardPageHeader,
  FilterSelect,
  MetricCard,
} from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
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
    case 'awaiting_payment':
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
  awaiting_payment: { label: 'Menunggu bayar', variant: 'warning', icon: Clock },
  pending: { label: 'Menunggu', variant: 'warning', icon: Clock },
  active: { label: 'Berjalan', variant: 'default', icon: Radio },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: XCircle },
}

export default function UserKonsultasiPage() {
  const { period } = useDashboardPeriod()
  const searchParams = useSearchParams()
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

  useEffect(() => {
    const paySession = searchParams.get('paySession')
    const pgRef = searchParams.get('pgRef')
    if (!paySession || !pgRef) return

    void (async () => {
      setActingId(paySession)
      try {
        const res = await fetch(`/api/user/konsultasi/${paySession}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm-payment', pgExternalRef: pgRef }),
        })
        const json = await res.json()
        if (!json.success) {
          setError(json.error || 'Gagal mengonfirmasi pembayaran')
          return
        }
        window.history.replaceState({}, '', '/user/konsultasi')
        await load()
      } catch {
        setError('Gagal mengonfirmasi pembayaran')
      } finally {
        setActingId(null)
      }
    })()
  }, [searchParams, load])

  const patchAction = async (
    id: string,
    body:
      | { action: 'cancel' }
      | { action: 'rate'; rating: number; review?: string }
      | { action: 'confirm-payment'; pgExternalRef?: string },
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

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const stats = useMemo(
    () => ({
      total: periodItems.length,
      active: periodItems.filter(
        (i) =>
          i.status === 'pending' ||
          i.status === 'awaiting_payment' ||
          i.status === 'active',
      ).length,
      completed: periodItems.filter((i) => i.status === 'completed').length,
      pendingRating: periodItems.filter((i) => i.canRate).length,
    }),
    [periodItems],
  )

  const statusFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Semua status' },
      { id: 'pending' as const, label: statusConfig.pending.label },
      { id: 'awaiting_payment' as const, label: statusConfig.awaiting_payment.label },
      { id: 'active' as const, label: statusConfig.active.label },
      { id: 'completed' as const, label: statusConfig.completed.label },
      { id: 'cancelled' as const, label: statusConfig.cancelled.label },
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
      <DashboardPageHeader
        title="Konsultasi"
        description="Riwayat konsultasi dengan teknisi."
        actions={
          <>
            <DashboardMonthFilter />
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Link href="/teknisi">
              <Button size="sm">Cari teknisi</Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats.pendingRating > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Beri rating teknisi</strong> — Anda punya {stats.pendingRating} konsultasi selesai yang
          belum dinilai. Scroll ke daftar di bawah dan klik &quot;Beri rating&quot;.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={stats.total.toString()}
          icon={MessageCircle}
          footnote="Semua konsultasi"
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
          footnote="Konsultasi tuntas"
          tone="primary"
          compact
        />
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className={cn(searchInputIconClass, 'left-3.5')} strokeWidth={2} aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, teknisi, layanan, ulasan..."
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
            />
          </div>
          <FilterSelect
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter status konsultasi"
            label="Status"
            className="w-full sm:w-[11.5rem]"
          />
          <FilterSelect
            options={ratingFilterOptions}
            value={ratingFilter}
            onChange={setRatingFilter}
            ariaLabel="Filter rating konsultasi"
            label="Rating"
            className="w-full sm:w-[11.5rem]"
          />
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat…' : `${filteredItems.length} konsultasi`}
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20 p-4" />
              </Card>
            ))}
          </div>
        ) : periodItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-surface-300" />
              <p className="text-sm text-surface-600">Belum ada konsultasi.</p>
              <Link href="/teknisi" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Jelajahi teknisi
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-surface-600">Tidak ada konsultasi yang cocok dengan filter.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
                  Reset filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 sm:p-0">
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
                        {k.canConfirmPayment && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            disabled={actingId === k.id}
                            onClick={() =>
                              void patchAction(k.id, { action: 'confirm-payment' })
                            }
                          >
                            Konfirmasi bayar
                          </Button>
                        )}
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
