import { z } from 'zod'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'

export const MAX_PRODUCT_IMAGES = 4

const entrySchema = z.object({
  url: z.string().min(1),
  isPrimary: z.boolean().optional(),
})

export type ProductImageEntry = z.infer<typeof entrySchema>

export function parseProductImages(raw: unknown): ProductImageEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ProductImageEntry[] = []
  for (const item of raw) {
    const parsed = entrySchema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out.slice(0, MAX_PRODUCT_IMAGES)
}

export function getPrimaryProductImageUrl(
  images: ProductImageEntry[],
  legacyImage: string | null | undefined,
): string | null {
  const primary = images.find((i) => i.isPrimary)?.url ?? images[0]?.url
  return primary ?? legacyImage ?? null
}

export function resolveProductImagesForDisplay(images: ProductImageEntry[]): ProductImageEntry[] {
  return images.map((item) => ({
    ...item,
    url: resolveDisplayImageUrl(item.url) ?? item.url,
  }))
}

export function normalizeProductImages(
  images: ProductImageEntry[],
  primaryIndex = 0,
): ProductImageEntry[] {
  const slice = images.slice(0, MAX_PRODUCT_IMAGES)
  if (slice.length === 0) return []
  const idx = Math.min(Math.max(0, primaryIndex), slice.length - 1)
  return slice.map((item, i) => ({
    url: item.url,
    isPrimary: i === idx,
  }))
}

export function productImagesFromLegacy(image: string | null | undefined): ProductImageEntry[] {
  if (!image) return []
  return [{ url: image, isPrimary: true }]
}

export function parseProductImagesField(
  product: { images?: unknown; image?: string | null },
): ProductImageEntry[] {
  const parsed = parseProductImages(product.images)
  if (parsed.length > 0) return parsed
  return productImagesFromLegacy(product.image)
}

export const MAX_THREE_UTOOLS_IMAGES = 4

/**
 * Parse threeUtoolsImages JSON field (same shape as product images).
 * Used for iPhone/iPad hardware quality screenshots from 3uTools.
 */
export function parseThreeUtoolsImagesField(raw: unknown): ProductImageEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ProductImageEntry[] = []
  for (const item of raw) {
    const parsed = entrySchema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out.slice(0, MAX_THREE_UTOOLS_IMAGES)
}
