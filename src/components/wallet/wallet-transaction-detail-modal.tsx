'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  categoryMeta,
  formatTransactionAmount,
  formatTransactionDate,
  formatIdr,
  type UnifiedTransaction,
} from '@/lib/wallet-transactions'
import {
  Headphones,
  Package,
  RefreshCw,
  Scales,
  ShoppingBag,
  Unlock,
  Wallet,
  X,
  ExternalLink,
} from '@/lib/icons'

const categoryIcons = {
  wallet: Wallet,
  shop: ShoppingBag,
  topup: RefreshCw,
  imei: Unlock,
  server: Package,
  konsultasi: Headphones,
  inspeksi: Scales,
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-surface-100 py-3 last:border-0">
      <span className="shrink-0 text-xs text-surface-500">{label}</span>
      <span className="min-w-0 text-right text-xs font-medium text-ink">{value}</span>
    </div>
  )
}

type WalletTransactionDetailModalProps = {
  transaction: UnifiedTransaction | null
  onClose: () => void
}

export function WalletTransactionDetailModal({
  transaction,
  onClose,
}: WalletTransactionDetailModalProps) {
  useEffect(() => {
    if (!transaction) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [transaction, onClose])

  const meta = transaction ? categoryMeta[transaction.category] : null
  const Icon = transaction ? categoryIcons[transaction.category] : Wallet
  const variant = transaction ? statusVariant(transaction.status, transaction.category) : 'default'

  return (
    <AnimatePresence>
      {transaction && meta && (
        <>
          <motion.div
            key="tx-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="tx-detail-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-detail-title"
          >
            <div
              className="relative max-h-[min(90vh,640px)] w-full max-w-md overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-[min(90vh,640px)] overflow-y-auto">
                <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/40 to-white px-6 pb-4 pt-8">
                  <div
                    className={cn(
                      'mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl',
                      meta.bg,
                    )}
                  >
                    <Icon className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                    Detail transaksi
                  </p>
                  <h2 id="tx-detail-title" className="mt-1 pr-8 text-lg font-semibold text-ink">
                    {transaction.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="default" className="text-[9px]">
                      {meta.label}
                    </Badge>
                    <Badge variant={variant} className="text-[9px]">
                      {transaction.statusLabel}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      'mt-3 text-xl font-bold tabular-nums',
                      transaction.amount >= 0 ? 'text-emerald-600' : 'text-ink',
                    )}
                  >
                    {formatTransactionAmount(transaction.amount)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-surface-500">
                    {transaction.amount >= 0 ? 'Pemasukan saldo' : 'Pengeluaran saldo'}
                  </p>
                </div>

                <div className="px-6 py-2">
                  <DetailRow label="Kode transaksi" value={<span className="font-mono">{transaction.orderCode}</span>} />
                  <DetailRow label="ID internal" value={<span className="font-mono text-[10px]">{transaction.id}</span>} />
                  {transaction.subtitle && (
                    <DetailRow label="Keterangan" value={transaction.subtitle} />
                  )}
                  <DetailRow label="Status" value={transaction.statusLabel} />
                  <DetailRow
                    label="Tanggal"
                    value={formatTransactionDate(transaction.createdAt)}
                  />
                  {transaction.balanceBefore != null && (
                    <DetailRow label="Saldo sebelum" value={formatIdr(transaction.balanceBefore)} />
                  )}
                  {transaction.balanceAfter != null && (
                    <DetailRow label="Saldo sesudah" value={formatIdr(transaction.balanceAfter)} />
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-surface-100 px-6 py-4">
                  {transaction.href && (
                    <Button variant="primary" size="sm" className="w-full" asChild>
                      <Link href={transaction.href} onClick={onClose}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka halaman terkait
                      </Link>
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
