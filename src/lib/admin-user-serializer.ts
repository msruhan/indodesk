import type { TeknisiProfile, User } from '@prisma/client'
import {
  getTeknisiBadgeLabel,
  resolveTeknisiBadgeFromProfile,
} from '@/lib/teknisi-badge'

export type AdminUserDto = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  twoFactorEnabled: boolean
  hasPending2faSetup: boolean
  joinDate: string
  totalOrder: number
}

export type AdminTeknisiDto = {
  id: string
  name: string
  email: string
  phone: string | null
  rating: number
  totalKonsultasi: number
  badge: string
  status: 'verified' | 'pending'
  isVerified: boolean
  twoFactorEnabled: boolean
  hasPending2faSetup: boolean
  specialty: string[]
  experience: string | null
  location: string | null
  description: string | null
}

type UserWithOrders = User & {
  _count?: { ordersAsBuyer: number }
}

export function teknisiBadge(
  profile: Pick<TeknisiProfile, 'isVerified' | 'rating' | 'reviewCount' | 'totalKonsultasi'>,
): string {
  return getTeknisiBadgeLabel(resolveTeknisiBadgeFromProfile(profile))
}

export function serializeAdminUser(u: UserWithOrders): AdminUserDto {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: 'User',
    isActive: u.isActive,
    twoFactorEnabled: u.twoFactorEnabled,
    hasPending2faSetup: Boolean(u.twoFactorSecret && !u.twoFactorEnabled),
    joinDate: u.createdAt.toISOString(),
    totalOrder: u._count?.ordersAsBuyer ?? 0,
  }
}

export function serializeAdminTeknisi(
  u: User & { teknisiProfile: TeknisiProfile | null },
): AdminTeknisiDto | null {
  const profile = u.teknisiProfile
  if (!profile) return null

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    rating: Number(profile.rating),
    totalKonsultasi: profile.totalKonsultasi,
    badge: teknisiBadge(profile),
    status: profile.isVerified ? 'verified' : 'pending',
    isVerified: profile.isVerified,
    twoFactorEnabled: u.twoFactorEnabled,
    hasPending2faSetup: Boolean(u.twoFactorSecret && !u.twoFactorEnabled),
    specialty: profile.specialty,
    experience: profile.experience,
    location: profile.location,
    description: profile.description,
  }
}
