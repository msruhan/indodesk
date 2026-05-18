'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterChipBar } from '@/components/ui/filter-chip-bar'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Laptop,
  MessageCircle,
  Package,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  XCircle,
} from '@/lib/icons'
import {
  fetchUserImeiRiwayatOrders,
  fetchUserServerRiwayatOrders,
  imeiOrderToRiwayatTransaction,
  serverOrderToRiwayatTransaction,
  type RiwayatTransaction,
  type RiwayatTransactionType,
} from '@/lib/user-riwayat-orders'
import { useDashboardPeriod } from '@/contexts/dashboard-period-context'
import { isDateInPeriod } from '@/lib/dashboard-period'

const tabs: { id: RiwayatTransactionType; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'belanja', label: 'Belanja' },
  { id: 'perangkat', label: 'Perangkat' },
  { id: 'server', label: 'Server' },
  { id: 'konsultasi', label: 'Konsultasi' },
  { id: 'rekber', label: 'Rekber' },
  { id: 'remote', label: 'Remote' },
]

const mockTransactions: RiwayatTransaction[] = [
  { id: '1', type: 'belanja', title: 'iPhone 13 Pro Max', subtitle: 'TechSolution Store', amount: 5000000, status: 'completed', date: '2024-03-18' },
  { id: '2', type: 'belanja', title: 'Samsung S21', subtitle: 'HandPhone Center', amount: 2500000, status: 'completed', date: '2024-03-15' },
  { id: '3', type: 'konsultasi', title: 'Konsultasi Unlock iPhone', subtitle: 'Ahmad Hidayat', amount: 50000, status: 'completed', date: '2024-03-14' },
  { id: '4', type: 'rekber', title: 'Pembelian iPhone 13 Pro Max', subtitle: 'Buyer → TechSolution Store', amount: 5000000, status: 'in-progress', date: '2024-03-12' },
  { id: '5', type: 'remote', title: 'Remote Flashing Samsung', subtitle: 'Budi Santoso', amount: 150000, status: 'completed', date: '2024-03-10' },
  { id: '6', type: 'konsultasi', title: 'Troubleshooting Hardware', subtitle: 'Dewi Lestari', amount: 100000, status: 'completed', date: '2024-03-08' },
  { id: '7', type: 'belanja', title: 'Wireless Charger', subtitle: 'Accessories Pro', amount: 250000, status: 'pending', date: '2024-03-06' },
  { id: '8', type: 'rekber', title: 'Jual Samsung S21', subtitle: 'Seller → Rudi Hartono', amount: 2500000, status: 'completed', date: '2024-03-04' },
  { id: '9', type: 'remote', title: 'Root & Custom ROM', subtitle: 'Fajar Pratama', amount: 200000, status: 'failed', date: '2024-03-02' },
  { id: '10', type: 'belanja', title: 'ML Diamonds 518', subtitle: 'Top Up', amount: 132000, status: 'completed', date: '2024-02-28' },
]

const statusConfig = {
  completed: { label: 'Selesai', variant: 'success' as const, icon: CheckCircle, color: 'text-primary-600' },
  pending: { label: 'Pending', variant: 'warning' as const, icon: Clock, color: 'text-amber-600' },
  'in-progress': { label: 'Proses', variant: 'info' as const, icon: Clock, color: 'text-accent-600' },
  failed: { label: 'Gagal', variant: 'danger' as const, icon: XCircle, color: 'text-rose-600' },
}

