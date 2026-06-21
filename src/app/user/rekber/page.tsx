'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { Plus, RefreshCw, Search, Shield, Clock, CheckCircle } from '@/lib/icons'
import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { RekberComplaintForm } from '@/components/rekber/rekber-complaint-form'
import { useRekberList } from '@/hooks/use-rekber-list'
import {
  DashboardMonthFilter,
  DashboardPageHeader,
  FilterSelect,
  MetricCard,
} from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import type { RekberDto } from '@/lib/rekber-serializer'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'completed' | 'disputed'

const ACTIVE_STATUSES: RekberDto['status'][] = ['pending', 'held', 'processing', 'shipped']

function matchesStatusFilter(status: RekberDto['status'], filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'active') return ACTIVE_STATUSES.includes(status)
  if (filter === 'completed') return status === 'released'
  return status === 'disputed' || status === 'refunded'
}

export default function UserRekberPage() {
  const { period } = useDashboardPeriod()
  const {
    items,
    stats,
    loading,
    error,
    actingId,
    load,
    userAction,
    submitComplaint,
    respondComplaint,
    escalateComplaint,
    withdrawComplaint,
  } = useRekberList('/api/rekber')
  const [complaintOpenId, setComplaintOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const displayStats = useMemo(
    () => ({
      total: periodItems.length,
      active: periodItems.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
      completed: periodItems.filter((i) => i.status === 'released').length,
    }),
    [periodItems],
  )

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodItems.filter((item) => {
      if (!matchesStatusFilter(item.status, statusFilter)) return false
      if (!q) return true
      const haystack = [
        item.orderCode,
        item.buyerName,
        item.sellerName,
        item.description ?? '',
        item.statusLabel,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [periodItems, query, statusFilter])

  const statusOptions = [
    { id: 'all' as const, label: 'Semua status' },
    { id: 'active' as const, label: 'Aktif / diproses' },
    { id: 'completed' as const, label: 'Selesai' },
    { id: 'disputed' as const, label: 'Dispute / refund' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardPageHeader
        compact
        title="Transaksi Aman Saya"
        description="Transaksi aman dengan dana ditahan platform."
        actions={
          <>
            <DashboardMonthFilter />
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Link href="/rekber">
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Ajukan transaksi aman
              </Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {complaintOpenId && (
        <RekberComplaintForm
          onSubmit={(payload) => submitComplaint(complaintOpenId, payload)}
          onCancel={() => setComplaintOpenId(null)}
        />
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-3">
        <MetricCard
          title="Total"
          value={displayStats.total.toString()}
          icon={Shield}
          footnote="Semua transaksi"
          tone="primary"
          dense
        />
        <MetricCard
          title="Aktif"
          value={displayStats.active.toString()}
          icon={Clock}
          footnote="Sedang berjalan"
          tone={displayStats.active > 0 ? 'warning' : 'neutral'}
          dense
        />
        <MetricCard
          title="Selesai"
          value={displayStats.completed.toString()}
          icon={CheckCircle}
          footnote="Transaksi tuntas"
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
              placeholder="Cari kode, pembeli, penjual..."
              className="h-10 rounded-full bg-white pl-10 text-[12.5px]"
            />
          </div>
          <FilterSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter status transaksi aman"
            label="Status"
            className="w-full sm:w-[11.5rem]"
          />
        </div>

        <p className="mb-3 text-[11px] text-surface-500">
          {loading ? 'Memuat…' : `${filteredItems.length} transaksi`}
        </p>

        <RekberTransactionList
          items={filteredItems}
          stats={stats}
          loading={loading}
          actingId={actingId}
          showStats={false}
          emptyMessage={
            periodItems.length === 0
              ? 'Belum ada transaksi aman.'
              : 'Tidak ada transaksi yang cocok dengan filter.'
          }
          showEmptyCta={periodItems.length === 0}
          emptyCtaHref="/rekber"
          emptyCtaLabel="Ajukan transaksi aman baru"
          onUserAction={userAction}
          onOpenComplaint={(id) => setComplaintOpenId(id)}
          onRespondComplaint={(id) => {
            const response = window.prompt('Tulis respons komplain (min. 10 karakter):')
            if (!response) return
            void respondComplaint(id, response)
          }}
          onEscalateComplaint={(id) => void escalateComplaint(id)}
          onWithdrawComplaint={(id) => void withdrawComplaint(id)}
        />
      </div>
    </div>
  )
}
