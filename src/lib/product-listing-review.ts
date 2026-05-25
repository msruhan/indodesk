import type { Product, ProductCategory, ProductWarranty } from '@prisma/client'
import type { ProductCompletenessKey } from '@/lib/product-specs'

export type ProductContentPatch = {
  name?: string
  category?: ProductCategory
  price?: number
  description?: string | null
  stock?: number
  color?: string
  ram?: string
  processor?: string
  storage?: string
  warranty?: ProductWarranty
  completeness?: ProductCompletenessKey[]
  image?: string | null
  images?: unknown
}

/** True when at least one content field differs from the stored product. */
export function hasMeaningfulProductContentChange(
  existing: Pick<
    Product,
    | 'name'
    | 'category'
    | 'price'
    | 'description'
    | 'stock'
    | 'color'
    | 'ram'
    | 'processor'
    | 'storage'
    | 'warranty'
    | 'completeness'
    | 'image'
    | 'images'
  >,
  patch: ProductContentPatch,
): boolean {
  if (patch.name !== undefined && patch.name !== existing.name) return true
  if (patch.category !== undefined && patch.category !== existing.category) return true
  if (patch.price !== undefined && patch.price !== Number(existing.price)) return true
  if (
    patch.description !== undefined &&
    patch.description !== (existing.description ?? null)
  ) {
    return true
  }
  if (patch.stock !== undefined && patch.stock !== existing.stock) return true
  if (patch.color !== undefined && patch.color !== existing.color) return true
  if (patch.ram !== undefined && patch.ram !== existing.ram) return true
  if (patch.processor !== undefined && patch.processor !== existing.processor) return true
  if (patch.storage !== undefined && patch.storage !== existing.storage) return true
  if (patch.warranty !== undefined && patch.warranty !== existing.warranty) return true
  if (patch.completeness !== undefined) {
    const prev = JSON.stringify(existing.completeness ?? [])
    const next = JSON.stringify(patch.completeness ?? [])
    if (prev !== next) return true
  }
  if (patch.image !== undefined && patch.image !== existing.image) return true
  if (patch.images !== undefined) {
    const prev = JSON.stringify(existing.images ?? [])
    const next = JSON.stringify(patch.images ?? [])
    if (prev !== next) return true
  }
  return false
}

/** Any content edit re-queues admin review and hides the listing from marketplace. */
export function applyContentEditReviewReset(data: Record<string, unknown>) {
  data.listingStatus = 'PENDING'
  data.isPublished = false
}
