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
import {
  isTopupStressFailAccount,
  isValidMsisdn,
  normalizeMsisdn,
} from '@/lib/topup-account-validation'
import { debitUserForTopup, refundTopupToBuyer } from '@/lib/topup-wallet'
import { walletTransaction } from '@/lib/wallet/transaction'
import { hasWalletLedgerByUser } from '@/lib/wallet/ledger-idempotency'
import { generateTopupPollToken } from '@/lib/topup-poll-token'

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

function generateFulfillmentCode(orderCode: string): string {
  const tail = orderCode.replace(/^TT-/, '').slice(0, 8).toUpperCase()
  return `VC-${tail}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Simulated fulfillment progression for wallet-paid orders (demo until provider API). */
export async function maybeAdvanceTopupFulfillment(orderId: string) {
  const order = await prisma.topupOrder.findUnique({ where: { id: orderId } })
  if (!order?.paidAt) return order
  if (order.status === 'COMPLETED' || order.status === 'FAILED') return order

  const elapsed = Date.now() - order.paidAt.getTime()

  if (isTopupStressFailAccount(order.accountId) && elapsed >= 2_000) {
    return walletTransaction(async (tx) => {
      if (order.userId) {
        const alreadyRefunded = await hasWalletLedgerByUser(
          tx,
          order.userId,
          'REFUND',
          order.id,
        )
        if (alreadyRefunded) {
          return tx.topupOrder.update({
            where: { id: orderId },
            data: { status: 'FAILED', fulfilledAt: new Date() },
          })
        }
      }

      await refundTopupToBuyer(
        tx,
        order.userId!,
        order.total,
        order.id,
        `Refund topup gagal ${order.orderCode}`,
      )
      return tx.topupOrder.update({
        where: { id: orderId },
        data: {
          status: 'FAILED',
          fulfilledAt: new Date(),
        },
      })
    })
  }

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
      providerOrderId:
        next === 'COMPLETED' && !order.providerOrderId
          ? generateFulfillmentCode(order.orderCode)
          : order.providerOrderId,
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
  if (userRole === 'ADMIN') {
    throw new Error('ADMIN_NOT_ALLOWED')
  }

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
  const accountId = normalizeMsisdn(input.accountId.trim())
  if (accountId.length < 3) throw new Error('INVALID_ACCOUNT')
  if (product.category === 'pulsa' && !isValidMsisdn(accountId)) {
    throw new Error('INVALID_MSISDN')
  }
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

  const poll = generateTopupPollToken()

  const order = await walletTransaction(async (tx) => {
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
        pollTokenHash: poll.hash,
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

  return {
    order: serializeTopupOrder(
      { ...order, product, denomination: denom },
      product.name,
      denom.label,
    ),
    pollToken: poll.plain,
  }
}
