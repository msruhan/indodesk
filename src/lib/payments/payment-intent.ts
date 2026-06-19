import type { PaymentIntent, PaymentIntentPurpose, PaymentIntentStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

export const WALLET_TOPUP_MIN = 10_000
export const WALLET_TOPUP_MAX = 10_000_000

export function generateMerchantRef(): string {
  const suffix = crypto.randomBytes(8).toString('hex').toUpperCase()
  return `BTPI-${Date.now()}-${suffix}`
}

export function generateCheckoutBatchId(): string {
  const suffix = crypto.randomBytes(8).toString('hex').toUpperCase()
  return `BTCO-${Date.now()}-${suffix}`
}

export const MARKETPLACE_PAYMENT_TTL_MS = 30 * 60 * 1000
export const CATALOG_TOPUP_PAYMENT_TTL_MS = 30 * 60 * 1000

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value.toString())
}

export type PaymentIntentDto = {
  id: string
  merchantRef: string
  purpose: PaymentIntentPurpose
  subtotal: string
  feeAmount: string
  amount: string
  channelCode: string
  channelName: string | null
  channelType: string | null
  status: PaymentIntentStatus
  payCode: string | null
  qrUrl: string | null
  qrString: string | null
  checkoutUrl: string | null
  payUrl: string | null
  expiredAt: string | null
  paidAt: string | null
  createdAt: string
  orderCode?: string | null
}

export function serializePaymentIntent(intent: PaymentIntent): PaymentIntentDto {
  return {
    id: intent.id,
    merchantRef: intent.merchantRef,
    purpose: intent.purpose,
    subtotal: intent.subtotal.toString(),
    feeAmount: intent.feeAmount.toString(),
    amount: intent.amount.toString(),
    channelCode: intent.channelCode,
    channelName: intent.channelName,
    channelType: intent.channelType,
    status: intent.status,
    payCode: intent.payCode,
    qrUrl: intent.qrUrl,
    qrString: intent.qrString,
    checkoutUrl: intent.checkoutUrl,
    payUrl: intent.payUrl,
    expiredAt: intent.expiredAt?.toISOString() ?? null,
    paidAt: intent.paidAt?.toISOString() ?? null,
    createdAt: intent.createdAt.toISOString(),
  }
}

export function mapTripayStatusToIntent(
  status: string,
): PaymentIntentStatus | null {
  switch (status) {
    case 'UNPAID':
      return 'UNPAID'
    case 'PAID':
      return 'PAID'
    case 'EXPIRED':
      return 'EXPIRED'
    case 'FAILED':
      return 'FAILED'
    case 'REFUND':
    case 'REFUNDED':
      return 'REFUNDED'
    default:
      return null
  }
}
