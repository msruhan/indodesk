import type { TeknisiProfile, User } from '@prisma/client'

export type PublicTeknisiDto = {
  id: string
  userId: string
  name: string
  image: string | null
  isOnline: boolean
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  badge: 'newbie' | 'verified' | 'top-teknisi'
  specialty: string[]
  price: number
}

type ProfileRow = TeknisiProfile & {
  user: Pick<User, 'id' | 'name' | 'image'>
}

export function resolveTeknisiBadge(profile: Pick<TeknisiProfile, 'rating' | 'totalKonsultasi' | 'isVerified'>): PublicTeknisiDto['badge'] {
  const rating = Number(profile.rating)
  if (profile.totalKonsultasi >= 400 || rating >= 4.85) return 'top-teknisi'
  if (profile.isVerified) return 'verified'
  return 'newbie'
}

export function serializePublicTeknisi(profile: ProfileRow): PublicTeknisiDto {
  return {
    id: profile.userId,
    userId: profile.userId,
    name: profile.user.name,
    image: profile.user.image,
    isOnline: profile.isOnline,
    rating: Number(profile.rating),
    reviewCount: profile.reviewCount,
    totalKonsultasi: profile.totalKonsultasi,
    totalView: profile.totalView,
    badge: resolveTeknisiBadge(profile),
    specialty: profile.specialty,
    price: Number(profile.price),
  }
}
