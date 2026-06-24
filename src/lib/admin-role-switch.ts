import 'server-only'

import { UserRole, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { allocateTeknisiProfileSlug } from '@/lib/teknisi-profile-slug-server'

export type AdminRoleTarget = Extract<UserRole, 'USER' | 'TEKNISI'>

export async function ensureUserWallet(userId: string): Promise<void> {
  await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  })
}

export async function buildTeknisiProfileUpsert(
  userId: string,
  name: string,
  isVerified = false,
): Promise<Prisma.TeknisiProfileUpsertWithoutUserInput> {
  const existing = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: { profileSlug: true },
  })
  const profileSlug =
    existing?.profileSlug ?? (await allocateTeknisiProfileSlug(name, userId))

  return {
    create: {
      profileSlug,
      specialty: ['Service HP'],
      verificationStatus: isVerified ? 'APPROVED' : 'PENDING',
      isVerified,
      price: 50000,
    },
    update: {},
  }
}

/** Returns true when role was changed. */
export async function applyAdminRoleSwitch(
  userId: string,
  currentRole: UserRole,
  nextRole: AdminRoleTarget | undefined,
  opts: { name: string; isVerified?: boolean },
): Promise<boolean> {
  if (!nextRole || nextRole === currentRole) return false

  await ensureUserWallet(userId)

  if (nextRole === UserRole.TEKNISI && currentRole === UserRole.USER) {
    const teknisiProfile = await buildTeknisiProfileUpsert(
      userId,
      opts.name,
      opts.isVerified ?? false,
    )
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.TEKNISI,
        teknisiProfile: { upsert: teknisiProfile },
      },
    })
    return true
  }

  if (nextRole === UserRole.USER && currentRole === UserRole.TEKNISI) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.USER },
    })
    return true
  }

  return false
}
