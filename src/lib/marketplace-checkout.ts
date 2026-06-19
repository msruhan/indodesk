import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { generateMarketplaceOrderCode } from '@/lib/marketplace-order-config'
import { computeMarketplaceFees } from '@/lib/marketplace-fees'
import { getPlatformSettings } from '@/lib/platform-settings'
import { getTripayConfig } from '@/lib/tripay/config'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import type { MarketplaceOrderDto } from '@/lib/marketplace-order-serializer'
import {
  generateCheckoutBatchId,
  MARKETPLACE_PAYMENT_TTL_MS,
} from '@/lib/payments/payment-intent'
import {
  calcLineCouponDiscount,
  couponFromProduct,
  normalizeCouponCode,
  type ProductCouponConfig,
} from '@/lib/product-coupon'

export type CheckoutLineInput = {
  productId: string
  quantity: number
}

const BUYER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const SELLER_SELECT = BUYER_SELECT

type ResolvedLine = {
  productId: string
  quantity: number
  unitPrice: Prisma.Decimal
  coupon: ProductCouponConfig | null
  product: {
    id: string
    name: string
    sellerId: string
    stock: number
  }
}

type TxClient = Prisma.TransactionClient

function groupLinesBySeller(lines: ResolvedLine[]): Map<string, ResolvedLine[]> {
  const map = new Map<string, ResolvedLine[]>()
  for (const line of lines) {
    const list = map.get(line.product.sellerId) ?? []
    list.push(line)
    map.set(line.product.sellerId, list)
  }
  return map
}

export type MarketplaceCheckoutOptions = {
  shippingAddress?: string | null
  shippingPhone?: string | null
  requiresShipping?: boolean
  couponCode?: string | null
}

export type MarketplaceCheckoutResult =
  | { mode: 'paid'; orders: MarketplaceOrderDto[] }
  | {
      mode: 'needs_payment'
      paymentGateway: 'tripay'
      checkoutBatchId: string
      grandHoldTotal: number
      orderIds: string[]
      orders: MarketplaceOrderDto[]
    }

async function reserveStockForLines(tx: TxClient, groupLines: ResolvedLine[]) {
  for (const line of groupLines) {
    const updated = await tx.product.updateMany({
      where: { id: line.productId, stock: { gte: line.quantity } },
      data: {
        stock: { decrement: line.quantity },
        soldCount: { increment: line.quantity },
      },
    })
    if (updated.count === 0) throw new Error('OUT_OF_STOCK')
  }
}

async function resolveCheckoutContext(
  buyerId: string,
  lines: CheckoutLineInput[],
  options: MarketplaceCheckoutOptions,
) {
  if (lines.length === 0) throw new Error('EMPTY_CART')

  const address = options.shippingAddress?.trim() ?? ''
  if (options.requiresShipping && address.length < 10) {
    throw new Error('SHIPPING_ADDRESS_REQUIRED')
  }

  const productIds = [...new Set(lines.map((l) => l.productId))]
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      isPublished: true,
      listingStatus: 'APPROVED',
    },
    select: {
      id: true,
      name: true,
      sellerId: true,
      stock: true,
      price: true,
      couponCode: true,
      couponDiscountType: true,
      couponDiscountValue: true,
    },
  })

  if (products.length !== productIds.length) throw new Error('PRODUCT_NOT_FOUND')

  const productMap = new Map(products.map((p) => [p.id, p]))
  const resolved: ResolvedLine[] = []

  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product) throw new Error('PRODUCT_NOT_FOUND')
    if (product.sellerId === buyerId) throw new Error('OWN_PRODUCT')
    if (line.quantity < 1) throw new Error('INVALID_QUANTITY')
    if (product.stock < line.quantity) throw new Error('OUT_OF_STOCK')
    resolved.push({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: product.price,
      coupon: couponFromProduct(product),
      product: {
        id: product.id,
        name: product.name,
        sellerId: product.sellerId,
        stock: product.stock,
      },
    })
  }

  const sellerGroups = groupLinesBySeller(resolved)
  const enteredCoupon = options.couponCode?.trim()
    ? normalizeCouponCode(options.couponCode)
    : ''

  let totalCouponDiscount = 0
  for (const group of sellerGroups.values()) {
    for (const line of group) {
      const lineSubtotal = Number(line.unitPrice) * line.quantity
      totalCouponDiscount += calcLineCouponDiscount(lineSubtotal, line.coupon, enteredCoupon)
    }
  }

  if (enteredCoupon && totalCouponDiscount <= 0) {
    throw new Error('INVALID_COUPON')
  }

  const platformSettings = await getPlatformSettings()
  let grandHoldTotal = new Prisma.Decimal(0)

  for (const group of sellerGroups.values()) {
    let subtotal = new Prisma.Decimal(0)
    let discount = new Prisma.Decimal(0)
    for (const line of group) {
      const lineSubtotal = line.unitPrice.mul(line.quantity)
      subtotal = subtotal.add(lineSubtotal)
      const lineDiscount = calcLineCouponDiscount(
        Number(lineSubtotal),
        line.coupon,
        enteredCoupon,
      )
      discount = discount.add(new Prisma.Decimal(lineDiscount))
    }
    const total = subtotal.sub(discount)
    const fees = computeMarketplaceFees(Number(total), platformSettings)
    grandHoldTotal = grandHoldTotal.add(fees.buyerHoldAmount)
  }

  return { address, sellerGroups, enteredCoupon, platformSettings, grandHoldTotal }
}

