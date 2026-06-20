import type { ProductCategory } from '@prisma/client'
import type { ProductCouponConfig } from '@/lib/product-coupon'

export type CartItemType = 'physical' | 'software' | 'topup'

export interface CartItem {
  id: string
  type: CartItemType
  name: string
  subtitle: string
  image: string
  price: number
  quantity: number
  seller: string
  sellerId?: string
  weightKg?: number
  badge?: string
  coupon?: ProductCouponConfig | null
}

export type ProductForCart = {
  id: string
  name: string
  category: string
  categoryValue?: ProductCategory
  price: number
  image: string | null
  description?: string | null
  stock?: number
  weightKg?: number
  coupon?: ProductCouponConfig | null
  seller: {
    id: string
    storeName: string
  }
}

export function cartTypeFromCategory(category: string, categoryValue?: ProductCategory): CartItemType {
  if (categoryValue === 'SOFTWARE') return 'software'
  const lower = category.toLowerCase()
  if (lower === 'software') return 'software'
  return 'physical'
}

export function productToCartItem(product: ProductForCart, quantity = 1): CartItem {
  const type = cartTypeFromCategory(product.category, product.categoryValue)
  return {
    id: product.id,
    type,
    name: product.name,
    subtitle: product.description?.slice(0, 80) ?? product.category,
    image:
      product.image ??
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    price: product.price,
    quantity,
    seller: product.seller.storeName,
    sellerId: product.seller.id,
    weightKg: product.weightKg,
    badge: product.category,
    coupon: product.coupon ?? null,
  }
}

export const CART_STORAGE_KEY = 'indoteknizi-cart-v1'
