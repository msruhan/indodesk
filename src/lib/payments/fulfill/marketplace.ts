import type { Prisma as PrismaNamespace } from '@prisma/client'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import type { ActivityActor } from '@/lib/activity-log'
import { notifyMarketplaceOrderNew } from '@/lib/telegram/notify'

type OrderWithItems = {
  id: string
  orderCode: string
  buyerId: string
  sellerId: string
  total: { toString(): string }
  buyerHoldAmount: { toString(): string }
  status: string
  items: { productId: string; quantity: number }[]
}

export async function restoreMarketplaceOrderStockInTx(
  tx: PrismaNamespace.TransactionClient,
  order: OrderWithItems,
) {
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        soldCount: { decrement: item.quantity },
      },
    })
  }
}

export async function fulfillMarketplacePaymentInTx(
  tx: PrismaNamespace.TransactionClient,
  checkoutBatchId: string,
  actor?: ActivityActor,
): Promise<{ ok: true; orderIds: string[] } | { ok: false; error: string }> {
  const orders = await tx.order.findMany({
    where: { checkoutBatchId, status: 'AWAITING_PAYMENT' },
    include: {
      items: { select: { productId: true, quantity: true } },
      seller: { select: { name: true } },
    },
  })

  if (orders.length === 0) {
    return { ok: false, error: 'Pesanan tidak ditemukan atau sudah dibayar' }
  }

  const now = new Date()
  const orderIds: string[] = []

  for (const order of orders) {
    if (order.paymentExpiresAt && order.paymentExpiresAt < now) {
      await restoreMarketplaceOrderStockInTx(tx, order)
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelReason: 'Pembayaran kedaluwarsa' },
      })
      return { ok: false, error: 'Pembayaran kedaluwarsa' }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID', paymentExpiresAt: null, paidAt: now },
    })
    orderIds.push(order.id)

    void logPaymentEvent({
      action: 'marketplace.paid',
      severity: 'SUCCESS',
      summary: `Checkout PG ${order.orderCode}`,
      actor,
      target: { type: 'marketplace_order', id: order.id, label: order.orderCode },
      metadata: {
        total: order.total.toString(),
        buyerHold: order.buyerHoldAmount.toString(),
        paymentMethod: 'PAYMENT_GATEWAY',
      },
    })

    void logOrderEvent({
      action: 'marketplace.order_created',
      severity: 'INFO',
      summary: `Order marketplace ${order.orderCode} (Tripay)`,
      actor,
      target: { type: 'marketplace_order', id: order.id, label: order.orderCode },
    })

    void notifyMarketplaceOrderNew(order.id)
  }

  return { ok: true, orderIds }
}

export async function cancelMarketplaceAwaitingPaymentInTx(
  tx: PrismaNamespace.TransactionClient,
  checkoutBatchId: string,
  cancelReason = 'Pembayaran dibatalkan atau kedaluwarsa',
  cancelledBy: 'BUYER' | 'SYSTEM' = 'SYSTEM',
) {
  const orders = await tx.order.findMany({
    where: { checkoutBatchId, status: 'AWAITING_PAYMENT' },
    include: { items: { select: { productId: true, quantity: true } } },
  })

  for (const order of orders) {
    await restoreMarketplaceOrderStockInTx(tx, order)
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelReason,
        cancelledBy,
        paymentExpiresAt: null,
      },
    })
  }
}
