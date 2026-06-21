import type {
  Order,
  OrderCancellationRequest,
  OrderCancelledBy,
  Prisma,
} from '@prisma/client'
import { prisma } from '@/lib/db'
import { restoreMarketplaceOrderStockInTx } from '@/lib/payments/fulfill/marketplace'
import {
  debitSellerForMarketplace,
  refundBuyerHoldForMarketplace,
} from '@/lib/marketplace-wallet'
import { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancel-constants'

export { CANCEL_REASON_MIN_LENGTH } from '@/lib/marketplace-order-cancel-constants'

export const INSTANT_CANCEL_MS = 60 * 60 * 1000
export const SELLER_CANCEL_RESPONSE_HOURS = 48

const MS_PER_HOUR = 60 * 60 * 1000

type TxClient = Prisma.TransactionClient

type OrderWithItems = Order & {
  items: { productId: string; quantity: number }[]
}

export function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * MS_PER_HOUR)
}

export function validateCancelReason(reason: string): string | null {
  const trimmed = reason.trim()
  if (trimmed.length < CANCEL_REASON_MIN_LENGTH) {
    return `Alasan minimal ${CANCEL_REASON_MIN_LENGTH} karakter`
  }
  if (trimmed.length > 500) {
    return 'Alasan maksimal 500 karakter'
  }
  return null
}

export function isWithinInstantCancelWindow(paidAt: Date | null | undefined, now = new Date()): boolean {
  if (!paidAt) return false
  return now.getTime() <= paidAt.getTime() + INSTANT_CANCEL_MS
}

export function canBuyerInstantCancel(
  order: Pick<Order, 'status' | 'paidAt' | 'processingAt'>,
  hasPendingRequest: boolean,
  now = new Date(),
): boolean {
  if (order.status !== 'PAID') return false
  if (order.processingAt) return false
  if (hasPendingRequest) return false
  return isWithinInstantCancelWindow(order.paidAt, now)
}

export function canBuyerRequestCancellation(
  order: Pick<Order, 'status' | 'paidAt' | 'processingAt'>,
  hasPendingRequest: boolean,
  now = new Date(),
): boolean {
  if (hasPendingRequest) return false
  if (order.status === 'PROCESSING' && !order.processingAt) return true
  if (order.status === 'PROCESSING') return true
  if (order.status === 'PAID' && order.paidAt && !isWithinInstantCancelWindow(order.paidAt, now)) {
    return !order.processingAt
  }
  return false
}

export function canSellerRejectNewOrder(
  order: Pick<Order, 'status' | 'processingAt'>,
): boolean {
  return order.status === 'PAID' && !order.processingAt
}

export function canSellerCancelProcessing(
  order: Pick<Order, 'status'>,
): boolean {
  return order.status === 'PROCESSING'
}

export function canSellerRespondToCancelRequest(
  request: Pick<OrderCancellationRequest, 'status' | 'sellerDeadline'> | null | undefined,
  now = new Date(),
): boolean {
  if (!request || request.status !== 'PENDING') return false
  if (!request.sellerDeadline) return false
  return request.sellerDeadline > now
}

export async function hasBuyerRefundForOrder(orderId: string, buyerId: string): Promise<boolean> {
  const row = await prisma.walletLedger.findFirst({
    where: {
      type: 'REFUND',
      referenceId: orderId,
      wallet: { userId: buyerId },
    },
  })
  return Boolean(row)
}

export async function cancelMarketplaceOrderInTx(
  tx: TxClient,
  order: OrderWithItems,
  opts: {
    cancelledBy: OrderCancelledBy
    cancelReason: string
  },
) {
  await restoreMarketplaceOrderStockInTx(tx, order)

  const isEscrow = order.settlementVersion === 2
  const refundAmount = isEscrow ? order.buyerHoldAmount : order.total

  await refundBuyerHoldForMarketplace(
    tx,
    order.buyerId,
    refundAmount,
    order.id,
    `Refund pembatalan order ${order.orderCode}`,
  )

  if (!isEscrow) {
    await debitSellerForMarketplace(
      tx,
      order.sellerId,
      order.total,
      order.id,
      `Pembatalan penjualan ${order.orderCode}`,
    )
  }

  await tx.orderCancellationRequest.updateMany({
    where: { orderId: order.id, status: 'PENDING' },
    data: { status: 'APPROVED', resolvedAt: new Date() },
  })

  return tx.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      cancelReason: opts.cancelReason,
      cancelledBy: opts.cancelledBy,
      trackingActive: false,
      trackingNextSyncAt: null,
    },
  })
}

export async function expireCancellationRequests(batchSize = 30): Promise<number> {
  const now = new Date()
  const rows = await prisma.orderCancellationRequest.findMany({
    where: {
      status: 'PENDING',
      sellerDeadline: { lt: now },
    },
    take: batchSize,
    select: { id: true },
  })

  if (rows.length === 0) return 0

  await prisma.orderCancellationRequest.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { status: 'EXPIRED', resolvedAt: now },
  })

  return rows.length
}

export type OrderCancellationRequestDto = {
  id: string
  status: OrderCancellationRequest['status']
  statusLabel: string
  kind: OrderCancellationRequest['kind']
  reason: string
  sellerResponse: string | null
  sellerDeadline: string | null
  createdAt: string
}

export function cancellationRequestStatusLabel(
  status: OrderCancellationRequest['status'],
): string {
  switch (status) {
    case 'PENDING':
      return 'Menunggu respons penjual'
    case 'APPROVED':
      return 'Disetujui'
    case 'REJECTED':
      return 'Ditolak penjual'
    case 'WITHDRAWN':
      return 'Ditarik'
    case 'EXPIRED':
      return 'Kedaluwarsa'
  }
}

export function serializeCancellationRequest(
  row: OrderCancellationRequest,
): OrderCancellationRequestDto {
  return {
    id: row.id,
    status: row.status,
    statusLabel: cancellationRequestStatusLabel(row.status),
    kind: row.kind,
    reason: row.reason,
    sellerResponse: row.sellerResponse,
    sellerDeadline: row.sellerDeadline?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}
