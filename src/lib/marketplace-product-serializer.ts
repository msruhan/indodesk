import type { Product, ProductCategory, TeknisiProfile, TeknisiStore, User } from '@prisma/client'
import { categoryLabel } from '@/lib/product-catalog'

const categorySlug: Record<ProductCategory, string> = {
  HANDPHONE: 'handphone',
  LAPTOP: 'laptop',
  AKSESORIS: 'aksesoris',
  SOFTWARE: 'software',
}

export type MarketplaceProductDto = {
  id: string
  name: string
  category: string
  categorySlug: string
  categoryValue: ProductCategory
  price: number
  description: string | null
  image: string | null
  rating: number
  reviewCount: number
  views: number
  stock: number
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

  return {
    id: p.id,
    name: p.name,
    category: categoryLabel(p.category),
    categorySlug: categorySlug[p.category],
    categoryValue: p.category,
    price: Number(p.price),
    description: p.description,
    image: p.image,
    rating: profile ? Number(profile.rating) : 0,
    reviewCount: profile?.reviewCount ?? 0,
    views: p.views,
    stock: p.stock,
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
      image: p.seller.image,
    },
  }
}
