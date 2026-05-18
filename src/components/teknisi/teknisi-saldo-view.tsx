'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, CreditCard, TrendingUp, TrendingDown, X } from '@/lib/icons'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { periodToQuery } from '@/lib/dashboard-period'
import { formatIdr } from '@/lib/wallet-transactions'
import { cn } from '@/lib/utils'
import { WalletTransactionHistory } from '@/components/wallet/wallet-transaction-history'

function TopupModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { topup } = useWallet()
  const [step, setStep] = useState<'amount' | 'method' | 'confirm'>('amount')
  const [amount, setAmount] = useState(50000)
  const [method, setMethod] = useState<'GATEWAY' | 'PAYPAL' | 'TRANSFER'>('GATEWAY')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const presets = [50000, 100000, 250000, 500000, 1000000]

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const result = await topup(amount, method, {
      bankName,
      accountName,
    })

    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setError(result.error || 'Gagal membuat topup request')
    }

    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Topup Saldo</h3>
            <p className="mt-0.5 text-xs text-surface-500">
              {step === 'amount' && 'Pilih jumlah topup'}
              {step === 'method' && 'Pilih metode pembayaran'}
              {step === 'confirm' && 'Konfirmasi topup Anda'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {step === 'amount' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">Jumlah Topup</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-500">Rp</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(10000, parseInt(e.target.value) || 0))}
                  className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-10 pr-3 text-sm font-medium text-ink placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-ink">Preset Amount</p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      amount === preset
                        ? 'bg-primary-600 text-white'
                        : 'border border-surface-200 bg-white text-surface-600 hover:border-primary-300 hover:bg-primary-50',
                    )}
                  >
                    {(preset / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep('method')}
              className="w-full"
              variant="primary"
              size="sm"
            >
              Lanjutkan
            </Button>
          </div>
        )}

        {step === 'method' && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              {[
                { id: 'GATEWAY', label: 'Payment Gateway', icon: CreditCard, desc: 'Kartu kredit, debit, e-wallet' },
                { id: 'PAYPAL', label: 'PayPal', icon: CreditCard, desc: 'Pembayaran via PayPal' },
                { id: 'TRANSFER', label: 'Transfer Bank', icon: CreditCard, desc: 'Transfer langsung ke rekening admin' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMethod(id as typeof method)
                    if (id === 'TRANSFER') {
                      setStep('confirm')
                    } else {
                      setStep('confirm')
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all',
                    method === id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300',
                  )}
                >
                  <Icon className={cn('h-5 w-5', method === id ? 'text-primary-600' : 'text-surface-400')} />
                  <div className="text-left">
                    <p className={cn('text-sm font-medium', method === id ? 'text-primary-700' : 'text-ink')}>
                      {label}
                    </p>
                    <p className="text-xs text-surface-500">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {method === 'TRANSFER' && (
              <div className="space-y-2 rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-900">Informasi Transfer</p>
                <div className="space-y-1 text-xs text-amber-800">
                  <p>Bank: BCA</p>
                  <p>Nomor Rekening: 1234567890</p>
                  <p>Atas Nama: PT IndoTeknizi</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('amount')}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                Kembali
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                className="flex-1"
                variant="primary"
                size="sm"
              >
                Lanjutkan
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-surface-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600">Jumlah Topup</span>
                <span className="font-semibold text-ink">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600">Metode</span>
                <span className="font-semibold text-ink">
                  {method === 'GATEWAY' && 'Payment Gateway'}
                  {method === 'PAYPAL' && 'PayPal'}
                  {method === 'TRANSFER' && 'Transfer Bank'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('method')}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Konfirmasi Topup'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-ink sm:text-2xl">Saldo & Transaksi</h1>
        <p className="mt-0.5 text-[13px] text-surface-500">
          Kelola saldo Anda dan lihat riwayat transaksi
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Saldo Anda</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {isLoading ? '…' : formattedBalance}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                Terakhir update: {wallet ? new Date(wallet.updatedAt).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-200/50">
              <TrendingUp className="h-6 w-6 text-emerald-700" />
            </div>
          </div>

          <Button
            onClick={() => setShowTopup(true)}
            className="mt-4 w-full"
            variant="primary"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Topup Saldo
          </Button>
        </CardContent>
        </Card>

        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/40">
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Total Pengeluaran</p>
                <p className="mt-2 text-3xl font-bold text-amber-950">
                  {spendingLoading ? '…' : formatIdr(totalSpending)}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {spendingLoading
                    ? 'Menghitung…'
                    : `${spendingCount} transaksi order (shop, topup, perangkat, server)`}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200/50">
                <TrendingDown className="h-6 w-6 text-amber-800" />
              </div>
            </div>
            <p className="mt-auto pt-4 text-[11px] leading-relaxed text-amber-700/90">
              Akumulasi pembayaran dari wallet untuk layanan dan pembelian di platform.
            </p>
          </CardContent>
        </Card>
      </div>

      <WalletTransactionHistory onTransactionsLoaded={loadSpendingSummary} />

      <AnimatePresence>
        {showTopup && (
          <TopupModal
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
