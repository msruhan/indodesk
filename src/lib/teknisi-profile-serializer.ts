import type { TeknisiProfile, User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { getTeknisiResponseTimeLabel } from '@/lib/teknisi-platform-stats'
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
  profileSlug: string | null
  name: string
  email: string
  phone: string | null
  image: string | null
  specialty: string[]
  experience: string | null
  location: string | null
  shipOriginCityId: string | null
  shipOriginCityLabel: string | null
  shipOriginDistrictId: string | null
  shipOriginDistrictLabel: string | null
  shipOriginLocationId: string | null
  shipOriginLocationLabel: string | null
  shipOriginStreet: string | null
  shipOriginCouriers: string[]
  description: string | null
  price: number
  /** Estimasi respons dihitung otomatis dari sesi konsultasi & remote. */
  responseTime: string
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  isOnline: boolean
  isVerified: boolean
  isProfileHidden: boolean
  providesInspection: boolean
  inspectionPriceOnline: number | null
  inspectionPriceOffline: number | null
  badge: TeknisiBadgeTier
  coverImage: string | null
} & TeknisiProfileContent

export function serializeTeknisiAccountProfile(
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'image'>,
  profile: TeknisiProfile,
  responseTime: string,
): TeknisiAccountProfileDto {
  const content = profileContentFromDb(profile)
  return {
    userId: user.id,
    profileSlug: profile.profileSlug,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: resolveDisplayImageUrl(user.image),
    specialty: profile.specialty ?? [],
    experience: profile.experience,
    location: profile.location,
    shipOriginCityId: profile.shipOriginCityId,
    shipOriginCityLabel: profile.shipOriginCityLabel,
    shipOriginDistrictId: profile.shipOriginDistrictId,
    shipOriginDistrictLabel: profile.shipOriginDistrictLabel,
    shipOriginLocationId: profile.shipOriginLocationId,
    shipOriginLocationLabel: profile.shipOriginLocationLabel,
    shipOriginStreet: profile.shipOriginStreet,
    shipOriginCouriers: profile.shipOriginCouriers ?? [],
    description: profile.description,
    price: Number(profile.price),
    responseTime,
    rating: Number(profile.rating),
    reviewCount: profile.reviewCount,
    totalKonsultasi: profile.totalKonsultasi,
    totalView: profile.totalView,
    isOnline: profile.isOnline,
    isVerified: profile.isVerified,
    isProfileHidden: profile.isProfileHidden ?? false,
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

export async function loadTeknisiAccountProfile(
  userId: string,
): Promise<TeknisiAccountProfileDto | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teknisiProfile: true },
  })
  if (!user?.teknisiProfile) return null
  const responseTime = await getTeknisiResponseTimeLabel(userId)
  return serializeTeknisiAccountProfile(user, user.teknisiProfile, responseTime)
}
