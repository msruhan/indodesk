import type {
  Product,
  ProductCategory,
  ProductWarranty,
  TeknisiProfile,
  TeknisiStore,
  User,
  ConditionGrade,
} from '@prisma/client'
import { categoryLabel, PRODUCT_CATEGORY_SLUG } from '@/lib/product-catalog'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
  parseThreeUtoolsImagesField,
  resolveProductImagesForDisplay,
  type ProductImageEntry,
} from '@/lib/product-images'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { parseCompletenessJson, type ProductCompletenessKey } from '@/lib/product-specs'
import {
  couponFromProduct,
  formatCouponLabel,
  type ProductCouponConfig,
} from '@/lib/product-coupon'

export type MarketplaceProductDto = {
  id: string
  name: string
  category: string
  categorySlug: string
  categoryValue: ProductCategory
  price: number
  description: string | null
  image: string | null
  images: ProductImageEntry[]
  threeUtoolsImages: ProductImageEntry[]
  rating: number
  reviewCount: number
  views: number
  stock: number
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
  coupon: ProductCouponConfig | null
  couponLabel: string | null
  benchmark: {
    conditionGrade: ConditionGrade | null
    conditionPercent: number | null
    minusNotes: string | null
    batteryHealth: number | null
    batteryCycle: number | null
    isAllOriginal: boolean | null
    replacedParts: string[]
    trueToneActive: boolean | null
    faceIdWorks: boolean | null
    verified3uTools: boolean
  }
  seller: {
    id: string
    storeId: string | null
    storeName: string
    technicianName: string
    verified: boolean
    rating: number
    totalSales: number
    responseTime: string | null
    location: string | null
    image: string | null
  }
}

type ProductWithSeller = Product & {
  seller: User & {
    teknisiProfile: TeknisiProfile | null
    teknisiStore: TeknisiStore | null
  }
}

export function serializeMarketplaceProduct(p: ProductWithSeller): MarketplaceProductDto {
  const profile = p.seller.teknisiProfile
  const store = p.seller.teknisiStore
  const images = resolveProductImagesForDisplay(parseProductImagesField(p))
  const threeUtoolsImages = resolveProductImagesForDisplay(
    parseThreeUtoolsImagesField(p.threeUtoolsImages),
  )
  const coupon = couponFromProduct(p)

  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categorySlug: PRODUCT_CATEGORY_SLUG[p.category],
    categoryValue: p.category,
    price: Number(p.price),
    description: p.description,
    images,
    threeUtoolsImages,
    image: resolveDisplayImageUrl(getPrimaryProductImageUrl(images, p.image)),
    rating: profile ? Number(profile.rating) : 0,
    reviewCount: profile?.reviewCount ?? 0,
    views: p.views,
    stock: p.stock,
    color: p.color,
    ram: p.ram,
    processor: p.processor,
    storage: p.storage,
    warranty: p.warranty,
    completeness: parseCompletenessJson(p.completeness, p.category),
    coupon,
    couponLabel: coupon ? formatCouponLabel(coupon) : null,
    benchmark: {
      conditionGrade: p.conditionGrade,
      conditionPercent: p.conditionPercent,
      minusNotes: p.minusNotes,
      batteryHealth: p.batteryHealth,
      batteryCycle: p.batteryCycle,
      isAllOriginal: p.isAllOriginal,
      replacedParts: p.replacedParts,
      trueToneActive: p.trueToneActive,
      faceIdWorks: p.faceIdWorks,
      verified3uTools: p.verified3uTools,
    },
    seller: {
      id: p.seller.id,
      storeId: store?.id ?? null,
      storeName: store?.name ?? p.seller.name,
      technicianName: p.seller.name,
      verified: profile?.isVerified ?? false,
      rating: profile ? Number(profile.rating) : 0,
      totalSales: store?.totalSold ?? p.soldCount,
      responseTime: profile?.responseTime ?? null,
      location: store?.city ?? profile?.location ?? null,
      image: resolveDisplayImageUrl(store?.profileImage ?? p.seller.image),
    },
  }
}
