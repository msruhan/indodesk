'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  MetricCard,
} from '@/components/dashboard'
import { FilterGroupSheet } from '@/components/ui/filter-group-sheet'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import { cn } from '@/lib/utils'
import type { UserKonsultasiDto } from '@/lib/user-konsultasi-serializer'
import type { TeknisiKonsultasiStatus } from '@/lib/teknisi-layanan-serializer'
import { TripayChannelPicker } from '@/components/payments/tripay-channel-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'

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
    case 'awaiting_confirmation':
      return 'warning' as const
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
  awaiting_confirmation: {
    label: 'Menunggu konfirmasi',
    variant: 'warning',
    icon: Clock,
  },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: XCircle },
}

type KonsultasiItemActionsProps = {
  k: UserKonsultasiDto
  actingId: string | null
  ratingId: string | null
  ratingValue: number
  reviewText: string
  confirmDialog: (opts: {
    title: string
    description: string
    confirmLabel: string
  }) => Promise<boolean>
  patchAction: (
    id: string,
    body:
      | { action: 'cancel' }
      | { action: 'confirm-complete' }
      | { action: 'rate'; rating: number; review?: string }
      | { action: 'confirm-payment'; pgExternalRef?: string },
  ) => Promise<void>
  setRatingId: (id: string | null) => void
  setRatingValue: (value: number) => void
  setReviewText: (text: string) => void
  setChannelPaySession: (k: UserKonsultasiDto | null) => void
  compact?: boolean
}

