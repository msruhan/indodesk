import type { Product, ProductCategory, ProductCouponDiscountType, ProductWarranty } from '@prisma/client'
import { categoryLabel } from '@/lib/product-catalog'
import { formatCouponLabel, couponFromProduct } from '@/lib/product-coupon'
import {
  formatCompletenessList,
  parseCompletenessJson,
  warrantyLabel,
  type ProductCompletenessKey,
} from '@/lib/product-specs'

export const NEW_PRODUCT_CHANGE_SUMMARY = 'Pengajuan produk baru'

export type ProductContentPatch = {
  name?: string
  category?: ProductCategory
  price?: number
  description?: string | null
  stock?: number
  weightKg?: number
  color?: string
  ram?: string
  processor?: string
  storage?: string
  warranty?: ProductWarranty
  completeness?: ProductCompletenessKey[]
  image?: string | null
  images?: unknown
  couponCode?: string | null
  couponDiscountType?: ProductCouponDiscountType | null
  couponDiscountValue?: number | null
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
    | 'weightKg'
    | 'color'
    | 'ram'
    | 'processor'
    | 'storage'
    | 'warranty'
    | 'completeness'
    | 'image'
    | 'images'
    | 'couponCode'
    | 'couponDiscountType'
    | 'couponDiscountValue'
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
  if (patch.weightKg !== undefined && patch.weightKg !== Number(existing.weightKg)) return true
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
  if (patch.couponCode !== undefined && patch.couponCode !== existing.couponCode) return true
  if (
    patch.couponDiscountType !== undefined &&
    patch.couponDiscountType !== existing.couponDiscountType
  ) {
    return true
  }
  if (patch.couponDiscountValue !== undefined) {
    const prev = existing.couponDiscountValue != null ? Number(existing.couponDiscountValue) : null
    if (patch.couponDiscountValue !== prev) return true
  }
  return false
}

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

/** Human-readable summary of what the teknisi changed before re-submitting for review. */
export function buildProductChangeSummary(
  existing: Pick<
    Product,
    | 'name'
    | 'category'
    | 'price'
    | 'description'
    | 'stock'
    | 'weightKg'
    | 'color'
    | 'ram'
    | 'processor'
    | 'storage'
    | 'warranty'
    | 'completeness'
    | 'image'
    | 'images'
    | 'couponCode'
    | 'couponDiscountType'
    | 'couponDiscountValue'
  >,
  patch: ProductContentPatch,
): string {
  const lines: string[] = []

  if (patch.name !== undefined && patch.name !== existing.name) {
    lines.push(`Nama: ${existing.name} → ${patch.name}`)
  }
  if (patch.category !== undefined && patch.category !== existing.category) {
    lines.push(
      `Kategori: ${categoryLabel(existing.category)} → ${categoryLabel(patch.category)}`,
    )
  }
  if (patch.price !== undefined && patch.price !== Number(existing.price)) {
    lines.push(`Harga: ${formatIdr(Number(existing.price))} → ${formatIdr(patch.price)}`)
  }
  if (
    patch.description !== undefined &&
    patch.description !== (existing.description ?? null)
  ) {
    lines.push('Deskripsi diperbarui')
  }
  if (patch.stock !== undefined && patch.stock !== existing.stock) {
    lines.push(`Stok: ${existing.stock.toLocaleString('id-ID')} → ${patch.stock.toLocaleString('id-ID')}`)
  }
  if (patch.weightKg !== undefined && patch.weightKg !== Number(existing.weightKg)) {
    lines.push(`Berat: ${Number(existing.weightKg)} kg → ${patch.weightKg} kg`)
  }
  if (patch.color !== undefined && patch.color !== existing.color) {
    lines.push(`Warna: ${existing.color || '—'} → ${patch.color || '—'}`)
  }
  if (patch.ram !== undefined && patch.ram !== existing.ram) {
    lines.push(`RAM: ${existing.ram || '—'} → ${patch.ram || '—'}`)
  }
  if (patch.processor !== undefined && patch.processor !== existing.processor) {
    lines.push(`Prosesor: ${existing.processor || '—'} → ${patch.processor || '—'}`)
  }
  if (patch.storage !== undefined && patch.storage !== existing.storage) {
    lines.push(`Penyimpanan: ${existing.storage || '—'} → ${patch.storage || '—'}`)
  }
  if (patch.warranty !== undefined && patch.warranty !== existing.warranty) {
    lines.push(
      `Garansi: ${warrantyLabel(existing.warranty)} → ${warrantyLabel(patch.warranty)}`,
    )
  }
  if (patch.completeness !== undefined) {
    const prev = parseCompletenessJson(existing.completeness, existing.category)
    const next = patch.completeness ?? []
    const prevKey = [...prev].sort().join(',')
    const nextKey = [...next].sort().join(',')
    if (prevKey !== nextKey) {
      lines.push(
        `Kelengkapan: ${formatCompletenessList(prev) || '—'} → ${formatCompletenessList(next) || '—'}`,
      )
    }
  }
  if (patch.image !== undefined && patch.image !== existing.image) {
    lines.push('Foto utama diperbarui')
  }
  if (patch.images !== undefined) {
    const prev = JSON.stringify(existing.images ?? [])
    const next = JSON.stringify(patch.images ?? [])
    if (prev !== next) {
      lines.push('Foto produk diperbarui')
    }
  }

  const prevCoupon = couponFromProduct(existing)
  const nextCoupon =
    patch.couponCode !== undefined ||
    patch.couponDiscountType !== undefined ||
    patch.couponDiscountValue !== undefined
      ? patch.couponCode
        ? {
            code: patch.couponCode,
            discountType: patch.couponDiscountType!,
            discountValue: patch.couponDiscountValue ?? 0,
          }
        : null
      : prevCoupon

  if (JSON.stringify(prevCoupon) !== JSON.stringify(nextCoupon)) {
    if (!nextCoupon) {
      lines.push('Kupon diskon dihapus')
    } else if (!prevCoupon) {
      lines.push(`Kupon baru: ${nextCoupon.code} (${formatCouponLabel(nextCoupon)})`)
    } else {
      lines.push(
        `Kupon: ${prevCoupon.code} (${formatCouponLabel(prevCoupon)}) → ${nextCoupon.code} (${formatCouponLabel(nextCoupon)})`,
      )
    }
  }

  if (lines.length === 0) return 'Perubahan konten produk'
  return lines.join(' · ')
}

/** Any content edit re-queues admin review and hides the listing from marketplace. */
export function applyContentEditReviewReset(data: Record<string, unknown>) {
  data.listingStatus = 'PENDING'
  data.isPublished = false
}

export function queueProductContentReview(
  existing: Pick<
    Product,
    | 'name'
    | 'category'
    | 'price'
    | 'description'
    | 'stock'
    | 'weightKg'
    | 'color'
    | 'ram'
    | 'processor'
    | 'storage'
    | 'warranty'
    | 'completeness'
    | 'image'
    | 'images'
    | 'couponCode'
    | 'couponDiscountType'
    | 'couponDiscountValue'
  >,
  data: Record<string, unknown>,
  patch: ProductContentPatch,
) {
  if (!hasMeaningfulProductContentChange(existing, patch)) return
  applyContentEditReviewReset(data)
  data.pendingChangeSummary = buildProductChangeSummary(existing, patch)
}