const typeConfig = {
  belanja: { icon: ShoppingBag, bg: 'bg-primary-50', text: 'text-primary-700' },
  konsultasi: { icon: MessageCircle, bg: 'bg-accent-50', text: 'text-accent-700' },
  rekber: { icon: Shield, bg: 'bg-violet-50', text: 'text-violet-700' },
  remote: { icon: Laptop, bg: 'bg-amber-50', text: 'text-amber-700' },
  perangkat: { icon: Smartphone, bg: 'bg-primary-50', text: 'text-primary-700' },
  server: { icon: Package, bg: 'bg-amber-50', text: 'text-amber-700' },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseRiwayatDate(dateStr: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export default function UserRiwayatPage() {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const { period, label: periodLabel } = useDashboardPeriod()
  const [activeTab, setActiveTab] = useState<RiwayatTransactionType>('semua')
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [serviceOrders, setServiceOrders] = useState<RiwayatTransaction[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setOrdersLoading(true)
      try {
        const [imei, server] = await Promise.all([
          fetchUserImeiRiwayatOrders(),
          fetchUserServerRiwayatOrders(),
        ])
        if (cancelled) return
        const mapped = [
          ...imei.map(imeiOrderToRiwayatTransaction),
          ...server.map(serverOrderToRiwayatTransaction),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setServiceOrders(mapped)
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const allTransactions = useMemo(() => {
    return [...mockTransactions, ...serviceOrders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [serviceOrders])

  const periodTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = parseRiwayatDate(t.date)
      if (!d) return true
      return isDateInPeriod(d, period)
    })
  }, [allTransactions, period])

  const countForTab = (tab: RiwayatTransactionType) =>
    tab === 'semua'
      ? periodTransactions.length
      : periodTransactions.filter((t) => t.type === tab).length

  const filtered = useMemo(() => {
    let list =
      activeTab === 'semua'
        ? periodTransactions
        : periodTransactions.filter((t) => t.type === activeTab)
    if (urlQuery) {
      list = list.filter((t) => {
        const hay = [t.id, t.title, t.subtitle, t.type].join(' ').toLowerCase()
        return hay.includes(urlQuery)
      })
    }
    return list
  }, [activeTab, periodTransactions, urlQuery])

  const totalSpent = periodTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const completedCount = periodTransactions.filter((t) => t.status === 'completed').length
  const pendingCount = periodTransactions.filter(
    (t) => t.status !== 'completed' && t.status !== 'failed',
  ).length

  const quickStats = [
    {
      tab: 'belanja' as const,
      label: 'Belanja',
      count: periodTransactions.filter((t) => t.type === 'belanja').length,
      icon: ShoppingBag,
      color: 'primary' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'belanja' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
    {
      tab: 'perangkat' as const,
      label: 'Perangkat',
      count: periodTransactions.filter((t) => t.type === 'perangkat').length,
      icon: Smartphone,
      color: 'primary' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'perangkat' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
    {
      tab: 'server' as const,
      label: 'Server',
      count: periodTransactions.filter((t) => t.type === 'server').length,
      icon: Package,
      color: 'amber' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'server' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
    {
      tab: 'konsultasi' as const,
      label: 'Konsultasi',
      count: periodTransactions.filter((t) => t.type === 'konsultasi').length,
      icon: MessageCircle,
      color: 'accent' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'konsultasi' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
    {
      tab: 'rekber' as const,
      label: 'Rekber',
      count: periodTransactions.filter((t) => t.type === 'rekber').length,
      icon: Shield,
      color: 'violet' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'rekber' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
    {
      tab: 'remote' as const,
      label: 'Remote',
      count: periodTransactions.filter((t) => t.type === 'remote').length,
      icon: Laptop,
      color: 'amber' as const,
      amount: periodTransactions
        .filter((t) => t.type === 'remote' && t.status === 'completed')
        .reduce((s, t) => s + t.amount, 0),
    },
  ]

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-5 text-white shadow-glow-primary sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%)] bg-[length:20px_20px] opacity-30" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex h-full flex-col">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 capitalize">
            Total pengeluaran · {periodLabel}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
            {formatPrice(totalSpent)}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[12px]">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-md">
              <CheckCircle className="h-3 w-3" />
              {completedCount} selesai
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-md">
              <Clock className="h-3 w-3" />
              {pendingCount} proses
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-md">
              <TrendingUp className="h-3 w-3" />
              {periodTransactions.length} total
            </span>
          </div>
        </div>
      </motion.div>

      <div className="-mx-4 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {quickStats.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className={cn(
                'flex w-[128px] flex-shrink-0 flex-col rounded-xl border p-3 text-left transition-all duration-300 sm:w-auto',
                activeTab === item.tab
                  ? 'border-primary-300 bg-primary-50/60 shadow-soft-sm'
                  : 'border-surface-200/70 bg-white hover:border-primary-200 hover:shadow-soft-xs',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <item.icon
                  className={cn(
                    'h-4 w-4',
                    item.color === 'primary' && 'text-primary-600',
                    item.color === 'accent' && 'text-accent-600',
                    item.color === 'violet' && 'text-violet-600',
                    item.color === 'amber' && 'text-amber-600',
                  )}
                />
                <span className="text-[10px] font-bold text-ink tabular-nums">{item.count}x</span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-surface-500">
                {item.label}
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-ink tabular-nums">
                {formatPrice(item.amount)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <FilterChipBar
        options={tabs}
        value={activeTab}
        onChange={setActiveTab}
        allValue="semua"
        getCount={countForTab}
      />

      {ordersLoading && (activeTab === 'semua' || activeTab === 'perangkat' || activeTab === 'server') && (
        <p className="text-center text-xs text-surface-500">Memuat order layanan…</p>
      )}

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
            const typeCfg = typeConfig[tx.type]
            const TypeIcon = typeCfg.icon
            const StatusIcon = cfg.icon

            const row = (
              <div className="group flex items-center gap-3 rounded-xl border border-surface-200/60 bg-white p-3 transition-all duration-300 hover:border-primary-200/70 hover:shadow-soft-sm sm:p-3.5">
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                    typeCfg.bg,
                  )}
                >
                  <TypeIcon className={cn('h-[18px] w-[18px]', typeCfg.text)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-ink">{tx.title}</p>
                    {(tx.type === 'perangkat' || tx.type === 'server') && (
                      <Badge
                        variant={tx.type === 'server' ? 'warning' : 'info'}
                        className="shrink-0 px-1 py-0 text-[8px]"
                      >
                        {tx.type === 'perangkat' ? 'IMEI' : 'Server'}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-surface-500">
                    <span className="truncate">{tx.subtitle}</span>
                    <span className="flex-shrink-0 text-surface-300">·</span>
                    <span className="flex-shrink-0">{formatDate(tx.date)}</span>
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <p className="text-[13px] font-bold text-ink tabular-nums">{formatPrice(tx.amount)}</p>
                  <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', cfg.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
              </div>
            )

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.2) }}
              >
                {tx.href ? (
                  <Link href={tx.href} className="block">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {!ordersLoading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
            <Clock className="h-6 w-6 text-surface-400" />
          </div>
          <p className="text-sm font-semibold text-ink">Belum ada transaksi</p>
          <p className="mt-1 text-xs text-surface-500">
            {activeTab === 'perangkat' || activeTab === 'server'
              ? 'Order layanan akan muncul di sini setelah Anda memesan.'
              : 'Transaksi akan muncul di sini setelah Anda melakukan aktivitas.'}
          </p>
          {(activeTab === 'perangkat' || activeTab === 'server' || activeTab === 'semua') && (
            <Link href="/imei">
              <Button variant="primary" size="sm" className="mt-4">
                Lihat layanan
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
