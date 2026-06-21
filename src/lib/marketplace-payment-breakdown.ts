import { prisma } from '@/lib/db'
import { getPlatformSettings } from '@/lib/platform-settings'

export type MarketplacePaymentBreakdown = {
  subtotal: number
  discount: number
  buyerFeePercentPart: number
  buyerFlatFeePart: number
  buyerFlatFeePerItem: number
  shippingCost: number
  orderPayable: number
  orderCount: number
  itemCount: number
}

function splitStoredBuyerFee(
  buyerFeeAmount: number,
  itemCount: number,
  buyerFlatFeePerItem: number,
) {
  const flatPart =
    buyerFlatFeePerItem > 0 && itemCount > 0 ? buyerFlatFeePerItem * itemCount : 0
  const percentPart = Math.max(0, buyerFeeAmount - flatPart)
  return { buyerFeePercentPart: percentPart, buyerFlatFeePart: flatPart }
}

export async function loadMarketplacePaymentBreakdown(
  checkoutBatchId: string,
): Promise<MarketplacePaymentBreakdown | null> {
  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { checkoutBatchId },
      include: { items: { select: { quantity: true } } },
    }),
    getPlatformSettings(),
  ])

  if (orders.length === 0) return null

  let subtotal = 0
  let discount = 0
  let shippingCost = 0
  let orderPayable = 0
  let buyerFeePercentPart = 0
  let buyerFlatFeePart = 0
  let itemCount = 0

  for (const order of orders) {
    subtotal += Number(order.subtotal)
    discount += Number(order.discount)
    shippingCost += Number(order.shippingCost)
    orderPayable += Number(order.buyerHoldAmount)

    const orderItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
    itemCount += orderItemCount
    const parts = splitStoredBuyerFee(
      Number(order.buyerFeeAmount),
      orderItemCount,
      settings.buyerFlatFeePerItem,
    )
    buyerFeePercentPart += parts.buyerFeePercentPart
    buyerFlatFeePart += parts.buyerFlatFeePart
  }

  return {
    subtotal,
    discount,
    buyerFeePercentPart,
    buyerFlatFeePart,
    buyerFlatFeePerItem: settings.buyerFlatFeePerItem,
    shippingCost,
    orderPayable,
    orderCount: orders.length,
    itemCount,
  }
}
