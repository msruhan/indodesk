import type { Product, ProductWarranty } from '@prisma/client'
import { categoryLabel, toCardStatus } from '@/lib/product-catalog'
import {
  getPrimaryProductImageUrl,
  parseProductImagesField,
  resolveProductImagesForDisplay,
  type ProductImageEntry,
} from '@/lib/product-images'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { parseCompletenessJson, type ProductCompletenessKey } from '@/lib/product-specs'

export type TeknisiProductDto = {
  id: string
  name: string
  category: string
  categoryValue: Product['category']
  price: number
  description: string | null
  image: string | null
  images: ProductImageEntry[]
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
  createdAt: string
}

export function serializeTeknisiProduct(p: Product): TeknisiProductDto {
  const images = resolveProductImagesForDisplay(parseProductImagesField(p))
  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categoryValue: p.category,
    price: Number(p.price),
    description: p.description,
    images,
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
    createdAt: p.createdAt.toISOString().slice(0, 10),
  }
}