export async function processMarketplaceCheckout(
  buyerId: string,
  buyerName: string | null | undefined,
  buyerEmail: string | null | undefined,
  buyerRole: 'USER' | 'TEKNISI' | 'ADMIN',
  lines: CheckoutLineInput[],
  options: MarketplaceCheckoutOptions = {},
): Promise<MarketplaceCheckoutResult> {
  const ctx = await resolveCheckoutContext(buyerId, lines, options)

  if (!getTripayConfig().isConfigured) {
    throw new Error('PAYMENT_GATEWAY_UNAVAILABLE')
  }

  return createAwaitingPaymentOrders(buyerId, buyerRole, ctx, options)
}

async function createAwaitingPaymentOrders(
  buyerId: string,
  buyerRole: 'USER' | 'TEKNISI' | 'ADMIN',
  ctx: Awaited<ReturnType<typeof resolveCheckoutContext>>,
  options: MarketplaceCheckoutOptions,
): Promise<MarketplaceCheckoutResult> {
  const checkoutBatchId = generateCheckoutBatchId()
  const paymentExpiresAt = new Date(Date.now() + MARKETPLACE_PAYMENT_TTL_MS)

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = []

    for (const [sellerId, groupLines] of ctx.sellerGroups) {
      let subtotal = new Prisma.Decimal(0)
      let discount = new Prisma.Decimal(0)
      for (const line of groupLines) {
        const lineSubtotal = line.unitPrice.mul(line.quantity)
        subtotal = subtotal.add(lineSubtotal)
        const lineDiscount = calcLineCouponDiscount(
          Number(lineSubtotal),
          line.coupon,
          ctx.enteredCoupon,
        )
        discount = discount.add(new Prisma.Decimal(lineDiscount))
      }
      const total = subtotal.sub(discount)
      const fees = computeMarketplaceFees(Number(total), ctx.platformSettings)

      const orderCode = generateMarketplaceOrderCode()
      const order = await tx.order.create({
        data: {
          orderCode,
          buyerId,
          sellerId,
          subtotal,
          discount,
          fee: fees.buyerFeeAmount,
          total,
          buyerFeeAmount: fees.buyerFeeAmount,
          sellerFeeAmount: fees.sellerFeeAmount,
          buyerHoldAmount: fees.buyerHoldAmount,
          sellerNetAmount: fees.sellerNetAmount,
          settlementVersion: 2,
          paymentMethod: 'PAYMENT_GATEWAY',
          status: 'AWAITING_PAYMENT',
          checkoutBatchId,
          paymentExpiresAt,
          ...(ctx.address ? { shippingAddress: ctx.address } : {}),
          ...(options.shippingPhone?.trim()
            ? { shippingPhone: options.shippingPhone.trim() }
            : {}),
          items: {
            create: groupLines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              price: line.unitPrice,
            })),
          },
        },
        include: {
          buyer: { select: BUYER_SELECT },
          seller: { select: SELLER_SELECT },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      })

      await reserveStockForLines(tx, groupLines)
      orders.push(order)
    }

    return orders
  })

  return {
    mode: 'needs_payment',
    paymentGateway: 'tripay',
    checkoutBatchId,
    grandHoldTotal: Number(ctx.grandHoldTotal),
    orderIds: createdOrders.map((o) => o.id),
    orders: createdOrders.map((o) =>
      serializeMarketplaceOrder(o, { viewerId: buyerId, viewerRole: buyerRole }),
    ),
  }
}
