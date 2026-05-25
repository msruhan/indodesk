import type { ProductCategory, ProductListingStatus } from '@prisma/client'

export const PRODUCT_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'HANDPHONE', label: 'Handphone' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'AKSESORIS', label: 'Aksesoris' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

export const PRODUCT_CATEGORY_SLUG: Record<ProductCategory, string> = {
  HANDPHONE: 'handphone',
  LAPTOP: 'laptop',
  AKSESORIS: 'aksesoris',
  SOFTWARE: 'software',
  LAINNYA: 'lainnya',
}

export function categoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category
}

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
