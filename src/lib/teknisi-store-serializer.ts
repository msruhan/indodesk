import type { TeknisiStore, TeknisiProfile } from '@prisma/client'
import { toCardStatus } from '@/lib/product-catalog'

export type TeknisiStoreDto = {
  id: string
  name: string
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  jamWeekdays: string | null
  jamWeekend: string | null
  coverImage: string | null
  layanan: string[]
  badge: string | null
  status: ReturnType<typeof toCardStatus>
  isPublished: boolean
  rating: number
  reviewCount: number
  totalPenjualan: number
  profileViews: number
}

export function serializeTeknisiStore(
  store: TeknisiStore,
  profile?: Pick<TeknisiProfile, 'rating' | 'reviewCount'> | null,
): TeknisiStoreDto {
  return {
    id: store.id,
    name: store.name,
    city: store.city,
    address: store.address,
    phone: store.phone,
    email: store.email,
    jamWeekdays: store.jamWeekdays,
    jamWeekend: store.jamWeekend,
    coverImage: store.coverImage,
    layanan: store.layanan,
    badge: store.badge,
    status: toCardStatus(store.listingStatus),
    isPublished: store.isPublished,
    rating: profile ? Number(profile.rating) : 0,
    reviewCount: profile?.reviewCount ?? 0,
    totalPenjualan: store.totalSold,
    profileViews: store.profileViews,
  }
}
