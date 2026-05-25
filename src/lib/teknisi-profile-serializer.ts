import type { TeknisiProfile, User } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import {
  resolveTeknisiBadgeFromProfile,
  type TeknisiBadgeTier,
} from '@/lib/teknisi-badge'
import {
  profileContentFromDb,
  type TeknisiProfileContent,
} from '@/lib/teknisi-profile-content'

export type TeknisiAccountProfileDto = {
  userId: string
  name: string
  email: string
  phone: string | null
  image: string | null
  specialty: string[]
  experience: string | null
  location: string | null
  description: string | null
  price: number
  responseTime: string | null
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  isOnline: boolean
  isVerified: boolean
  providesInspection: boolean
  inspectionPriceOnline: number | null
  inspectionPriceOffline: number | null
  badge: TeknisiBadgeTier
  coverImage: string | null
} & TeknisiProfileContent

export function serializeTeknisiAccountProfile(
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'image'>,
  profile: TeknisiProfile,
): TeknisiAccountProfileDto {
  const content = profileContentFromDb(profile)
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: resolveDisplayImageUrl(user.image),
    specialty: profile.specialty ?? [],
    experience: profile.experience,
    location: profile.location,
    description: profile.description,
    price: Number(profile.price),
    responseTime: profile.responseTime,
    rating: Number(profile.rating),
    reviewCount: profile.reviewCount,
    totalKonsultasi: profile.totalKonsultasi,
    totalView: profile.totalView,
    isOnline: profile.isOnline,
    isVerified: profile.isVerified,
    providesInspection: profile.providesInspection ?? false,
    inspectionPriceOnline:
      profile.inspectionPriceOnline != null ? Number(profile.inspectionPriceOnline) : null,
    inspectionPriceOffline:
      profile.inspectionPriceOffline != null ? Number(profile.inspectionPriceOffline) : null,
    badge: resolveTeknisiBadgeFromProfile(profile),
    coverImage: resolveDisplayImageUrl(profile.coverImage),
    ...content,
  }
}
