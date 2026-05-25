import 'server-only'

import { deleteProductImage, saveProductImage } from '@/lib/product-image'
import {
  MAX_PRODUCT_IMAGES,
  normalizeProductImages,
  parseProductImagesField,
  type ProductImageEntry,
} from '@/lib/product-images'

type ImageOrderItem = { kind: 'url'; url: string } | { kind: 'file' }

export async function resolveProductImagesFromForm(
  form: FormData,
  sellerId: string,
  existingProduct?: { images?: unknown; image?: string | null },
): Promise<{ images: ProductImageEntry[]; image: string | null }> {
  const orderRaw = form.get('imageOrder')
  const files = form
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0)

  let order: ImageOrderItem[] = []
  if (typeof orderRaw === 'string' && orderRaw.trim()) {
    try {
      const parsed = JSON.parse(orderRaw) as unknown
      if (Array.isArray(parsed)) {
        order = parsed.filter((item): item is ImageOrderItem => {
          if (!item || typeof item !== 'object') return false
          const kind = (item as ImageOrderItem).kind
          if (kind === 'file') return true
          if (kind === 'url' && typeof (item as { url?: string }).url === 'string') return true
          return false
        })
      }
    } catch {
      order = []
    }
  }

  // Legacy fallback: existingImages + appended files
  if (order.length === 0) {
    const existingRaw = form.get('existingImages')
    let keptUrls: string[] = []
    if (typeof existingRaw === 'string' && existingRaw.trim()) {
      try {
        const parsed = JSON.parse(existingRaw) as unknown
        if (Array.isArray(parsed)) {
          keptUrls = parsed.filter((u): u is string => typeof u === 'string' && u.length > 0)
        }
      } catch {
        keptUrls = []
      }
    } else if (existingProduct) {
      keptUrls = parseProductImagesField(existingProduct).map((i) => i.url)
    }
    order = [
      ...keptUrls.map((url) => ({ kind: 'url' as const, url })),
      ...files.map(() => ({ kind: 'file' as const })),
    ]
  }

  const primaryIndex = Math.max(0, Number(String(form.get('primaryIndex') ?? '0')) || 0)
  const mergedUrls: string[] = []
  let fileIdx = 0

  for (const item of order) {
    if (mergedUrls.length >= MAX_PRODUCT_IMAGES) break
    if (item.kind === 'url') {
      mergedUrls.push(item.url)
    } else {
      const file = files[fileIdx++]
      if (!file) continue
      mergedUrls.push(await saveProductImage(file, sellerId))
    }
  }

  const entries: ProductImageEntry[] = mergedUrls.map((url) => ({ url }))
  const images = normalizeProductImages(entries, primaryIndex)
  const image = images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null

  return { images, image }
}

export async function deleteRemovedProductImages(
  before: { images?: unknown; image?: string | null },
  after: { images: ProductImageEntry[] },
): Promise<void> {
  const beforeUrls = new Set(parseProductImagesField(before).map((i) => i.url))
  if (before.image) beforeUrls.add(before.image)
  const afterUrls = new Set(after.images.map((i) => i.url))

  for (const url of beforeUrls) {
    if (!afterUrls.has(url)) {
      await deleteProductImage(url)
    }
  }
}

export async function deleteAllProductImages(product: {
  images?: unknown
  image?: string | null
}): Promise<void> {
  const images = parseProductImagesField(product)
  const urls = new Set<string>()
  for (const item of images) urls.add(item.url)
  if (product.image) urls.add(product.image)
  for (const url of urls) {
    await deleteProductImage(url)
  }
}

export function imagesChanged(
  before: { images?: unknown; image?: string | null },
  after: { images: ProductImageEntry[]; image: string | null },
): boolean {
  const prev = JSON.stringify(parseProductImagesField(before))
  const next = JSON.stringify(after.images)
  return prev !== next || (before.image ?? null) !== after.image
}
