'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { RefreshCw, Shield, Clock, CheckCircle, AlertCircle } from '@/lib/icons'
import { RekberTransactionList } from '@/components/rekber/rekber-transaction-list'
import { useRekberList } from '@/hooks/use-rekber-list'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'
import type { RekberDto } from '@/lib/rekber-serializer'
import { cn } from '@/lib/utils'

type StatusTab = 'all' | 'active' | 'completed' | 'disputed'

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'active', label: 'Aktif' },
  { id: 'completed', label: 'Selesai' },
  { id: 'disputed', label: 'Dispute' },
]

const ACTIVE_STATUSES: RekberDto['status'][] = ['pending', 'held', 'processing', 'shipped']

function matchesStatusTab(status: RekberDto['status'], tab: StatusTab) {
  if (tab === 'all') return true
  if (tab === 'active') return ACTIVE_STATUSES.includes(status)
  if (tab === 'completed') return status === 'released'
  return status === 'disputed' || status === 'refunded'
}

export default function TeknisiRekberPage() {
  const { period, label: periodLabel } = useDashboardPeriod()
  const {
    items,
    stats,
    loading,
    error,
    actingId,
    load,
    respondComplaint,
    escalateComplaint,
    withdrawComplaint,
    advanceRekber,
    setShipment,
  } = useRekberList('/api/rekber')
  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')

  const periodItems = useMemo(
    () => items.filter((i) => isDateInPeriod(i.createdAt, period)),
    [items, period],
  )

  const displayStats = useMemo(
    () => ({
      total: periodItems.length,
      held: periodItems.filter((i) => i.status === 'held' || i.status === 'processing').length,
      released: periodItems.filter((i) => i.status === 'released').length,
      disputed: periodItems.filter((i) => i.status === 'disputed' || i.status === 'refunded').length,
    }),
    [periodItems],
  )

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodItems.filter((item) => {
      if (!matchesStatusTab(item.status, statusTab)) return false
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
  }, [periodItems, query, statusTab])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Transaksi Aman (Penjual)</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Pantau transaksi aman sebagai penjual
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Total"
          value={displayStats.total.toLocaleString('id-ID')}
          icon={Shield}
          footnote={periodLabel}
          tone="primary"
          compact
        />
        <MetricCard
          title="Ditahan"
          value={displayStats.held.toLocaleString('id-ID')}
          icon={Clock}
          footnote="Dana / proses"
          tone={displayStats.held > 0 ? 'warning' : 'neutral'}
          compact
        />
        <MetricCard
          title="Selesai"
          value={displayStats.released.toLocaleString('id-ID')}
          icon={CheckCircle}
          footnote="Transaksi tuntas"
          tone="primary"
          compact
        />
        <MetricCard
          title="Dispute"
          value={displayStats.disputed.toLocaleString('id-ID')}
          icon={AlertCircle}
          footnote="Perlu perhatian"
          tone={displayStats.disputed > 0 ? 'warning' : 'neutral'}
          compact
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

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
          placeholder="Cari kode, pembeli, deskripsi..."
          className="min-w-0 w-full flex-1 sm:min-w-[16rem]"
          inputClassName="h-9 text-xs"
        />
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${filteredItems.length} transaksi ditampilkan`}
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
        onRefresh={() => void load()}
        onRespondComplaint={(id) => {
          const response = window.prompt('Tulis respons komplain (min. 10 karakter):')
          if (!response) return
          void respondComplaint(id, response)
        }}
        onEscalateComplaint={(id) => void escalateComplaint(id)}
        onWithdrawComplaint={(id) => void withdrawComplaint(id)}
        onAdvance={advanceRekber}
        onSetShipment={(id, courier, trackingNumber) =>
          void setShipment(id, courier, trackingNumber)
        }
      />
    </div>
  )
}
