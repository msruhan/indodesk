import type { ProductListingStatus } from '@prisma/client'
import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_CATEGORY_SLUG,
  categoryLabel,
} from '@/lib/product-category-config'

export { PRODUCT_CATEGORY_OPTIONS, PRODUCT_CATEGORY_SLUG, categoryLabel }

export type ProductCardStatus = 'approved' | 'pending' | 'draft' | 'rejected'

export function toCardStatus(status: ProductListingStatus): ProductCardStatus {
  if (status === 'APPROVED') return 'approved'
  if (status === 'PENDING') return 'pending'
  if (status === 'REJECTED') return 'rejected'
  return 'draft'
}

/** Label status listing untuk teknisi (produk/toko). */
export function listingStatusLabel(status: ProductListingStatus): string {
  if (status === 'PENDING') return 'Menunggu review oleh Admin'
  if (status === 'APPROVED') return 'Disetujui'
  if (status === 'REJECTED') return 'Ditolak admin'
  return 'Draft'
}

export function formatProductPrice(price: number | string): string {
  const n = typeof price === 'string' ? Number(price) : price
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}
