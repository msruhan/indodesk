'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { DashboardMonthFilter, MetricCard } from '@/components/dashboard'
import { Download, Plus, TrendingUp, TrendingDown, Wallet } from '@/lib/icons'
import { WalletTopupModal } from '@/components/wallet/wallet-topup-modal'
import { WalletWithdrawModal } from '@/components/wallet/wallet-withdraw-modal'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { periodToQuery } from '@/lib/dashboard-period'
import { formatIdr } from '@/lib/wallet-transactions'
import { WalletTransactionHistory } from '@/components/wallet/wallet-transaction-history'

export function TeknisiSaldoView() {
  const { period } = useDashboardPeriod()
  const { wallet, isLoading } = useWallet()
  const [showTopup, setShowTopup] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [totalSpending, setTotalSpending] = useState(0)
  const [spendingCount, setSpendingCount] = useState(0)
  const [spendingLoading, setSpendingLoading] = useState(true)

  const loadSpendingSummary = useCallback(async () => {
    setSpendingLoading(true)
    try {
      const q = new URLSearchParams({ limit: '1', ...periodToQuery(period) })
      const res = await fetch(`/api/wallet/transactions?${q}`, { cache: 'no-store' })
      const json = (await res.json()) as {
        success?: boolean
        data?: { totalSpending?: number; spendingCount?: number }
      }
      if (res.ok && json.success && json.data) {
        setTotalSpending(json.data.totalSpending ?? 0)
        setSpendingCount(json.data.spendingCount ?? 0)
      }
    } catch {
      setTotalSpending(0)
      setSpendingCount(0)
    } finally {
      setSpendingLoading(false)
    }
  }, [period])

  useEffect(() => {
    void loadSpendingSummary()
  }, [loadSpendingSummary])

  const balance = wallet ? parseFloat(wallet.balance) : 0
  const pendingEarnings = wallet?.pendingEarnings ? parseFloat(wallet.pendingEarnings) : 0
  const heldBalance = wallet?.heldBalance ? parseFloat(wallet.heldBalance) : 0
  const formattedBalance = formatIdr(balance)
  const updatedLabel = wallet
    ? `Update: ${new Date(wallet.updatedAt).toLocaleDateString('id-ID')}`
    : 'Update: -'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Saldo & Transaksi</h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Kelola saldo Anda dan lihat riwayat transaksi
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <DashboardMonthFilter className="self-start sm:self-auto" />
          <Button onClick={() => setShowTopup(true)} variant="primary" size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Topup Saldo
          </Button>
          <Button
            onClick={() => setShowWithdraw(true)}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={isLoading || balance <= 0}
          >
            <Download className="h-4 w-4" />
            Tarik Saldo
          </Button>
        </div>
      </div>

      {/* Metrics — mobile: saldo full width, deposit & pengeluaran 2 kolom; desktop: 3 kolom */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <MetricCard
            title="Saldo Anda"
            value={isLoading ? '…' : formattedBalance}
            icon={Wallet}
            footnote={updatedLabel}
            compact
            dense
          />
        </div>
        <div className="min-w-0">
          <MetricCard
            title="Total Deposit"
            value={isLoading ? '…' : formattedBalance}
            icon={TrendingUp}
            footnote="Akumulasi topup"
            compact
            dense
          />
        </div>
        <div className="min-w-0">
          <MetricCard
            title="Pengeluaran"
            value={spendingLoading ? '…' : formatIdr(totalSpending)}
            icon={TrendingDown}
            footnote={spendingLoading ? '…' : `${spendingCount} transaksi`}
            tone="warning"
            compact
            dense
          />
        </div>
      </div>

      {(pendingEarnings > 0 || heldBalance > 0) && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {pendingEarnings > 0 && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-xs">
              <p className="font-medium text-amber-900">Pendapatan menunggu</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-amber-950">
                {formatIdr(pendingEarnings)}
              </p>
              <p className="mt-0.5 text-amber-800/80">
                Masuk ke saldo setelah pembeli konfirmasi pesanan selesai.
              </p>
            </div>
          )}
        </div>
      )}

      <WalletTransactionHistory onTransactionsLoaded={loadSpendingSummary} />

      <AnimatePresence>
        {showTopup && (
          <WalletTopupModal
            onClose={() => setShowTopup(false)}
            onSuccess={() => {
              setShowTopup(false)
              void loadSpendingSummary()
            }}
          />
        )}
        {showWithdraw && (
          <WalletWithdrawModal
            onClose={() => setShowWithdraw(false)}
            onSuccess={() => {
              setShowWithdraw(false)
              void loadSpendingSummary()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
