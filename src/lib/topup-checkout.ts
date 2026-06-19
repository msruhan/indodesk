import { Prisma, type TopupStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getTripayConfig } from '@/lib/tripay/config'
import { CATALOG_TOPUP_PAYMENT_TTL_MS } from '@/lib/payments/payment-intent'
import {
  calcTopupDiscount,
  generateTopupOrderCode,
  TOPUP_PAYMENT_METHODS,
} from '@/lib/topup-order-config'
import { serializeTopupOrder, type PublicTopupOrderDto } from '@/lib/topup-order-serializer'
import {
  isTopupStressFailAccount,
  isValidMsisdn,
  normalizeMsisdn,
} from '@/lib/topup-account-validation'
import { refundTopupToBuyer } from '@/lib/topup-wallet'
import { walletTransaction } from '@/lib/wallet/transaction'
import { hasWalletLedgerByUser } from '@/lib/wallet/ledger-idempotency'

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

export type TopupCheckoutResult =
  | { mode: 'paid'; order: PublicTopupOrderDto; pollToken: string }
  | {
      mode: 'needs_payment'
      paymentGateway: 'tripay'
      order: PublicTopupOrderDto
      orderId: string
      total: number
    }

function effectiveDenomPrice(basePrice: Prisma.Decimal, salePrice: Prisma.Decimal | null): Prisma.Decimal {
  return salePrice ?? basePrice
}

function generateFulfillmentCode(orderCode: string): string {
  const tail = orderCode.replace(/^TT-/, '').slice(0, 8).toUpperCase()
  return `VC-${tail}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function resolveTopupCheckout(
  userId: string,
  input: TopupCheckoutInput,
) {
  const method = TOPUP_PAYMENT_METHODS.find((m) => m.id === input.paymentMethod)
  if (!method) throw new Error('PAYMENT_NOT_SUPPORTED')
  if (input.paymentMethod === 'tripay' && !getTripayConfig().isConfigured) {
    throw new Error('PAYMENT_NOT_SUPPORTED')
  }

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

  return { product, denom, accountId, subtotalDec, discountDec, feeDec, totalDec, orderCode, method }
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
  else if (order.status === 'PAID' || order.status === 'PROCESSING') next = 'PROCESSING'

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
): Promise<TopupCheckoutResult> {
  if (userRole === 'ADMIN') {
    throw new Error('ADMIN_NOT_ALLOWED')
  }

  if (input.paymentMethod !== 'tripay') {
    throw new Error('PAYMENT_NOT_SUPPORTED')
  }

  const resolved = await resolveTopupCheckout(userId, input)
  const { product, denom, accountId, discountDec, feeDec, totalDec, orderCode } = resolved

  const paymentExpiresAt = new Date(Date.now() + CATALOG_TOPUP_PAYMENT_TTL_MS)
  const order = await prisma.topupOrder.create({
    data: {
      orderCode,
      userId,
      productSlug: product.slug,
      denominationSku: denom.sku,
      accountId,
      serverId: input.serverId?.trim() || null,
      email: input.email?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      subtotal: resolved.subtotalDec,
      discount: discountDec,
      fee: feeDec,
      total: totalDec,
      paymentMethod: 'tripay',
      status: 'PENDING_PAYMENT',
      paymentExpiresAt,
    },
  })

  return {
    mode: 'needs_payment',
    paymentGateway: 'tripay',
    order: serializeTopupOrder({ ...order, product, denomination: denom }, product.name, denom.label),
    orderId: order.id,
    total: Number(totalDec),
  }
}
