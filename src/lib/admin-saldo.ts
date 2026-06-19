/**
 * Admin Saldo (Wallet) — shared types & helpers.
 *
 * Modul ini dipakai oleh:
 *  - `/api/admin/wallet/deposit`  → POST deposit manual & GET list deposit
 *  - `/api/admin/wallet/transactions` → GET ledger entries (deposit + pemotongan)
 *  - Komponen `<AdminSaldoPanel />` di halaman Management → tab Saldo
 *
 * Catatan desain:
 *  - Sumber kebenaran data adalah `WalletLedger`. Setiap deposit (manual maupun
 *    payment-gateway) menulis baris baru dengan `type = TOPUP`.
 *  - Untuk mengetahui apakah deposit dilakukan manual oleh admin, kita simpan
 *    metadata di field `description` dengan prefiks "Deposit manual" atau
 *    "Deposit otomatis" — tanpa migrasi schema. Field `referenceId` dipakai
 *    menyimpan ID admin (manual) atau order ID (PG).
 */

import type { LedgerType } from '@prisma/client'

export type DepositMethod = 'manual' | 'gateway' | 'refund' | 'cashback' | 'earning'

export type DepositLedgerDto = {
  id: string
  walletId: string
  user: {
    id: string
    name: string
    email: string
    role: 'USER' | 'TEKNISI' | 'ADMIN'
    image: string | null
  }
  ledgerType: LedgerType
  amount: string
  balanceAfter: string
  description: string
  referenceId: string | null
  /** Metode/sumber deposit yang sudah diparsing dari description. */
  method: DepositMethod
  /** Nama admin yang melakukan deposit manual (jika ada). */
  performedBy: string | null
  createdAt: string
}

export type SpendingCategory =
  | 'imei'
  | 'server'
  | 'shop'
  | 'topup'
  | 'rekber'
  | 'withdrawal'
  | 'other'

export type SpendingLedgerDto = {
  id: string
  walletId: string
  user: {
    id: string
    name: string
    email: string
    role: 'USER' | 'TEKNISI' | 'ADMIN'
    image: string | null
  }
  ledgerType: LedgerType
  /** Nilai negatif (yyy.format() akan menampilkan "-Rp ..."). */
  amount: string
  balanceAfter: string
  description: string
  referenceId: string | null
  category: SpendingCategory
  /** Order code asli jika kita berhasil resolve dari referenceId, untuk audit. */
  orderCode: string | null
  /** Path detail order yang relevan (untuk admin clickthrough). */
  orderHref: string | null
  createdAt: string
}

export type AdminSaldoStats = {
  totalSaldo: string
  totalDeposit30d: string
  totalSpending30d: string
  totalDepositCount30d: number
  totalSpendingCount30d: number
}

/** Format nominal Rupiah (signed). */
export function formatIdrSigned(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
  if (num >= 0) return `+${formatter.format(num)}`
  return formatter.format(num) // sudah memuat tanda minus
}

/** Format nominal Rupiah (absolute). */
export function formatIdrAbs(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.abs(num))
}

const MANUAL_PREFIX = 'Deposit manual:'
const GATEWAY_PREFIX = 'Deposit otomatis:'

export function buildManualDepositDescription(reason: string, adminName: string) {
  const trimmed = reason.trim() || 'Top up oleh admin'
  return `${MANUAL_PREFIX} ${trimmed} (oleh ${adminName})`
}

export function buildGatewayDepositDescription(channel: string, reference: string) {
  return `${GATEWAY_PREFIX} ${channel} #${reference}`
}

export function classifyDeposit(
  type: LedgerType,
  description: string,
): { method: DepositMethod; performedBy: string | null } {
  if (type === 'REFUND') return { method: 'refund', performedBy: null }
  if (type === 'CASHBACK') return { method: 'cashback', performedBy: null }
  if (type === 'EARNING' && !description.startsWith(MANUAL_PREFIX)) {
    return { method: 'earning', performedBy: null }
  }
  if (description.startsWith(MANUAL_PREFIX) || type === 'EARNING') {
    const match = description.match(/\(oleh ([^)]+)\)\s*$/)
    return { method: 'manual', performedBy: match?.[1] ?? null }
  }
  if (description.startsWith(GATEWAY_PREFIX) || type === 'TOPUP') {
    return { method: 'gateway', performedBy: null }
  }
  return { method: 'gateway', performedBy: null }
}

export function classifySpending(
  type: LedgerType,
  description: string,
): SpendingCategory {
  if (type === 'WITHDRAWAL') return 'withdrawal'
  if (type === 'ESCROW_HOLD' || type === 'ESCROW_RELEASE') return 'rekber'
  const lower = description.toLowerCase()
  if (lower.includes('order imei') || lower.includes('imei #')) return 'imei'
  if (lower.includes('server order') || lower.includes('server #')) return 'server'
  if (lower.includes('topup') || lower.includes('top up') || lower.includes('top-up')) return 'topup'
  if (lower.includes('rekber') || lower.includes('escrow')) return 'rekber'
  if (lower.includes('shop') || lower.includes('marketplace') || lower.includes('order #')) return 'shop'
  return 'other'
}

export const spendingCategoryLabel: Record<SpendingCategory, string> = {
  imei: 'Digital Service',
  server: 'Server Service',
  shop: 'Marketplace',
  topup: 'Top Up',
  rekber: 'Transaksi Aman',
  withdrawal: 'Penarikan',
  other: 'Lainnya',
}

export const spendingCategoryTone: Record<SpendingCategory, 'primary' | 'info' | 'warning' | 'danger' | 'default'> = {
  imei: 'info',
  server: 'warning',
  shop: 'primary',
  topup: 'info',
  rekber: 'primary',
  withdrawal: 'danger',
  other: 'default',
}

export const depositMethodLabel: Record<DepositMethod, string> = {
  manual: 'Manual (Admin)',
  gateway: 'Payment Gateway',
  refund: 'Refund',
  cashback: 'Cashback',
  earning: 'Earning Teknisi',
}

export const depositMethodTone: Record<DepositMethod, 'primary' | 'info' | 'warning' | 'default'> = {
  manual: 'primary',
  gateway: 'info',
  refund: 'warning',
  cashback: 'primary',
  earning: 'default',
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
