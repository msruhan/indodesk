import type { TeknisiStore, TeknisiProfile, ProductListingStatus } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { toCardStatus } from '@/lib/product-catalog'
import { journeyFromDb, type StoreJourneyMilestone } from '@/lib/store-content'
import {
  operatingHoursFromDb,
  summarizeOperatingHours,
  type StoreOperatingHours,
} from '@/lib/store-operating-hours'

function resolveStoreHours(store: TeknisiStore) {
  const hours = operatingHoursFromDb(store.operatingHours, {
    jamWeekdays: store.jamWeekdays,
    jamWeekend: store.jamWeekend,
  })
  const summary = summarizeOperatingHours(hours)
  return {
    hours,
    jamWeekdays: summary.jamWeekdays ?? store.jamWeekdays,
    jamWeekend: summary.jamWeekend ?? store.jamWeekend,
  }
}

export type TeknisiStoreDto = {
  id: string
  name: string
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  tiktok: string | null
  jamWeekdays: string | null
  jamWeekend: string | null
  operatingHours: StoreOperatingHours
  profileImage: string | null
  coverImage: string | null
  gallery: string[]
  layanan: string[]
  journeyIntro: string | null
  journey: StoreJourneyMilestone[]
  badge: string | null
  status: ReturnType<typeof toCardStatus>
  listingStatus: ProductListingStatus
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
  const { hours, jamWeekdays, jamWeekend } = resolveStoreHours(store)
  return {
    id: store.id,
    name: store.name,
    city: store.city,
    address: store.address,
    phone: store.phone,
    email: store.email,
    instagram: store.instagram,
    tiktok: store.tiktok,
    jamWeekdays,
    jamWeekend,
    operatingHours: hours,
    profileImage: resolveDisplayImageUrl(store.profileImage),
    coverImage: resolveDisplayImageUrl(store.coverImage),
    gallery: store.gallery.map((url) => resolveDisplayImageUrl(url) ?? url),
    layanan: store.layanan,
    journeyIntro: store.journeyIntro,
    journey: journeyFromDb(store.journey),
    badge: store.badge,
    status: toCardStatus(store.listingStatus),
    listingStatus: store.listingStatus,
    isPublished: store.isPublished,
    rating: profile ? Number(profile.rating) : 0,
    reviewCount: profile?.reviewCount ?? 0,
    totalPenjualan: store.totalSold,
    profileViews: store.profileViews,
  }
}

export type PublicStoreDto = {
  id: string
  name: string
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  threads: string | null
  tiktok: string | null
  jamWeekdays: string | null
  jamWeekend: string | null
  operatingHours: StoreOperatingHours
  profileImage: string | null
  coverImage: string | null
  gallery: string[]
  layanan: string[]
  badge: string | null
  rating: number
  reviewCount: number
  totalPenjualan: number
  profileViews: number
}

export function serializePublicStore(
  store: TeknisiStore,
  profile?: Pick<TeknisiProfile, 'rating' | 'reviewCount'> | null,
): PublicStoreDto {
  const { hours, jamWeekdays, jamWeekend } = resolveStoreHours(store)
  return {
    id: store.id,
    name: store.name,
    city: store.city,
    address: store.address,
    phone: store.phone,
    email: store.email,
    instagram: store.instagram,
    threads: store.threads,
    tiktok: store.tiktok,
    jamWeekdays,
    jamWeekend,
    operatingHours: hours,
    profileImage: resolveDisplayImageUrl(store.profileImage),
    coverImage: resolveDisplayImageUrl(store.coverImage),
    gallery: store.gallery.map((url) => resolveDisplayImageUrl(url) ?? url),
    layanan: store.layanan,
    badge: store.badge,
    rating: profile ? Number(profile.rating) : 0,
    reviewCount: profile?.reviewCount ?? 0,
    totalPenjualan: store.totalSold,
    profileViews: store.profileViews,
  }
}

export type PublicStoreListItemDto = PublicStoreDto & {
  teknisiId: string
}

export function serializePublicStoreListItem(
  store: TeknisiStore,
  profile: Pick<TeknisiProfile, 'rating' | 'reviewCount'> | null | undefined,
  teknisiId: string,
): PublicStoreListItemDto {
  return {
    ...serializePublicStore(store, profile),
    teknisiId,
  }
}

export type PublicStoreProductDto = {
  id: string
  name: string
  price: number
  image: string | null
  category: string
}

export type PublicStoreTeamMemberDto = {
  id: string
  name: string
  image: string | null
  role: 'owner' | 'staff'
  specialty: string[]
  experience: string | null
  isOnline: boolean
  isVerified: boolean
  rating: number
  reviewCount: number
  totalKonsultasi: number
  price: number
}

export type PublicStoreDetailDto = PublicStoreListItemDto & {
  journeyIntro: string | null
  journey: StoreJourneyMilestone[]
  description: string | null
  products: PublicStoreProductDto[]
  team: PublicStoreTeamMemberDto[]
}

export function serializePublicStoreDetail(
  store: TeknisiStore,
  profile:
    | (Pick<TeknisiProfile, 'rating' | 'reviewCount' | 'description'> &
        Partial<Pick<TeknisiProfile, 'specialty' | 'experience' | 'isOnline' | 'isVerified' | 'totalKonsultasi' | 'totalView' | 'price'>>)
    | null
    | undefined,
  teknisiId: string,
  products: PublicStoreProductDto[],
  user?: { name: string; image: string | null },
): PublicStoreDetailDto {
  const team: PublicStoreTeamMemberDto[] = user
    ? [
        {
          id: teknisiId,
          name: user.name,
          image: resolveDisplayImageUrl(user.image),
          role: 'owner',
          specialty: profile?.specialty ?? [],
          experience: profile?.experience ?? null,
          isOnline: profile?.isOnline ?? false,
          isVerified: profile?.isVerified ?? false,
          rating: profile?.rating ? Number(profile.rating) : 0,
          reviewCount: profile?.reviewCount ?? 0,
          totalKonsultasi: profile?.totalKonsultasi ?? 0,
          price: profile?.price ? Number(profile.price) : 0,
        },
      ]
    : []

  return {
    ...serializePublicStoreListItem(store, profile, teknisiId),
    description: profile?.description ?? null,
    journeyIntro: store.journeyIntro,
    journey: journeyFromDb(store.journey),
    products,
    team,
  }
}
