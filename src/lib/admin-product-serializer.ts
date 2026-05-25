import type { Product, ProductCategory, ProductListingStatus, User } from '@prisma/client'
import { categoryLabel, PRODUCT_CATEGORY_SLUG, toCardStatus } from '@/lib/product-catalog'

export type AdminProductDto = {
  id: string
  name: string
  category: string
  categorySlug: string
  categoryValue: ProductCategory
  price: number
  description: string | null
  image: string | null
  status: ReturnType<typeof toCardStatus>
  listingStatus: ProductListingStatus
  isPublished: boolean
  isActive: boolean
  views: number
  stock: number
  seller: {
    id: string
    name: string
  }
}

type ProductWithSeller = Product & {
  seller: Pick<User, 'id' | 'name'>
}

export function serializeAdminProduct(p: ProductWithSeller): AdminProductDto {
  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categorySlug: PRODUCT_CATEGORY_SLUG[p.category],
    categoryValue: p.category,
    price: Number(p.price),
    description: p.description,
    image: p.image,
    status: toCardStatus(p.listingStatus),
    listingStatus: p.listingStatus,
    isPublished: p.isPublished,
    isActive: p.isActive,
    views: p.views,
    stock: p.stock,
    seller: {
      id: p.seller.id,
      name: p.seller.name,
    },
  }
}

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
