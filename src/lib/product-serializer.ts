import type { Product } from '@prisma/client'
import { categoryLabel, toCardStatus } from '@/lib/product-catalog'

export type TeknisiProductDto = {
  id: string
  name: string
  category: string
  categoryValue: Product['category']
  price: number
  description: string | null
  image: string | null
  status: ReturnType<typeof toCardStatus>
  listingStatus: Product['listingStatus']
  isPublished: boolean
  views: number
  sold: number
  stock: number
  createdAt: string
}

export function serializeTeknisiProduct(p: Product): TeknisiProductDto {
  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categoryValue: p.category,
    price: Number(p.price),
    description: p.description,
    image: p.image,
    status: toCardStatus(p.listingStatus),
    listingStatus: p.listingStatus,
    isPublished: p.isPublished,
    views: p.views,
    sold: p.soldCount,
    stock: p.stock,
    createdAt: p.createdAt.toISOString().slice(0, 10),
  }
}
