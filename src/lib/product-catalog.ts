import type { ProductCategory, ProductListingStatus } from '@prisma/client'

export const PRODUCT_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'HANDPHONE', label: 'Handphone' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'AKSESORIS', label: 'Aksesoris' },
  { value: 'SOFTWARE', label: 'Software' },
]

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

export function formatProductPrice(price: number | string): string {
  const n = typeof price === 'string' ? Number(price) : price
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}
