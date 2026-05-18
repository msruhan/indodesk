/** Unified wallet & order activity for saldo dashboard. */

export type TransactionCategory = 'wallet' | 'shop' | 'topup' | 'imei' | 'server'

export type TransactionFilter = 'all' | TransactionCategory

export interface UnifiedTransaction {
  id: string
  category: TransactionCategory
  orderCode: string
  title: string
  subtitle: string | null
  /** Negative = keluar (debit), positive = masuk (credit) */
  amount: number
  status: string
  statusLabel: string
  createdAt: string
  href: string | null
}

const imeiStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROCESS: 'Diproses',
  SUCCESS: 'Berhasil',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
}

const serverStatusLabels: Record<string, string> = { ...imeiStatusLabels }

const topupStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu bayar',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  FULFILLING: 'Diproses',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
}

const shopStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Refund',
}

const ledgerTypeLabels: Record<string, string> = {
  TOPUP: 'Topup saldo',
  WITHDRAWAL: 'Penarikan',
  PAYMENT: 'Pembayaran',
  REFUND: 'Refund',
  ESCROW_HOLD: 'Rekber (hold)',
  ESCROW_RELEASE: 'Rekber (release)',
  EARNING: 'Penambahan saldo',
  CASHBACK: 'Cashback',
}

export function labelForImeiStatus(status: string) {
  return imeiStatusLabels[status] ?? status
}

export function labelForServerStatus(status: string) {
  return serverStatusLabels[status] ?? status
}

export function labelForTopupStatus(status: string) {
  return topupStatusLabels[status] ?? status
}

export function labelForShopStatus(status: string) {
  return shopStatusLabels[status] ?? status
}

export function labelForLedgerType(type: string) {
  return ledgerTypeLabels[type] ?? type
}

export const transactionFilterOptions: { id: TransactionFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'wallet', label: 'Saldo' },
  { id: 'shop', label: 'Shop' },
  { id: 'topup', label: 'Topup' },
  { id: 'imei', label: 'Perangkat' },
  { id: 'server', label: 'Server' },
]

export const categoryMeta: Record<
  TransactionCategory,
  { label: string; color: string; bg: string }
> = {
  wallet: { label: 'Saldo', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  shop: { label: 'Shop', color: 'text-primary-700', bg: 'bg-primary-50' },
  topup: { label: 'Topup', color: 'text-violet-700', bg: 'bg-violet-50' },
  imei: { label: 'Perangkat', color: 'text-blue-700', bg: 'bg-blue-50' },
  server: { label: 'Server', color: 'text-amber-700', bg: 'bg-amber-50' },
}

export function formatTransactionAmount(amount: number) {
  const prefix = amount >= 0 ? '+' : ''
  return (
    prefix +
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  )
}

export function formatTransactionDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Order & pembayaran keluar (bukan topup/refund ke wallet). */
export function isSpendingTransaction(tx: UnifiedTransaction): boolean {
  if (tx.amount >= 0) return false
  return tx.category !== 'wallet'
}

export function computeTotalSpending(transactions: UnifiedTransaction[]): number {
  return transactions.filter(isSpendingTransaction).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
