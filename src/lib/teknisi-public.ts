import type { TeknisiProfile, User } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import {
  resolveTeknisiBadgeFromProfile,
  type TeknisiBadgeTier,
} from '@/lib/teknisi-badge'

export type PublicTeknisiDto = {
  id: string
  userId: string
  profileSlug: string | null
  name: string
  image: string | null
  isOnline: boolean
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  badge: TeknisiBadgeTier
  specialty: string[]
  price: number
  providesInspection: boolean
}

type ProfileRow = TeknisiProfile & {
  user: Pick<User, 'id' | 'name' | 'image'>
}

export { resolveTeknisiBadgeFromProfile as resolveTeknisiBadge } from '@/lib/teknisi-badge'

export function serializePublicTeknisi(profile: ProfileRow): PublicTeknisiDto {
  return {
    id: profile.userId,
    userId: profile.userId,
    profileSlug: profile.profileSlug,
    name: profile.user.name,
    image: resolveDisplayImageUrl(profile.user.image),
    isOnline: profile.isOnline,
    rating: Number(profile.rating),
    reviewCount: profile.reviewCount,
    totalKonsultasi: profile.totalKonsultasi,
    totalView: profile.totalView,
    badge: resolveTeknisiBadgeFromProfile(profile),
    specialty: profile.specialty,
    price: Number(profile.price),
    providesInspection: profile.providesInspection ?? false,
  }
}
