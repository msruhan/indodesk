'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterChipBar } from '@/components/ui/filter-chip-bar'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Laptop,
  MessageCircle,
  Plus,
  Shield,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from '@/lib/icons'

type TabId = 'semua' | 'pemasukan' | 'pengeluaran' | 'belanja' | 'topup'

const tabs: { id: TabId; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'pemasukan', label: 'Pemasukan' },
  { id: 'pengeluaran', label: 'Pengeluaran' },
  { id: 'belanja', label: 'Belanja' },
  { id: 'topup', label: 'Top Up' },
]

interface Transaction {
  id: string
  category: 'earning' | 'expense' | 'shopping' | 'topup' | 'withdrawal' | 'rekber'
  title: string
  subtitle: string
  amount: number // positive = income, negative = expense
  status: 'completed' | 'pending' | 'in-progress' | 'failed'
  date: string
  icon: typeof ShoppingBag
  iconBg: string
  iconColor: string
}

const mockTransactions: Transaction[] = [
  { id: '1', category: 'earning', title: 'Konsultasi Unlock iPhone', subtitle: 'Dari: Siti Nurhaliza', amount: 50000, status: 'completed', date: '2024-03-20', icon: MessageCircle, iconBg: 'bg-primary-50', iconColor: 'text-primary-700' },
  { id: '2', category: 'earning', title: 'Remote Flashing Samsung', subtitle: 'Dari: Rudi Hartono', amount: 150000, status: 'completed', date: '2024-03-19', icon: Laptop, iconBg: 'bg-accent-50', iconColor: 'text-accent-700' },
  { id: '3', category: 'shopping', title: 'Beli Unlock Tool License', subtitle: 'Marketplace IndoTeknizi', amount: -500000, status: 'completed', date: '2024-03-18', icon: ShoppingBag, iconBg: 'bg-violet-50', iconColor: 'text-violet-700' },
  { id: '4', category: 'earning', title: 'Root & Custom ROM', subtitle: 'Dari: Dewi Lestari', amount: 200000, status: 'completed', date: '2024-03-17', icon: MessageCircle, iconBg: 'bg-primary-50', iconColor: 'text-primary-700' },
  { id: '5', category: 'topup', title: 'Top Up ML Diamonds 518', subtitle: 'Mobile Legends', amount: -132000, status: 'completed', date: '2024-03-16', icon: Zap, iconBg: 'bg-amber-50', iconColor: 'text-amber-700' },
  { id: '6', category: 'withdrawal', title: 'Withdraw ke BCA', subtitle: '****4567', amount: -1000000, status: 'completed', date: '2024-03-15', icon: Download, iconBg: 'bg-rose-50', iconColor: 'text-rose-700' },
  { id: '7', category: 'earning', title: 'Troubleshooting Hardware', subtitle: 'Dari: Budi Customer', amount: 100000, status: 'completed', date: '2024-03-14', icon: MessageCircle, iconBg: 'bg-primary-50', iconColor: 'text-primary-700' },
  { id: '8', category: 'rekber', title: 'Rekber Release - Samsung S21', subtitle: 'Buyer: Rudi Hartono', amount: 7200000, status: 'completed', date: '2024-03-13', icon: Shield, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
  { id: '9', category: 'shopping', title: 'Pulsa Telkomsel 50K', subtitle: 'Pulsa reguler', amount: -49500, status: 'completed', date: '2024-03-12', icon: ShoppingBag, iconBg: 'bg-violet-50', iconColor: 'text-violet-700' },
  { id: '10', category: 'earning', title: 'Konsultasi Data Recovery', subtitle: 'Dari: Maya Sari', amount: 80000, status: 'pending', date: '2024-03-11', icon: MessageCircle, iconBg: 'bg-primary-50', iconColor: 'text-primary-700' },
  { id: '11', category: 'topup', title: 'Top Up FF Diamonds 720', subtitle: 'Free Fire', amount: -99000, status: 'completed', date: '2024-03-10', icon: Zap, iconBg: 'bg-amber-50', iconColor: 'text-amber-700' },
  { id: '12', category: 'earning', title: 'Remote Session - Flashing', subtitle: 'Dari: Eko Prasetyo', amount: 150000, status: 'in-progress', date: '2024-03-09', icon: Laptop, iconBg: 'bg-accent-50', iconColor: 'text-accent-700' },
]

const statusConfig = {
  completed: { label: 'Selesai', color: 'text-primary-600', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-600', icon: Clock },
  'in-progress': { label: 'Proses', color: 'text-accent-600', icon: Clock },
  failed: { label: 'Gagal', color: 'text-rose-600', icon: XCircle },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(n))

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function TeknisiSaldoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('semua')

  const saldo = 2500000
  const totalIncome = mockTransactions.filter((t) => t.amount > 0 && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalExpense = mockTransactions.filter((t) => t.amount < 0 && t.status === 'completed').reduce((s, t) => s + Math.abs(t.amount), 0)
  const pendingIncome = mockTransactions.filter((t) => t.amount > 0 && t.status !== 'completed' && t.status !== 'failed').reduce((s, t) => s + t.amount, 0)

  const countForTab = (tab: TabId) => {
    switch (tab) {
      case 'pemasukan':
        return mockTransactions.filter((t) => t.amount > 0).length
      case 'pengeluaran':
        return mockTransactions.filter((t) => t.amount < 0).length
      case 'belanja':
        return mockTransactions.filter((t) => t.category === 'shopping').length
      case 'topup':
        return mockTransactions.filter((t) => t.category === 'topup').length
      default:
        return mockTransactions.length
    }
  }

  const filtered = (() => {
    switch (activeTab) {
      case 'pemasukan':
        return mockTransactions.filter((t) => t.amount > 0)
      case 'pengeluaran':
        return mockTransactions.filter((t) => t.amount < 0)
      case 'belanja':
        return mockTransactions.filter((t) => t.category === 'shopping')
      case 'topup':
        return mockTransactions.filter((t) => t.category === 'topup')
      default:
        return mockTransactions
    }
  })()

  return (
    <div className="space-y-5">
      {/* Saldo hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-5 text-white shadow-glow-primary sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%)] bg-[length:20px_20px] opacity-30" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/8 blur-xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
            <Wallet className="h-4 w-4" />
            Saldo tersedia
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
            {formatPrice(saldo)}
          </p>

          {pendingIncome > 0 && (
            <p className="mt-1 text-[12px] text-white/70">
              + {formatPrice(pendingIncome)} pending masuk
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-9 gap-1.5 border border-white/50 bg-white text-primary-700 shadow-soft-sm hover:bg-white/95 hover:text-primary-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Top Up Saldo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-white/70 bg-transparent text-white hover:border-white hover:bg-white/20 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Withdraw
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Income / Expense / Net summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-primary-200/60 bg-gradient-to-br from-primary-50/60 to-white p-3">
          <TrendingUp className="mb-1 h-4 w-4 text-primary-600" />
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">Pemasukan</p>
          <p className="mt-0.5 text-[14px] font-bold text-primary-700 tabular-nums">{formatPrice(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50/60 to-white p-3">
          <TrendingDown className="mb-1 h-4 w-4 text-rose-600" />
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">Pengeluaran</p>
          <p className="mt-0.5 text-[14px] font-bold text-rose-700 tabular-nums">{formatPrice(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-surface-200/60 bg-gradient-to-br from-surface-50/60 to-white p-3">
          <DollarSign className="mb-1 h-4 w-4 text-ink" />
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">Net bulan ini</p>
          <p className={cn('mt-0.5 text-[14px] font-bold tabular-nums', totalIncome - totalExpense >= 0 ? 'text-primary-700' : 'text-rose-700')}>
            {totalIncome - totalExpense >= 0 ? '+' : '-'}{formatPrice(Math.abs(totalIncome - totalExpense))}
          </p>
        </div>
      </div>

      <FilterChipBar
        options={tabs}
        value={activeTab}
        onChange={setActiveTab}
        allValue="semua"
        getCount={countForTab}
      />
      {/* Transaction list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          {filtered.map((tx, idx) => {
            const cfg = statusConfig[tx.status]
            const StatusIcon = cfg.icon
            const isIncome = tx.amount > 0

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.2) }}
              >
                <div className="group flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-3 transition-all duration-300 hover:border-primary-200/70 hover:shadow-soft-sm sm:p-3.5">
                  {/* Icon */}
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', tx.iconBg)}>
                    <tx.icon className={cn('h-[18px] w-[18px]', tx.iconColor)} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{tx.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-surface-500">
                      <span className="truncate">{tx.subtitle}</span>
                      <span className="flex-shrink-0 text-surface-300">·</span>
                      <span className="flex-shrink-0">{formatDate(tx.date)}</span>
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <p className={cn(
                      'text-[13px] font-bold tabular-nums',
                      isIncome ? 'text-primary-700' : 'text-ink',
                    )}>
                      {isIncome ? '+' : '-'}{formatPrice(tx.amount)}
                    </p>
                    <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', cfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
            <Wallet className="h-6 w-6 text-surface-400" />
          </div>
          <p className="text-sm font-semibold text-ink">Belum ada transaksi</p>
          <p className="mt-1 text-xs text-surface-500">Transaksi akan muncul setelah ada aktivitas.</p>
        </div>
      )}
    </div>
  )
}
