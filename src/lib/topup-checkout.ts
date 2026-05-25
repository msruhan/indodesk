import { Prisma, type TopupStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { ActivityActor } from '@/lib/activity-log'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  calcTopupDiscount,
  generateTopupOrderCode,
  TOPUP_PAYMENT_METHODS,
} from '@/lib/topup-order-config'
import { serializeTopupOrder } from '@/lib/topup-order-serializer'
import { debitUserForTopup } from '@/lib/topup-wallet'

export type TopupCheckoutInput = {
  productSlug: string
  denominationSku: string
  accountId: string
  serverId?: string
  email?: string
  whatsapp?: string
  paymentMethod: string
  promoCode?: string
}

function effectiveDenomPrice(basePrice: Prisma.Decimal, salePrice: Prisma.Decimal | null): Prisma.Decimal {
  return salePrice ?? basePrice
}

/** Simulated fulfillment progression for wallet-paid orders (demo until provider API). */
export async function maybeAdvanceTopupFulfillment(orderId: string) {
  const order = await prisma.topupOrder.findUnique({ where: { id: orderId } })
  if (!order?.paidAt) return order
  if (order.status === 'COMPLETED' || order.status === 'FAILED') return order

  const elapsed = Date.now() - order.paidAt.getTime()
  let next: TopupStatus = order.status
  if (elapsed >= 8_000) next = 'COMPLETED'
  else if (elapsed >= 3_000) next = 'FULFILLING'
  else if (order.status === 'PAID') next = 'PROCESSING'

  if (next === order.status) return order

  return prisma.topupOrder.update({
    where: { id: orderId },
    data: {
      status: next,
      fulfilledAt: next === 'COMPLETED' ? new Date() : order.fulfilledAt,
    },
  })
}

export async function processTopupCheckout(
  userId: string,
  userName: string | null | undefined,
  userEmail: string | null | undefined,
  userRole: 'USER' | 'TEKNISI' | 'ADMIN',
  input: TopupCheckoutInput,
) {
  if (input.paymentMethod !== 'saldo') {
    throw new Error('PAYMENT_NOT_SUPPORTED')
  }

  const method = TOPUP_PAYMENT_METHODS.find((m) => m.id === input.paymentMethod)
  if (!method || method.disabled) throw new Error('PAYMENT_NOT_SUPPORTED')

  const product = await prisma.topupCatalogProduct.findFirst({
    where: { slug: input.productSlug, isActive: true },
    include: {
      denominations: {
        where: { sku: input.denominationSku, isActive: true },
        take: 1,
      },
    },
  })
  if (!product || product.denominations.length === 0) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  const denom = product.denominations[0]
  const accountId = input.accountId.trim()
  if (accountId.length < 3) throw new Error('INVALID_ACCOUNT')
  if (product.serverLabel && !input.serverId?.trim()) {
    throw new Error('SERVER_REQUIRED')
  }

  const subtotalDec = effectiveDenomPrice(denom.basePrice, denom.salePrice)
  const subtotal = Number(subtotalDec)
  const { discount: discountNum } = calcTopupDiscount(subtotal, input.promoCode)
  const discountDec = new Prisma.Decimal(discountNum)
  const feeDec = new Prisma.Decimal(method.fee ?? 0)
  const totalDec = subtotalDec.sub(discountDec).add(feeDec)
  if (totalDec.lessThan(0)) throw new Error('INVALID_TOTAL')

  let orderCode = generateTopupOrderCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.topupOrder.findUnique({ where: { orderCode } })
    if (!exists) break
    orderCode = generateTopupOrderCode()
  }

  const actor: ActivityActor = {
    id: userId,
    name: userName,
    email: userEmail,
    role: userRole,
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.topupOrder.create({
      data: {
        orderCode,
        userId,
        productSlug: product.slug,
        denominationSku: denom.sku,
        accountId,
        serverId: input.serverId?.trim() || null,
        email: input.email?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
        subtotal: subtotalDec,
        discount: discountDec,
        fee: feeDec,
        total: totalDec,
        paymentMethod: input.paymentMethod,
        status: 'PROCESSING',
        paidAt: new Date(),
      },
    })

    await debitUserForTopup(
      tx,
      userId,
      totalDec,
      created.id,
      `Top up ${product.name} — ${denom.label}`,
    )

    await tx.topupCatalogProduct.update({
      where: { id: product.id },
      data: { ordersToday: { increment: 1 } },
    })

    return created
  })

  void logPaymentEvent({
    action: 'topup.paid',
    severity: 'SUCCESS',
    summary: `Top up ${product.name} — ${order.orderCode}`,
    actor,
    target: { type: 'topup_order', id: order.id, label: order.orderCode },
    metadata: { total: Number(order.total), productSlug: product.slug },
  })
  void logOrderEvent({
    action: 'topup.order_created',
    severity: 'INFO',
    summary: `Order topup ${order.orderCode}`,
    actor,
    target: { type: 'topup_order', id: order.id, label: order.orderCode },
  })

  return serializeTopupOrder(
    { ...order, product, denomination: denom },
    product.name,
    denom.label,
  )
}
