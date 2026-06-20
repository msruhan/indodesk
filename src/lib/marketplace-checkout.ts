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
import { DEFAULT_SHIPPING_WEIGHT_KG } from '@/lib/shipping-config'
import { loadWeightBySellerFromLines } from '@/lib/product-weight-server'
import {
  isValidIndonesianPhone,
  normalizeIndonesianPhone,
} from '@/lib/shipping-address'
import { resolveShippingSelectionCost } from '@/lib/shipping-rates-server'

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

export type CheckoutShippingSelection = {
  sellerId: string
  courier: string
  service: string
}

export type MarketplaceCheckoutOptions = {
  shippingAddress?: string | null
  shippingPhone?: string | null
  shippingLocationId?: string | null
  shippingProfile?: {
    cityId?: string | null
    cityLabel?: string | null
    districtId?: string | null
    districtLabel?: string | null
    locationId?: string | null
    locationLabel?: string | null
    street?: string | null
  } | null
  shippingSelections?: CheckoutShippingSelection[]
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
  const phone = normalizeIndonesianPhone(options.shippingPhone ?? '')
  const locationId = options.shippingLocationId?.trim() ?? ''

  if (options.requiresShipping) {
    if (address.length < 10) throw new Error('SHIPPING_ADDRESS_REQUIRED')
    if (!locationId) throw new Error('SHIPPING_LOCATION_REQUIRED')
    if (!phone) throw new Error('SHIPPING_PHONE_REQUIRED')
    if (!isValidIndonesianPhone(phone)) throw new Error('SHIPPING_PHONE_INVALID')
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
      category: true,
      weightKg: true,
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

  const shippingBySeller = new Map<string, { cost: number; courier: string; service: string }>()

  if (options.requiresShipping && locationId) {
    const sellerIds = [...sellerGroups.keys()]
    const selectionMap = new Map(
      (options.shippingSelections ?? []).map((s) => [s.sellerId, s]),
    )
    const weightBySeller = await loadWeightBySellerFromLines(
      lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    )

    for (const sellerId of sellerIds) {
      const picked = selectionMap.get(sellerId)
      if (!picked?.courier || !picked.service) {
        throw new Error('SHIPPING_SELECTION_REQUIRED')
      }
      const sellerWeightKg = Math.max(
        1,
        Math.ceil(weightBySeller[sellerId] ?? DEFAULT_SHIPPING_WEIGHT_KG),
      )
      const resolved = await resolveShippingSelectionCost(
        sellerId,
        locationId,
        picked.courier,
        picked.service,
        sellerWeightKg,
      )
      if (!resolved) throw new Error('SHIPPING_RATE_INVALID')
      shippingBySeller.set(sellerId, {
        cost: resolved.cost,
        courier: picked.courier,
        service: picked.service,
      })
    }
  }

  for (const [sellerId, group] of sellerGroups) {
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
    const itemCount = group.reduce((sum, line) => sum + line.quantity, 0)
    const fees = computeMarketplaceFees(Number(total), platformSettings, itemCount)
    const shippingCost = shippingBySeller.get(sellerId)?.cost ?? 0
    grandHoldTotal = grandHoldTotal.add(fees.buyerHoldAmount).add(shippingCost)
  }

  return {
    address,
    phone,
    locationId,
    sellerGroups,
    enteredCoupon,
    platformSettings,
    grandHoldTotal,
    shippingBySeller,
  }
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
      const itemCount = groupLines.reduce((sum, line) => sum + line.quantity, 0)
      const fees = computeMarketplaceFees(Number(total), ctx.platformSettings, itemCount)
      const shipping = ctx.shippingBySeller.get(sellerId)
      const shippingCost = new Prisma.Decimal(shipping?.cost ?? 0)
      const buyerHoldAmount = fees.buyerHoldAmount.add(shippingCost)
      const sellerNetAmount = fees.sellerNetAmount.add(shippingCost)

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
          buyerHoldAmount,
          sellerNetAmount,
          shippingCost,
          settlementVersion: 2,
          paymentMethod: 'PAYMENT_GATEWAY',
          status: 'AWAITING_PAYMENT',
          checkoutBatchId,
          paymentExpiresAt,
          ...(ctx.address ? { shippingAddress: ctx.address } : {}),
          ...(ctx.phone ? { shippingPhone: ctx.phone } : {}),
          ...(ctx.locationId ? { shippingLocationId: ctx.locationId } : {}),
          ...(shipping
            ? {
                checkoutShippingCourier: shipping.courier,
                shippingService: shipping.service,
              }
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
