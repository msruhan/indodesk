/** Client-safe helpers for marketplace order cancellation labels. */

export type MarketplaceOrderCancelActor = 'BUYER' | 'SELLER' | 'ADMIN' | 'SYSTEM' | null

export type MarketplaceOrderCancelInfo = {
  status: string
  cancelReason: string | null
  cancelledBy: MarketplaceOrderCancelActor
}

export function marketplaceOrderCancelActorLabel(
  cancelledBy: MarketplaceOrderCancelActor,
): string | null {
  switch (cancelledBy) {
    case 'SELLER':
      return 'penjual'
    case 'BUYER':
      return 'pembeli'
    case 'ADMIN':
      return 'admin'
    case 'SYSTEM':
      return 'sistem'
    default:
      return null
  }
}

export function shouldShowMarketplaceOrderCancelReason(order: MarketplaceOrderCancelInfo): boolean {
  return (
    (order.status === 'cancelled' || order.status === 'refunded') &&
    Boolean(order.cancelReason?.trim())
  )
}
