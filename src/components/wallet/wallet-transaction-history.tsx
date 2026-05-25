'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { periodToQuery } from '@/lib/dashboard-period'
import {
  categoryMeta,
  formatTransactionAmount,
  formatTransactionDate,
  transactionFilterOptions,
  type TransactionFilter,
  type UnifiedTransaction,
} from '@/lib/wallet-transactions'
import { DataPagination } from '@/components/ui/data-pagination'
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from '@/lib/pagination'
import { WalletTransactionDetailModal } from '@/components/wallet/wallet-transaction-detail-modal'
import {
  Package,
  RefreshCw,
  ShoppingBag,
  Unlock,
  Wallet,
} from '@/lib/icons'

const categoryIcons = {
  wallet: Wallet,
  shop: ShoppingBag,
  topup: RefreshCw,
  imei: Unlock,
  server: Package,
} as const

function statusVariant(
  status: string,
  category: UnifiedTransaction['category'],
): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const s = status.toUpperCase()
  if (['SUCCESS', 'COMPLETED', 'PAID', 'SHIPPED'].includes(s)) return 'success'
  if (['REFUND', 'EARNING', 'CASHBACK', 'TOPUP'].includes(s) && category === 'wallet') {
    return 'success'
  }
  if (['REJECTED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(s)) return 'danger'
  if (['PENDING', 'PENDING_PAYMENT', 'IN_PROCESS', 'PROCESSING', 'FULFILLING'].includes(s)) {
    return 'warning'
  }
  return 'info'
}

type WalletTransactionHistoryProps = {
  onTransactionsLoaded?: () => void
}

export function WalletTransactionHistory({ onTransactionsLoaded }: WalletTransactionHistoryProps = {}) {
  const { period, label: periodLabel } = useDashboardPeriod()
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [counts, setCounts] = useState<Record<TransactionFilter, number>>({
    all: 0,
    wallet: 0,
    shop: 0,
    topup: 0,
    imei: 0,
    server: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('category', filter)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const { year, month } = periodToQuery(period)
      params.set('year', year)
      params.set('month', month)
      const res = await fetch(`/api/wallet/transactions?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat riwayat')
        setTransactions([])
        return
      }
      setTransactions(json.data.transactions ?? [])
      if (json.data.counts) setCounts(json.data.counts)
      setTotalItems(json.data.pagination?.total ?? json.data.transactions?.length ?? 0)
      onTransactionsLoaded?.()
    } catch {
      setError('Koneksi gagal')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [filter, period, onTransactionsLoaded, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filter, period, pageSize])

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Riwayat Transaksi</h3>
            <p className="mt-0.5 text-xs text-surface-500 capitalize">
              Periode {periodLabel} · shop, topup, perangkat, server, saldo
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-surface-200 px-2.5 py-1.5 text-[11px] font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {transactionFilterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
                filter === opt.id
                  ? 'bg-primary-600 text-white shadow-soft-sm'
                  : 'border border-surface-200/70 bg-white text-surface-700 hover:bg-surface-50',
              )}
            >
              {opt.label}
              {counts[opt.id] > 0 && (
                <span className={cn('ml-1', filter === opt.id ? 'text-white/80' : 'text-surface-400')}>
                  ({counts[opt.id]})
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
            ))
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-200 bg-surface-50 px-4 py-8 text-center">
              <p className="text-sm text-surface-500">Belum ada transaksi</p>
              <p className="mt-1 text-xs text-surface-400">
                Order shop, topup, perangkat, atau server akan muncul di sini
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const meta = categoryMeta[tx.category]
              const Icon = categoryIcons[tx.category]
              const variant = statusVariant(tx.status, tx.category)
              const row = (
                <button
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border border-surface-200/70 p-3 text-left transition-colors',
                    'cursor-pointer hover:border-primary-200 hover:bg-primary-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                      meta.bg,
                    )}
                  >
                    <Icon className={cn('h-4 w-4', meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[12px] font-semibold text-ink">{tx.title}</p>
                      <Badge variant="default" className="text-[8px] px-1 py-0">
                        {meta.label}
                      </Badge>
                      <Badge variant={variant} className="text-[8px] px-1 py-0">
                        {tx.statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-surface-500">{tx.orderCode}</p>
                    {tx.subtitle && (
                      <p className="mt-0.5 truncate text-[10px] text-surface-400">{tx.subtitle}</p>
                    )}
                    <p className="mt-1 text-[10px] text-surface-400">
                      {formatTransactionDate(tx.createdAt)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'flex-shrink-0 text-[12px] font-bold tabular-nums',
                      tx.amount >= 0 ? 'text-emerald-600' : 'text-ink',
                    )}
                  >
                    {formatTransactionAmount(tx.amount)}
                  </p>
                </button>
              )
              return <div key={tx.id}>{row}</div>
            })
          )}
        </div>

        <WalletTransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
        {!loading && totalItems > 0 && (
          <DataPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            className="mt-4"
          />
        )}
      </CardContent>
    </Card>
  )
}
