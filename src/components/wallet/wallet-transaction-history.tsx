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
  formatIdr,
  transactionFilterOptions,
  type TransactionFilter,
  type UnifiedTransaction,
} from '@/lib/wallet-transactions'
import { DataPagination } from '@/components/ui/data-pagination'
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from '@/lib/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WalletTransactionDetailModal } from '@/components/wallet/wallet-transaction-detail-modal'
import {
  RefreshCw,
} from '@/lib/icons'

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
    konsultasi: 0,
    inspeksi: 0,
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
      <CardContent className="p-2.5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h3 className="text-xs font-semibold text-ink sm:text-sm">Riwayat Transaksi</h3>
            <p className="mt-0.5 text-[10px] text-surface-500 capitalize sm:text-xs">
              Periode {periodLabel} · shop, topup, perangkat, server, konsultasi, inspeksi, saldo
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 self-start rounded-lg border border-surface-200 px-2 py-1 text-[10px] font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="mt-2 flex gap-1 overflow-x-auto scrollbar-hide pb-1 sm:mt-3 sm:gap-1.5">
          {transactionFilterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-[11px]',
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

        <div className="mt-3 sm:mt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-100 sm:h-12" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-200 bg-surface-50 px-3 py-6 text-center sm:px-4 sm:py-8">
              <p className="text-xs text-surface-500 sm:text-sm">Belum ada transaksi</p>
              <p className="mt-1 text-[10px] text-surface-400 sm:text-xs">
                Order shop, topup, perangkat, server, konsultasi, atau inspeksi akan muncul di sini
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 md:hidden">
                {transactions.map((tx) => {
                  const meta = categoryMeta[tx.category]
                  const variant = statusVariant(tx.status, tx.category)
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      className="w-full rounded-xl border border-surface-200/70 bg-white p-2.5 text-left transition-colors hover:bg-surface-50/80"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] text-surface-500">
                          {formatTransactionDate(tx.createdAt)}
                        </p>
                        <p
                          className={cn(
                            'shrink-0 text-[11px] font-bold tabular-nums',
                            tx.amount >= 0 ? 'text-emerald-600' : 'text-ink',
                          )}
                        >
                          {formatTransactionAmount(tx.amount)}
                        </p>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-ink">{tx.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <Badge variant="default" className="px-1 py-0 text-[8px]">
                          {meta.label}
                        </Badge>
                        <Badge variant={variant} className="px-1 py-0 text-[8px]">
                          {tx.statusLabel}
                        </Badge>
                      </div>
                      {tx.subtitle ? (
                        <p className="mt-0.5 line-clamp-1 text-[9px] text-surface-500">{tx.subtitle}</p>
                      ) : null}
                      {tx.orderCode ? (
                        <p className="mt-0.5 font-mono text-[9px] text-surface-400">{tx.orderCode}</p>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[130px]">Tanggal</TableHead>
                  <TableHead className="min-w-[220px]">Aktivitas</TableHead>
                  <TableHead className="min-w-[120px]">Kode</TableHead>
                  <TableHead className="min-w-[110px] text-right">Nominal</TableHead>
                  <TableHead className="min-w-[120px] text-right">Saldo Sebelum</TableHead>
                  <TableHead className="min-w-[120px] text-right">Saldo Sesudah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const meta = categoryMeta[tx.category]
                  const variant = statusVariant(tx.status, tx.category)
                  return (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-primary-50/40"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <TableCell className="align-top text-xs text-surface-600">
                        {formatTransactionDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-ink">{tx.title}</p>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="default" className="px-1 py-0 text-[8px]">
                              {meta.label}
                            </Badge>
                            <Badge variant={variant} className="px-1 py-0 text-[8px]">
                              {tx.statusLabel}
                            </Badge>
                          </div>
                          {tx.subtitle ? (
                            <p className="text-[10px] text-surface-500">{tx.subtitle}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top font-mono text-[10px] text-surface-500">
                        {tx.orderCode}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'align-top text-right text-xs font-bold tabular-nums',
                          tx.amount >= 0 ? 'text-emerald-600' : 'text-ink',
                        )}
                      >
                        {formatTransactionAmount(tx.amount)}
                      </TableCell>
                      <TableCell className="align-top text-right text-xs tabular-nums text-surface-600">
                        {tx.balanceBefore != null ? formatIdr(tx.balanceBefore) : '—'}
                      </TableCell>
                      <TableCell className="align-top text-right text-xs font-semibold tabular-nums text-ink">
                        {tx.balanceAfter != null ? formatIdr(tx.balanceAfter) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
              </div>
            </>
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
