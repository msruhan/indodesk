import type { ProductImageEntry } from '@/lib/product-images'
import type { ProductCompletenessKey } from '@/lib/product-specs'
import type { ProductCategory, ProductWarranty } from '@prisma/client'

export type ApprovalProductDetail = {
  entityType: 'product'
  id: string
  name: string
  category: string
  categoryValue: ProductCategory
  price: number
  stock: number
  color: string
  ram: string
  processor: string
  storage: string
  warranty: ProductWarranty
  completeness: ProductCompletenessKey[]
  description: string | null
  image: string | null
  images: ProductImageEntry[]
  listingStatus: string
  isPublished: boolean
  views: number
  soldCount: number
  createdAt: string
  seller: {
    id: string
    name: string
    email: string
    storeName: string | null
  }
}

export type ApprovalStoreDetail = {
  entityType: 'store'
  id: string
  name: string
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  threads: string | null
  tiktok: string | null
  coverImage: string | null
  gallery: string[]
  layanan: string[]
  operatingHoursLines: string[]
  journeyIntro: string | null
  listingStatus: string
  isPublished: boolean
  profileViews: number
  totalSold: number
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
  }
}

import type { TeknisiApplicationData } from '@/lib/teknisi-registration'

export type ApprovalTeknisiDetail = {
  entityType: 'teknisi'
  userId: string
  name: string
  email: string
  phone: string | null
  specialty: string[]
  experience: string | null
  location: string | null
  description: string | null
  tagline: string | null
  price: number
  coverImage: string | null
  avatar: string | null
  isVerified: boolean
  verificationStatus: string
  rejectionReason: string | null
  applicationData: TeknisiApplicationData | null
  rating: number
  reviewCount: number
  createdAt: string
}

export type ApprovalDetail =
  | ApprovalProductDetail
  | ApprovalStoreDetail
  | ApprovalTeknisiDetail
