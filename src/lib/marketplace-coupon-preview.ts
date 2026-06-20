import { prisma } from '@/lib/db'
import {
  calcLineCouponDiscount,
  couponFromProduct,
  normalizeCouponCode,
} from '@/lib/product-coupon'

export type CouponPreviewLine = {
  productId: string
  quantity: number
}

export async function previewMarketplaceCouponDiscount(
  lines: CouponPreviewLine[],
  couponCode: string | null | undefined,
): Promise<number> {
  const enteredCoupon = couponCode?.trim() ? normalizeCouponCode(couponCode) : ''
  if (!enteredCoupon || lines.length === 0) return 0

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
      price: true,
      couponCode: true,
      couponDiscountType: true,
      couponDiscountValue: true,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))
  let totalDiscount = 0

  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product || line.quantity < 1) continue
    const lineSubtotal = Number(product.price) * line.quantity
    totalDiscount += calcLineCouponDiscount(
      lineSubtotal,
      couponFromProduct(product),
      enteredCoupon,
    )
  }

  return totalDiscount
}

export type CartSyncProduct = {
  id: string
  price: number
  weightKg: number
  coupon: ReturnType<typeof couponFromProduct>
  available: boolean
}

export async function fetchCartProductSync(
  productIds: string[],
): Promise<CartSyncProduct[]> {
  if (productIds.length === 0) return []

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      isPublished: true,
      listingStatus: 'APPROVED',
    },
    select: {
      id: true,
      price: true,
      weightKg: true,
      couponCode: true,
      couponDiscountType: true,
      couponDiscountValue: true,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  return productIds.map((id) => {
    const product = productMap.get(id)
    if (!product) {
      return { id, price: 0, weightKg: 1, coupon: null, available: false }
    }
    return {
      id,
      price: Number(product.price),
      weightKg: Number(product.weightKg),
      coupon: couponFromProduct(product),
      available: true,
    }
  })
}
