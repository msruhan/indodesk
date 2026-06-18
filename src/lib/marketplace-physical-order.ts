import type { ProductCategory } from '@prisma/client'

type OrderItemWithCategory = {
  product: { category?: ProductCategory }
}

/** Physical marketplace orders require packaging proof before processing. */
export function orderRequiresPhysicalPackaging(
  items: OrderItemWithCategory[],
): boolean {
  return items.some((i) => i.product.category !== 'SOFTWARE')
}
