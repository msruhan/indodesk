'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  MessageCircle,
  Clock,
  CheckCircle,
  Radio,
  RefreshCw,
  Laptop,
  Copy,
  Lock,
  Shield,
} from '@/lib/icons'
import { DashboardMonthFilter, FilterSelect, MetricCard } from '@/components/dashboard'
import { KonsultasiDetailModal } from '@/components/teknisi/konsultasi-detail-modal'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useChat } from '@/contexts/chat-context'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import { cn } from '@/lib/utils'
import type { TeknisiKonsultasiDto } from '@/lib/teknisi-layanan-serializer'

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

type StatusTab = 'all' | 'pending' | 'active' | 'completed' | 'cancelled'
type RatingFilter = 'all' | 'rated' | 'unrated'
type RemoteFilter = 'all' | 'remote' | 'no-remote'

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'active', label: 'Berjalan' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} disalin`)
  } catch {
    toast.error(`Gagal menyalin ${label.toLowerCase()}`)
  }
}

export default function TeknisiKonsultasiPage() {
  const { period, label: periodLabel } = useDashboardPeriod()
  const router = useRouter()
  const confirmDialog = useConfirm()
  const { openChatWithPeer } = useChat()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<TeknisiKonsultasiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [remoteFilter, setRemoteFilter] = useState<RemoteFilter>('all')
  const [detailKonsultasi, setDetailKonsultasi] = useState<TeknisiKonsultasiDto | null>(null)

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
    if (searchParams.get('filter') === 'remote') {
      setRemoteFilter('remote')
    }
    if (searchParams.get('from') === 'remote-deprecated') {
      toast.info('Remote sekarang dikelola melalui menu Konsultasi.')
      router.replace('/teknisi/konsultasi', { scroll: false })
    }
  }, [searchParams, router])

  const patchAction = async (id: string, action: 'start' | 'mark-done' | 'cancel') => {
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

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const displayStats = useMemo(
    () => ({
      total: periodItems.length,
      pending: periodItems.filter(
        (i) => i.status === 'pending' || i.status === 'awaiting_payment',
      ).length,
      active: periodItems.filter(
        (i) => i.status === 'active' || i.status === 'awaiting_confirmation',
      ).length,
      completed: periodItems.filter((i) => i.status === 'completed').length,
    }),
    [periodItems],
  )

  const remoteFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Semua tipe' },
      { id: 'remote' as const, label: 'Termasuk remote' },
      { id: 'no-remote' as const, label: 'Tanpa remote' },
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
      if (statusTab === 'pending' && !['pending', 'awaiting_payment'].includes(item.status)) {
        return false
      }
      if (statusTab === 'active' && !['active', 'awaiting_confirmation'].includes(item.status)) {
        return false
      }
      if (statusTab === 'completed' && item.status !== 'completed') return false
      if (statusTab === 'cancelled' && item.status !== 'cancelled') return false
      if (remoteFilter === 'remote' && !item.requiresRemote) return false
      if (remoteFilter === 'no-remote' && item.requiresRemote) return false
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
  }, [items, period, query, statusTab, remoteFilter, ratingFilter])

  const pendingRemoteCount = useMemo(
    () => items.filter((i) => i.requiresRemote && i.status === 'pending').length,
    [items],
  )

  const hasActiveFilters =
    query.trim() !== '' ||
    statusTab !== 'all' ||
    remoteFilter !== 'all' ||
    ratingFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusTab('all')
    setRemoteFilter('all')
    setRatingFilter('all')
  }

  const openUserChat = (userId: string, chatHref: string) => {
    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    if (isDesktop) {
      openChatWithPeer(userId)
      return
    }
    router.push(chatHref)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Konsultasi</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Kelola konsultasi dari user, termasuk sesi remote IndoDesk
          </p>
          {pendingRemoteCount > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
              <Laptop className="h-3.5 w-3.5" />
              {pendingRemoteCount} remote menunggu
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
          value={displayStats.total.toLocaleString('id-ID')}
          icon={MessageCircle}
          footnote={periodLabel}
          tone="primary"
          compact
        />
        <MetricCard
          title="Menunggu"
          value={displayStats.pending.toLocaleString('id-ID')}
          icon={Clock}
          footnote="Perlu dimulai"
          tone={displayStats.pending > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Berjalan"
          value={displayStats.active.toLocaleString('id-ID')}
          icon={Radio}
          footnote="Sedang berjalan"
          tone="primary"
          compact
        />
        <MetricCard
          title="Selesai"
          value={displayStats.completed.toLocaleString('id-ID')}
          icon={CheckCircle}
          footnote="Konsultasi tuntas"
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
          placeholder="Cari order, user, layanan..."
          className="min-w-0 w-full flex-1 sm:min-w-[16rem]"
          inputClassName="h-9 text-xs"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FilterSelect
          options={remoteFilterOptions}
          value={remoteFilter}
          onChange={setRemoteFilter}
          ariaLabel="Filter tipe konsultasi"
          label="Tipe"
          className="w-full sm:w-[11.5rem]"
          disabled={loading}
        />
        <FilterSelect
          options={ratingFilterOptions}
          value={ratingFilter}
          onChange={setRatingFilter}
          ariaLabel="Filter rating konsultasi"
          label="Rating"
          className="w-full sm:w-[11.5rem]"
          disabled={loading}
        />
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${filteredItems.length} konsultasi ditampilkan`}
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
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-surface-400" />
            <p className="text-sm font-semibold text-ink">Belum ada konsultasi</p>
            <p className="mt-1 text-xs text-surface-500">Order dari user akan muncul di sini.</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="shadow-soft-xs">
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
                    <TableHead>Detail</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((k) => {
                    const showRemotePanel =
                      k.requiresRemote && (k.status === 'pending' || k.status === 'active')

                    return (
                      <Fragment key={k.id}>
                        <TableRow>
                          <TableCell className="font-medium whitespace-nowrap">{k.orderId}</TableCell>
                          <TableCell>{k.userName}</TableCell>
                          <TableCell className="max-w-[180px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate">{k.service}</span>
                              {k.requiresRemote && (
                                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                                  Remote
                                </Badge>
                              )}
                            </div>
                          </TableCell>
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
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => setDetailKonsultasi(k)}
                            >
                              Detail
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                aria-label={`Chat dengan ${k.userName}`}
                                onClick={() => openUserChat(k.userId, k.chatHref)}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                              {k.status === 'awaiting_payment' && (
                                <span className="text-[11px] text-amber-700">
                                  Menunggu pembayaran user
                                </span>
                              )}
                              {k.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={actingId === k.id || !k.canStart}
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
                                  disabled={actingId === k.id || !k.canMarkDone}
                                  onClick={async () => {
                                    const ok = await confirmDialog({
                                      title: 'Selesai melayani?',
                                      description:
                                        'User akan diminta konfirmasi. Dana cair setelah user setuju atau otomatis dalam 48 jam.',
                                      confirmLabel: 'Selesai melayani',
                                    })
                                    if (ok) void patchAction(k.id, 'mark-done')
                                  }}
                                >
                                  Selesai melayani
                                </Button>
                              )}
                              {k.status === 'awaiting_confirmation' && k.confirmDeadlineAt && (
                                <span className="text-[11px] text-amber-700">
                                  Menunggu konfirmasi user · batas{' '}
                                  {new Intl.DateTimeFormat('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }).format(new Date(k.confirmDeadlineAt))}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {showRemotePanel && (
                          <TableRow className="bg-surface-50/80 hover:bg-surface-50/80">
                            <TableCell colSpan={9} className="py-3">
                              <div className="flex flex-col gap-2 text-[12px] text-surface-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                {(k.device || k.clientOs) && (
                                  <span className="flex items-center gap-1.5">
                                    <Laptop className="h-3.5 w-3.5 text-surface-400" />
                                    {[k.device, k.clientOs].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                                {k.remoteId && (
                                  <span className="flex items-center gap-1.5 font-mono">
                                    <Shield className="h-3.5 w-3.5 text-primary-600" />
                                    IndoDesk ID: {k.remoteId}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => void copyText('ID', k.remoteId!)}
                                    >
                                      <Copy className="h-3 w-3" />
                                      Salin
                                    </Button>
                                  </span>
                                )}
                                {k.remoteOtp && (
                                  <span className="flex items-center gap-1.5 font-mono text-primary-700">
                                    <Lock className="h-3.5 w-3.5" />
                                    OTP: {k.remoteOtp}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => void copyText('OTP', k.remoteOtp!)}
                                    >
                                      <Copy className="h-3 w-3" />
                                      Salin
                                    </Button>
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
        </div>
      )}

      <KonsultasiDetailModal
        konsultasi={detailKonsultasi}
        onClose={() => setDetailKonsultasi(null)}
      />
    </div>
  )
}
