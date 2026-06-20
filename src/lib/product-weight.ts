import type { ProductCategory } from '@prisma/client'
import { DEFAULT_SHIPPING_WEIGHT_KG } from '@/lib/shipping-config'

export const MIN_PRODUCT_WEIGHT_KG = 0.1
export const MAX_PRODUCT_WEIGHT_KG = 50

export function categoryRequiresShippingWeight(category: ProductCategory): boolean {
  return category !== 'SOFTWARE'
}

export function parseProductWeightKg(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return n
}

export function validateProductWeightKg(
  weightKg: number | null,
  category: ProductCategory,
): string | null {
  if (!categoryRequiresShippingWeight(category)) return null
  if (weightKg === null || weightKg <= 0) {
    return 'Berat produk wajib diisi untuk produk fisik'
  }
  if (weightKg < MIN_PRODUCT_WEIGHT_KG) {
    return `Berat minimal ${MIN_PRODUCT_WEIGHT_KG} kg`
  }
  if (weightKg > MAX_PRODUCT_WEIGHT_KG) {
    return `Berat maksimal ${MAX_PRODUCT_WEIGHT_KG} kg`
  }
  return null
}

export function resolveProductWeightKg(
  weightKg: number | null | undefined,
  category: ProductCategory,
): number {
  if (!categoryRequiresShippingWeight(category)) return 0
  if (weightKg != null && weightKg > 0) return weightKg
  return DEFAULT_SHIPPING_WEIGHT_KG
}

export type ShippingWeightLine = {
  productId: string
  quantity: number
}
