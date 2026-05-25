import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { ActivityActor } from '@/lib/activity-log'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import { generateMarketplaceOrderCode } from '@/lib/marketplace-order-config'
import {
  creditSellerForMarketplace,
  debitBuyerForMarketplace,
} from '@/lib/marketplace-wallet'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'

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

export async function processMarketplaceCheckout(
  buyerId: string,
  buyerName: string | null | undefined,
  buyerEmail: string | null | undefined,
  buyerRole: 'USER' | 'TEKNISI' | 'ADMIN',
  lines: CheckoutLineInput[],
) {
  if (lines.length === 0) {
    throw new Error('EMPTY_CART')
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
      product: {
        id: product.id,
        name: product.name,
        sellerId: product.sellerId,
        stock: product.stock,
      },
    })
  }

  const sellerGroups = groupLinesBySeller(resolved)
  let grandTotal = new Prisma.Decimal(0)
  for (const group of sellerGroups.values()) {
    for (const line of group) {
      grandTotal = grandTotal.add(line.unitPrice.mul(line.quantity))
    }
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } })
  if (!wallet) throw new Error('WALLET_NOT_FOUND')
  if (wallet.balance.lessThan(grandTotal)) throw new Error('INSUFFICIENT_BALANCE')

  const actor: ActivityActor = {
    id: buyerId,
    name: buyerName,
    email: buyerEmail,
    role: buyerRole,
  }

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = []
    let debitReferenceId: string | null = null

    for (const [sellerId, groupLines] of sellerGroups) {
      let subtotal = new Prisma.Decimal(0)
      for (const line of groupLines) {
        subtotal = subtotal.add(line.unitPrice.mul(line.quantity))
      }

      const orderCode = generateMarketplaceOrderCode()
      const order = await tx.order.create({
        data: {
          orderCode,
          buyerId,
          sellerId,
          subtotal,
          discount: 0,
          fee: 0,
          total: subtotal,
          status: 'PAID',
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

      await debitBuyerForMarketplace(
        tx,
        buyerId,
        subtotal,
        order.id,
        `Pembelian marketplace ${orderCode}`,
      )
      await creditSellerForMarketplace(
        tx,
        sellerId,
        subtotal,
        order.id,
        `Penjualan marketplace ${orderCode}`,
      )

      orders.push(order)

      void logPaymentEvent({
        action: 'marketplace.paid',
        severity: 'SUCCESS',
        summary: `Checkout ${orderCode}: ${buyerName ?? 'User'} → ${order.seller.name}`,
        actor,
        target: { type: 'marketplace_order', id: order.id, label: orderCode },
        metadata: { total: subtotal.toString() },
      })

      void logOrderEvent({
        action: 'marketplace.order_created',
        severity: 'INFO',
        summary: `Order marketplace ${orderCode}`,
        actor,
        target: { type: 'marketplace_order', id: order.id, label: orderCode },
      })
    }

    if (debitReferenceId) {
      await debitBuyerForMarketplace(
        tx,
        buyerId,
        grandTotal,
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
