import type { TopupOrder, TopupCatalogProduct, TopupDenomination } from '@prisma/client'
import type { OrderStatus } from '@/data/topup-types'

type OrderWithMeta = TopupOrder & {
  product?: Pick<TopupCatalogProduct, 'name' | 'logo' | 'slug'> | null
  denomination?: Pick<TopupDenomination, 'label'> | null
}

export type PublicTopupOrderDto = {
  id: string
  orderCode: string
  productSlug: string
  productName: string
  productLogo: string | null
  denominationLabel: string
  denominationSku: string
  accountId: string
  serverId: string | null
  subtotal: number
  discount: number
  fee: number
  total: number
  paymentMethod: string | null
  status: OrderStatus
  createdAt: string
  paidAt: string | null
  fulfilledAt: string | null
  /** Kode voucher / serial dari provider (mock: disimpan di providerOrderId). */
  fulfillmentCode: string | null
}

export function prismaTopupStatusToUi(status: TopupOrder['status']): OrderStatus {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'pending-payment'
    case 'PAID':
      return 'paid'
    case 'PROCESSING':
      return 'processing'
    case 'FULFILLING':
      return 'fulfilling'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending-payment'
  }
}

export function serializeTopupOrder(
  order: OrderWithMeta,
  productName?: string,
  denominationLabel?: string,
): PublicTopupOrderDto {
  return {
    id: order.id,
    orderCode: order.orderCode,
    productSlug: order.productSlug,
    productName: productName ?? order.product?.name ?? order.productSlug,
    productLogo: order.product?.logo ?? null,
    denominationLabel: denominationLabel ?? order.denomination?.label ?? order.denominationSku,
    denominationSku: order.denominationSku,
    accountId: order.accountId,
    serverId: order.serverId,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    fee: Number(order.fee),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    status: prismaTopupStatusToUi(order.status),
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
    fulfillmentCode:
      order.status === 'COMPLETED' && order.providerOrderId
        ? order.providerOrderId
        : null,
  }
}
