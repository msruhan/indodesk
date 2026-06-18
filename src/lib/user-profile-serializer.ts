import type { User } from '@prisma/client'

export type UserProfileDto = {
  id: string
  name: string
  email: string
  image: string | null
  phone: string | null
  address: string | null
  role: User['role']
  twoFactorEnabled: boolean
  hasPassword: boolean
  googleLinked: boolean
  emailVerified: boolean
  passwordChangedAt: string | null
  createdAt: string
}

export function serializeUserProfile(
  user: User,
  options?: { googleLinked?: boolean },
): UserProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    phone: user.phone,
    address: user.address,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    hasPassword: Boolean(user.password),
    googleLinked: options?.googleLinked ?? false,
    emailVerified: Boolean(user.emailVerified),
    passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }
}
