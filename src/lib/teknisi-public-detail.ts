import type { TeknisiPortfolioCase, TeknisiProfile, TeknisiStore, User } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import {
  buildTeknisiAllServices,
  filterServicesByFeatureFlags,
  type TeknisiConsultationService,
} from '@/lib/konsultasi-services'
import type { PublicFeatureFlags } from '@/lib/platform-settings-shared'
import { profileContentFromDb, type TeknisiProfileContent } from '@/lib/teknisi-profile-content'
import { resolveTeknisiBadgeFromProfile } from '@/lib/teknisi-badge'
import type { PublicTeknisiDto } from '@/lib/teknisi-public'
import {
  serializeTeknisiPortfolioCase,
  type TeknisiPortfolioItemDto,
} from '@/lib/teknisi-portfolio'
import type { TeknisiPlatformStatsDto } from '@/lib/teknisi-platform-stats'

export type PublicTeknisiDetailDto = PublicTeknisiDto &
  TeknisiProfileContent & {
  experience: string | null
  coverImage: string | null
  location: string | null
  description: string | null
  responseTime: string | null
  completionRate: number
  isVerified: boolean
  services: TeknisiConsultationService[]
  linkedStore: {
    id: string
    name: string
    city: string | null
    coverImage: string | null
    address: string | null
    layanan: string[]
    rating: number
    reviewCount: number
    verified: boolean
    totalSold: number
  } | null
  portfolio: TeknisiPortfolioItemDto[]
  platformStats: TeknisiPlatformStatsDto
}

type ProfileRow = TeknisiProfile & {
  user: Pick<User, 'id' | 'name' | 'image'> & {
    teknisiStore?: TeknisiStore | null
    teknisiPortfolioCases?: TeknisiPortfolioCase[]
  }
}

export function serializePublicTeknisiDetail(
  profile: ProfileRow,
  platformStats: TeknisiPlatformStatsDto,
  featureFlags?: Pick<PublicFeatureFlags, 'remoteServiceEnabled' | 'inspectionServiceEnabled'>,
): PublicTeknisiDetailDto {
  const base = {
    id: profile.userId,
    userId: profile.userId,
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
    inspectionPriceOnline:
      profile.inspectionPriceOnline != null ? Number(profile.inspectionPriceOnline) : null,
    inspectionPriceOffline:
      profile.inspectionPriceOffline != null ? Number(profile.inspectionPriceOffline) : null,
  }

  const store = profile.user.teknisiStore
  const linkedStore =
    store && store.isPublished
      ? {
          id: store.id,
          name: store.name,
          city: store.city,
          coverImage: resolveDisplayImageUrl(store.coverImage),
          address: store.address,
          layanan: store.layanan,
          rating: Number(profile.rating),
          reviewCount: profile.reviewCount,
          verified: profile.isVerified,
          totalSold: store.totalSold,
        }
      : null

  return {
    ...base,
    experience: profile.experience,
    coverImage: resolveDisplayImageUrl(profile.coverImage),
    location: profile.location,
    description: profile.description,
    responseTime: profile.responseTime,
    completionRate: profile.completionRate,
    isVerified: profile.isVerified,
    ...profileContentFromDb(profile),
    services: featureFlags
      ? filterServicesByFeatureFlags(buildTeknisiAllServices(profile), featureFlags)
      : buildTeknisiAllServices(profile),
    linkedStore,
    portfolio: (profile.user.teknisiPortfolioCases ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(serializeTeknisiPortfolioCase),
    platformStats,
  }
}
