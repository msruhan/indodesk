import type { CartItem } from '@/lib/cart'

export const OWN_PRODUCT_CHECKOUT_MESSAGE = 'Tidak dapat membeli produk sendiri'

export function isOwnMarketplaceProduct(
  sellerId: string | undefined | null,
  buyerId: string | undefined | null,
): boolean {
  return Boolean(sellerId && buyerId && sellerId === buyerId)
}

export function findOwnProductsInCart(
  items: CartItem[],
  buyerId: string | undefined | null,
): CartItem[] {
  if (!buyerId) return []
  return items.filter((item) => item.type !== 'topup' && item.sellerId === buyerId)
}
