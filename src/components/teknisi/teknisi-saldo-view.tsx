'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard'
import { Plus, TrendingUp, TrendingDown, Wallet } from '@/lib/icons'
import { WalletTopupModal } from '@/components/wallet/wallet-topup-modal'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { periodToQuery } from '@/lib/dashboard-period'
import { formatIdr } from '@/lib/wallet-transactions'
import { WalletTransactionHistory } from '@/components/wallet/wallet-transaction-history'

export function TeknisiSaldoView() {
  const { period } = useDashboardPeriod()
  const { wallet, isLoading } = useWallet()
  const [showTopup, setShowTopup] = useState(false)
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
        <Button onClick={() => setShowTopup(true)} variant="primary" size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Topup Saldo
        </Button>
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
      </AnimatePresence>
    </div>
  )
}
