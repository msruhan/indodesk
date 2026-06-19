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

/** URL gambar utama produk yang dapat di-fetch Telegram (HTTPS absolut). */
export function resolveTelegramProductPhotoUrl(
  product: ProductImageSource,
  appBaseUrl: string,
): string | null {
  const raw = getPrimaryProductImageUrl(
    parseProductImagesField(product),
    product.image,
  )
  if (!raw?.trim()) return null
  return toTelegramAccessibleImageUrl(raw.trim(), appBaseUrl)
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
