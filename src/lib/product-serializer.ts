import type { Product, ProductWarranty } from '@prisma/client'
import { categoryLabel, toCardStatus } from '@/lib/product-catalog'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
  parseThreeUtoolsImagesField,
  resolveProductImagesForDisplay,
  type ProductImageEntry,
} from '@/lib/product-images'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { parseCompletenessJson, type ProductCompletenessKey } from '@/lib/product-specs'
import { couponFromProduct, type ProductCouponConfig } from '@/lib/product-coupon'

export type TeknisiProductDto = {
  id: string
  name: string
  category: string
  categoryValue: Product['category']
  deviceType: Product['deviceType']
  price: number
  description: string | null
  image: string | null
  images: ProductImageEntry[]
  threeUtoolsImages: ProductImageEntry[]
  status: ReturnType<typeof toCardStatus>
  listingStatus: Product['listingStatus']
  isPublished: boolean
  views: number
  sold: number
  stock: number
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
  // Benchmark fields
  conditionGrade: Product['conditionGrade']
  conditionPercent: number | null
  minusNotes: string | null
  batteryHealth: number | null
  batteryCycle: number | null
  isAllOriginal: boolean | null
  replacedParts: string[]
  trueToneActive: boolean | null
  faceIdWorks: boolean | null
  verified3uTools: boolean
  coupon: ProductCouponConfig | null
  createdAt: string
}

export function serializeTeknisiProduct(p: Product): TeknisiProductDto {
  const images = resolveProductImagesForDisplay(parseProductImagesField(p))
  const threeUtoolsImages = resolveProductImagesForDisplay(
    parseThreeUtoolsImagesField(p.threeUtoolsImages),
  )
  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categoryValue: p.category,
    deviceType: p.deviceType,
    price: Number(p.price),
    description: p.description,
    images,
    threeUtoolsImages,
    image: resolveDisplayImageUrl(getPrimaryProductImageUrl(images, p.image)),
    status: toCardStatus(p.listingStatus),
    listingStatus: p.listingStatus,
    isPublished: p.isPublished,
    views: p.views,
    sold: p.soldCount,
    stock: p.stock,
    color: p.color,
    ram: p.ram,
    processor: p.processor,
    storage: p.storage,
    warranty: p.warranty,
    completeness: parseCompletenessJson(p.completeness, p.category),
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
    coupon: couponFromProduct(p),
    createdAt: p.createdAt.toISOString().slice(0, 10),
  }
}
