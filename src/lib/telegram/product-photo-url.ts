import { isR2PublicUrl } from '@/lib/image-url-utils'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
  type ProductImageEntry,
} from '@/lib/product-images'

type ProductImageSource = {
  image?: string | null
  images?: unknown
}

/** URL semua foto produk (utama dulu) yang dapat di-fetch Telegram. Maks. 10 (batas album Telegram). */
export function resolveTelegramProductPhotoUrls(
  product: ProductImageSource,
  appBaseUrl: string,
): string[] {
  const entries = parseProductImagesField(product)
  const sorted = [...entries].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  const urls: string[] = []
  const seen = new Set<string>()

  for (const entry of sorted) {
    const raw = entry.url?.trim()
    if (!raw) continue
    const resolved = toTelegramAccessibleImageUrl(raw, appBaseUrl)
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      urls.push(resolved)
    }
  }

  if (urls.length === 0 && product.image?.trim()) {
    const legacy = toTelegramAccessibleImageUrl(product.image.trim(), appBaseUrl)
    if (legacy) urls.push(legacy)
  }

  return urls.slice(0, 10)
}

/** URL gambar utama produk — shortcut ke foto pertama. */
export function resolveTelegramProductPhotoUrl(
  product: ProductImageSource,
  appBaseUrl: string,
): string | null {
  return resolveTelegramProductPhotoUrls(product, appBaseUrl)[0] ?? null
}

export function toTelegramAccessibleImageUrl(
  url: string,
  appBaseUrl: string,
): string | null {
  const base = appBaseUrl.replace(/\/$/, '')

  if (url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('http://')) {
    // Telegram membutuhkan HTTPS untuk photo URL
    if (base.startsWith('https://')) {
      if (isR2PublicUrl(url)) return url
    }
    return null
  }

  if (url.startsWith('/')) {
    return `${base}${url}`
  }

  return `${base}/${url}`
}

/** Untuk tes unit — ekspor helper pemilihan primary. */
export function pickPrimaryImageUrl(
  images: ProductImageEntry[],
  legacyImage: string | null | undefined,
): string | null {
  return getPrimaryProductImageUrl(images, legacyImage)
}
