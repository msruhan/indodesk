'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
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
  Laptop,
  Copy,
  Lock,
  Shield,
} from '@/lib/icons'
import { DashboardMonthFilter } from '@/components/dashboard'
import { KonsultasiDetailModal } from '@/components/teknisi/konsultasi-detail-modal'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
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
type RemoteFilter = 'all' | 'remote' | 'no-remote'

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} disalin`)
  } catch {
    toast.error(`Gagal menyalin ${label.toLowerCase()}`)
  }
}

const statusConfig: Record<
  TeknisiKonsultasiStatus,
  { label: string; icon: typeof Clock }
> = {
  awaiting_payment: { label: 'Menunggu bayar', icon: Clock },
  pending: { label: 'Menunggu', icon: Clock },
  active: { label: 'Berjalan', icon: Radio },
  completed: { label: 'Selesai', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', icon: XCircle },
}

export default function TeknisiKonsultasiPage() {
  const { period } = useDashboardPeriod()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<TeknisiKonsultasiDto[]>([])
  const [stats, setStats] = useState<TeknisiKonsultasiStats>({
    total: 0,
    awaitingPayment: 0,
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

  useEffect(() => {
    if (searchParams.get('filter') === 'remote') {
      setRemoteFilter('remote')
    }
    if (searchParams.get('from') === 'remote-deprecated') {
      toast.info('Remote sekarang dikelola melalui menu Konsultasi.')
      router.replace('/teknisi/konsultasi', { scroll: false })
    }
  }, [searchParams, router])

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
        id: 'awaiting_payment',
        label: statusConfig.awaiting_payment.label,
        tone: 'warning',
        icon: statusConfig.awaiting_payment.icon,
        count: countFor('awaiting_payment'),
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

  const remoteFilterOptions = useMemo((): FilterDropdownOption<RemoteFilter>[] => {
    const remoteCount = items.filter((i) => i.requiresRemote).length
    const noRemoteCount = items.filter((i) => !i.requiresRemote).length

    return [
      { id: 'all', label: 'Semua tipe', tone: 'neutral', icon: MessageCircle },
      {
        id: 'remote',
        label: 'Termasuk remote',
        tone: 'info',
        icon: Laptop,
        count: remoteCount,
      },
      {
        id: 'no-remote',
        label: 'Tanpa remote',
        tone: 'neutral',
        icon: MessageCircle,
        count: noRemoteCount,
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
      if (!isDateInPeriod(item.createdAt, period)) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
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
  }, [items, period, query, statusFilter, remoteFilter, ratingFilter])

  const pendingRemoteCount = useMemo(
    () => items.filter((i) => i.requiresRemote && i.status === 'pending').length,
    [items],
  )

  const hasActiveFilters =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    remoteFilter !== 'all' ||
    ratingFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setRemoteFilter('all')
    setRatingFilter('all')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Konsultasi</h1>
          <p className="mt-1 text-sm text-surface-500">
            Kelola konsultasi dari user, termasuk sesi remote IndoDesk
          </p>
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
            <p className="text-xs text-surface-500">
              Menunggu
              {pendingRemoteCount > 0 ? ` · ${pendingRemoteCount} remote` : ''}
            </p>
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
                  options={remoteFilterOptions}
                  value={remoteFilter}
                  onChange={setRemoteFilter}
                  ariaLabel="Filter tipe konsultasi"
                  label="Tipe"
                  triggerIcon={Laptop}
                  placeholder="Semua tipe"
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
                            <div className="flex flex-wrap gap-1.5">
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
                                  disabled={actingId === k.id}
                                  onClick={() => void patchAction(k.id, 'complete')}
                                >
                                  Selesai
                                </Button>
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
        </CardContent>
      </Card>

      <KonsultasiDetailModal
        konsultasi={detailKonsultasi}
        onClose={() => setDetailKonsultasi(null)}
      />
    </div>
  )
}
