import type { Prisma as PrismaNamespace } from '@prisma/client'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import { generateTopupPollToken } from '@/lib/topup-poll-token'

export async function fulfillCatalogTopupInTx(
  tx: PrismaNamespace.TransactionClient,
  orderId: string,
): Promise<{ ok: true; orderCode: string; pollToken: string } | { ok: false; error: string }> {
  const order = await tx.topupOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!order) return { ok: false, error: 'Order topup tidak ditemukan' }
  if (order.status !== 'PENDING_PAYMENT') {
    if (order.paidAt) {
      return { ok: true, orderCode: order.orderCode, pollToken: '' }
    }
    return { ok: false, error: 'Order tidak menunggu pembayaran' }
  }
  if (order.paymentExpiresAt && order.paymentExpiresAt < new Date()) {
    await tx.topupOrder.update({
      where: { id: order.id },
      data: { status: 'FAILED', fulfilledAt: new Date() },
    })
    return { ok: false, error: 'Pembayaran kedaluwarsa' }
  }

  const poll = generateTopupPollToken()

  await tx.topupOrder.update({
    where: { id: order.id },
    data: {
      status: 'PROCESSING',
      paidAt: new Date(),
      pollTokenHash: poll.hash,
      paymentExpiresAt: null,
    },
  })

  const product = await tx.topupCatalogProduct.findFirst({
    where: { slug: order.productSlug },
    select: { id: true, name: true },
  })
  if (product) {
    await tx.topupCatalogProduct.update({
      where: { id: product.id },
      data: { ordersToday: { increment: 1 } },
    })
  }

  const actor = order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        role: 'USER' as const,
      }
    : undefined

  void logPaymentEvent({
    action: 'topup.paid',
    severity: 'SUCCESS',
    summary: `Top up Tripay ${product?.name ?? order.productSlug} — ${order.orderCode}`,
    actor,
    target: { type: 'topup_order', id: order.id, label: order.orderCode },
    metadata: { total: Number(order.total), productSlug: order.productSlug, gateway: true },
  })
  void logOrderEvent({
    action: 'topup.order_created',
    severity: 'INFO',
    summary: `Order topup ${order.orderCode} (Tripay)`,
    actor,
    target: { type: 'topup_order', id: order.id, label: order.orderCode },
  })

  return { ok: true, orderCode: order.orderCode, pollToken: poll.plain }
}

export async function cancelCatalogTopupAwaitingPaymentInTx(
  tx: PrismaNamespace.TransactionClient,
  orderId: string,
) {
  const order = await tx.topupOrder.findUnique({ where: { id: orderId } })
  if (!order || order.status !== 'PENDING_PAYMENT') return

  await tx.topupOrder.update({
    where: { id: orderId },
    data: {
      status: 'FAILED',
      fulfilledAt: new Date(),
      paymentExpiresAt: null,
    },
  })
}
