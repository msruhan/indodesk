import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { walletTransaction } from '@/lib/wallet/transaction'
import type { ActivityActor } from '@/lib/activity-log'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import { notifyMarketplaceOrderNew } from '@/lib/telegram/notify'
import { generateMarketplaceOrderCode } from '@/lib/marketplace-order-config'
import { computeMarketplaceFees } from '@/lib/marketplace-fees'
import { getPlatformSettings } from '@/lib/platform-settings'
import { holdBuyerForMarketplace } from '@/lib/marketplace-wallet'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
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

export async function processMarketplaceCheckout(
  buyerId: string,
  buyerName: string | null | undefined,
  buyerEmail: string | null | undefined,
  buyerRole: 'USER' | 'TEKNISI' | 'ADMIN',
  lines: CheckoutLineInput[],
  options: MarketplaceCheckoutOptions = {},
) {
  if (lines.length === 0) {
    throw new Error('EMPTY_CART')
  }

  const address = options.shippingAddress?.trim() ?? ''
  if (options.requiresShipping) {
    if (address.length < 10) {
      throw new Error('SHIPPING_ADDRESS_REQUIRED')
    }
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

  if (products.length !== productIds.length) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

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

  let grandTotal = new Prisma.Decimal(0)
  let totalCouponDiscount = 0
  for (const group of sellerGroups.values()) {
    for (const line of group) {
      const lineSubtotal = Number(line.unitPrice) * line.quantity
      const lineDiscount = calcLineCouponDiscount(lineSubtotal, line.coupon, enteredCoupon)
      totalCouponDiscount += lineDiscount
      grandTotal = grandTotal.add(new Prisma.Decimal(lineSubtotal - lineDiscount))
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

  const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(grandHoldTotal)) throw new Error('INSUFFICIENT_BALANCE')

  const actor: ActivityActor = {
    id: buyerId,
    name: buyerName,
    email: buyerEmail,
    role: buyerRole,
  }

  const createdOrders = await walletTransaction(async (tx) => {
    const orders = []
    let debitReferenceId: string | null = null

    for (const [sellerId, groupLines] of sellerGroups) {
      let subtotal = new Prisma.Decimal(0)
      let discount = new Prisma.Decimal(0)
      for (const line of groupLines) {
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
          status: 'PAID',
          ...(address ? { shippingAddress: address } : {}),
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

      await holdBuyerForMarketplace(
        tx,
        buyerId,
        fees.buyerHoldAmount,
        order.id,
        orderCode,
      )

      orders.push(order)

      void logPaymentEvent({
        action: 'marketplace.paid',
        severity: 'SUCCESS',
        summary: `Checkout ${orderCode}: ${buyerName ?? 'User'} → ${order.seller.name}`,
        actor,
        target: { type: 'marketplace_order', id: order.id, label: orderCode },
        metadata: {
          total: total.toString(),
          discount: discount.toString(),
          buyerHold: fees.buyerHoldAmount.toString(),
          buyerFee: fees.buyerFeeAmount.toString(),
          sellerFee: fees.sellerFeeAmount.toString(),
        },
      })

      void logOrderEvent({
        action: 'marketplace.order_created',
        severity: 'INFO',
        summary: `Order marketplace ${orderCode}`,
        actor,
        target: { type: 'marketplace_order', id: order.id, label: orderCode },
      })

      void notifyMarketplaceOrderNew(order.id)
    }

    if (debitReferenceId) {
      await holdBuyerForMarketplace(
        tx,
        buyerId,
        grandHoldTotal,
        debitReferenceId,
        `Checkout marketplace (${orders.length} pesanan)`,
      )
    }

    return orders
  })

  return createdOrders.map((o) =>
    serializeMarketplaceOrder(o, { viewerId: buyerId, viewerRole: buyerRole }),
  )
}