function KonsultasiItemActions({
  k,
  actingId,
  ratingId,
  ratingValue,
  reviewText,
  confirmDialog,
  patchAction,
  setRatingId,
  setRatingValue,
  setReviewText,
  setChannelPaySession,
  compact = false,
}: KonsultasiItemActionsProps) {
  const btnClass = compact ? 'h-6 px-1.5 text-[9px]' : 'h-7 px-2 text-[10px]'

  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Link href={k.chatHref}>
          <Button type="button" variant="outline" size="sm" className={btnClass}>
            Chat
          </Button>
        </Link>
        {k.canConfirmComplete && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={btnClass}
            disabled={actingId === k.id}
            onClick={async () => {
              const ok = await confirmDialog({
                title: 'Konfirmasi selesai?',
                description: 'Dana akan dicairkan ke teknisi. Pastikan layanan sudah sesuai.',
                confirmLabel: 'Konfirmasi selesai',
              })
              if (ok) void patchAction(k.id, { action: 'confirm-complete' })
            }}
          >
            Konfirmasi selesai
          </Button>
        )}
        {k.canConfirmComplete && k.confirmDeadlineAt && (
          <span className={cn('w-full text-surface-700', compact ? 'text-[9px]' : 'text-[10px] text-amber-700')}>
            Otomatis selesai{' '}
            {new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(k.confirmDeadlineAt))}
          </span>
        )}
        {k.canConfirmPayment && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={btnClass}
            disabled={actingId === k.id}
            onClick={() => void patchAction(k.id, { action: 'confirm-payment' })}
          >
            Konfirmasi bayar
          </Button>
        )}
        {k.payHref && (
          <Link href={k.payHref}>
            <Button type="button" variant="primary" size="sm" className={btnClass}>
              Lanjutkan bayar
            </Button>
          </Link>
        )}
        {k.needsChannelPayment && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={btnClass}
            onClick={() => setChannelPaySession(k)}
          >
            Bayar sekarang
          </Button>
        )}
        {k.canCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(btnClass, 'text-rose-600')}
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
            className={btnClass}
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
        <div
          className={cn(
            'space-y-1.5 rounded-lg border border-surface-200',
            compact ? 'mt-1.5 p-1.5' : 'mt-2 p-2',
          )}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRatingValue(n)} className="p-0.5">
                <Star
                  className={cn(
                    compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    n <= ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-surface-300',
                  )}
                />
              </button>
            ))}
          </div>
          <Input
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ulasan (opsional)"
            className={cn(compact ? 'h-7 text-[10px]' : 'h-8 text-xs')}
          />
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              className={btnClass}
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
              className={btnClass}
              onClick={() => setRatingId(null)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function UserKonsultasiPage() {
  const router = useRouter()
  const confirmDialog = useConfirm()
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
  const [channelPaySession, setChannelPaySession] = useState<UserKonsultasiDto | null>(null)

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
      | { action: 'confirm-complete' }
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
          i.status === 'active' ||
          i.status === 'awaiting_confirmation',
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
      { id: 'awaiting_confirmation' as const, label: statusConfig.awaiting_confirmation.label },
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
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        compact
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:px-4 sm:py-3 sm:text-sm">
          <strong>Beri rating teknisi</strong> — Anda punya {stats.pendingRating} konsultasi selesai yang
          belum dinilai. Scroll ke daftar di bawah dan klik &quot;Beri rating&quot;.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={stats.total.toString()}
          icon={MessageCircle}
          footnote="Semua konsultasi"
          tone="primary"
          dense
        />
        <MetricCard
          title="Aktif"
          value={stats.active.toString()}
          icon={Clock}
          footnote="Sedang berjalan"
          tone={stats.active > 0 ? 'warning' : 'neutral'}
          dense
        />
        <MetricCard
          title="Selesai"
          value={stats.completed.toString()}
          icon={CheckCircle}
          footnote="Konsultasi tuntas"
          tone="primary"
          dense
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
          <FilterGroupSheet
            groups={[
              {
                id: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: (value) => setStatusFilter(value as StatusFilter),
                options: statusFilterOptions,
              },
              {
                id: 'rating',
                label: 'Rating',
                value: ratingFilter,
                onChange: (value) => setRatingFilter(value as RatingFilter),
                options: ratingFilterOptions,
              },
            ]}
            onReset={() => {
              setStatusFilter('all')
              setRatingFilter('all')
            }}
            disabled={loading}
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
          <>
            <div className="space-y-2 md:hidden">
              {filteredItems.map((k) => (
                <Card key={k.id} className="shadow-soft-xs">
                  <CardContent className="space-y-2 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{k.teknisiName}</p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-surface-600">
                          {k.service}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(k.status)} className="shrink-0 text-[9px]">
                        {k.statusLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-semibold tabular-nums text-primary-700">
                        {formatPrice(k.amount)}
                      </span>
                      {k.rating != null ? (
                        <span className="flex items-center gap-0.5 text-surface-700">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {k.rating}
                        </span>
                      ) : (
                        <span className="text-surface-400">Belum rating</span>
                      )}
                    </div>
                    <KonsultasiItemActions
                      k={k}
                      actingId={actingId}
                      ratingId={ratingId}
                      ratingValue={ratingValue}
                      reviewText={reviewText}
                      confirmDialog={confirmDialog}
                      patchAction={patchAction}
                      setRatingId={setRatingId}
                      setRatingValue={setRatingValue}
                      setReviewText={setReviewText}
                      setChannelPaySession={setChannelPaySession}
                      compact
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
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
                      <KonsultasiItemActions
                        k={k}
                        actingId={actingId}
                        ratingId={ratingId}
                        ratingValue={ratingValue}
                        reviewText={reviewText}
                        confirmDialog={confirmDialog}
                        patchAction={patchAction}
                        setRatingId={setRatingId}
                        setRatingValue={setRatingValue}
                        setReviewText={setReviewText}
                        setChannelPaySession={setChannelPaySession}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
          </Card>
          </>
        )}
      </div>

      {channelPaySession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">Bayar Konsultasi</h3>
            <p className="mt-1 text-xs text-surface-500">
              {channelPaySession.service} — {formatPrice(channelPaySession.amount)}
            </p>
            <div className="mt-4">
              <TripayChannelPicker
                purpose="KONSULTASI"
                targetId={channelPaySession.id}
                submitLabel={`Bayar ${formatPrice(channelPaySession.amount)}`}
                onCancel={() => setChannelPaySession(null)}
                onSuccess={(merchantRef) => {
                  setChannelPaySession(null)
                  router.push(`/payments/${merchantRef}`)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
