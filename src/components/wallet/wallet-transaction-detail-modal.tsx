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
  ExternalLink,
  Headphones,
  Package,
  RefreshCw,
  Scales,
  ShoppingBag,
  Unlock,
  Wallet,
  X,
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
  if (
    ['PENDING', 'PENDING_PAYMENT', 'IN_PROCESS', 'PROCESSING', 'FULFILLING', 'REJECT_PENDING_RELEASE'].includes(
      s,
    )
  ) {
    return 'warning'
  }
  return 'info'
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 sm:gap-3 sm:py-2">
      <span className="shrink-0 text-[10px] text-surface-500 sm:text-xs">{label}</span>
      <span className="min-w-0 break-all text-right text-[10px] font-medium text-ink sm:text-xs">
        {value}
      </span>
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
            className="fixed inset-0 z-[101] flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-detail-title"
          >
            <div
              className="relative flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-surface-200/80 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-ink sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                aria-label="Tutup"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
                <div className="border-b border-surface-100 bg-gradient-to-br from-primary-50/50 to-white px-3 pb-2.5 pt-3 pr-10 sm:px-6 sm:pb-4 sm:pt-8 sm:pr-12">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-2xl',
                        meta.bg,
                      )}
                    >
                      <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', meta.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-surface-500 sm:text-[10px] sm:tracking-[0.16em]">
                        Detail transaksi
                      </p>
                      <h2
                        id="tx-detail-title"
                        className="mt-0.5 break-words font-semibold text-xs text-ink sm:mt-1 sm:text-lg"
                      >
                        {transaction.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="default" className="text-[9px] sm:text-[10px]">
                          {meta.label}
                        </Badge>
                        <Badge variant={variant} className="text-[9px] sm:text-[10px]">
                          {transaction.statusLabel}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          'mt-1.5 text-base font-bold tabular-nums sm:mt-2 sm:text-xl',
                          transaction.amount >= 0 ? 'text-primary-700' : 'text-ink',
                        )}
                      >
                        {formatTransactionAmount(transaction.amount)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-surface-500 sm:text-[11px]">
                        {transaction.amount >= 0 ? 'Pemasukan saldo' : 'Pengeluaran saldo'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2.5 sm:px-6 sm:py-5">
                  <section className="rounded-xl border border-surface-200/70 bg-surface-50/50 p-2 text-xs sm:rounded-2xl sm:p-3 sm:text-sm">
                    <DetailRow
                      label="Kode transaksi"
                      value={<span className="font-mono">{transaction.orderCode}</span>}
                    />
                    <DetailRow
                      label="ID internal"
                      value={<span className="font-mono text-[9px] sm:text-[10px]">{transaction.id}</span>}
                    />
                    {transaction.subtitle && (
                      <DetailRow label="Keterangan" value={transaction.subtitle} />
                    )}
                    {transaction.rejectionNote && (
                      <DetailRow
                        label="Alasan penolakan"
                        value={
                          <span className="text-rose-700">{transaction.rejectionNote}</span>
                        }
                      />
                    )}
                    <DetailRow label="Status" value={transaction.statusLabel} />
                    <DetailRow label="Tanggal" value={formatTransactionDate(transaction.createdAt)} />
                    {transaction.balanceBefore != null && (
                      <DetailRow label="Saldo sebelum" value={formatIdr(transaction.balanceBefore)} />
                    )}
                    {transaction.balanceAfter != null && (
                      <DetailRow label="Saldo sesudah" value={formatIdr(transaction.balanceAfter)} />
                    )}
                  </section>
                </div>
              </div>

              <div className="shrink-0 space-y-1.5 border-t border-surface-100 bg-white px-3 py-2 sm:space-y-2 sm:px-6 sm:py-4">
                <div className={cn('gap-1.5', transaction.href ? 'grid grid-cols-2' : 'grid grid-cols-1')}>
                  {transaction.href && (
                    <Button
                      variant="primary"
                      className="h-8 rounded-full text-[11px] sm:h-11 sm:text-sm"
                      asChild
                    >
                      <Link href={transaction.href} onClick={onClose}>
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Buka detail
                      </Link>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full text-[11px] sm:h-11 sm:text-sm"
                    onClick={onClose}
                  >
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
