import { prisma } from '@/lib/db'
import {
  TEKNISI_LOGIN_BLOCKED,
  type TeknisiLoginBlockCode,
  teknisiLoginBlockMessage,
} from '@/lib/teknisi-verification'

export type TeknisiLoginGuardResult =
  | { allowed: true }
  | { allowed: false; code: TeknisiLoginBlockCode; message: string }

export async function checkTeknisiLoginGuard(
  userId: string,
  role: string,
): Promise<TeknisiLoginGuardResult> {
  if (role !== 'TEKNISI') return { allowed: true }

  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId },
    select: { verificationStatus: true, rejectionReason: true },
  })

  if (!profile) {
    return {
      allowed: false,
      code: TEKNISI_LOGIN_BLOCKED.NO_PROFILE,
      message: teknisiLoginBlockMessage(TEKNISI_LOGIN_BLOCKED.NO_PROFILE),
    }
  }

  if (profile.verificationStatus === 'PENDING') {
    return {
      allowed: false,
      code: TEKNISI_LOGIN_BLOCKED.PENDING,
      message: teknisiLoginBlockMessage(TEKNISI_LOGIN_BLOCKED.PENDING),
    }
  }

  if (profile.verificationStatus === 'REJECTED') {
    return {
      allowed: false,
      code: TEKNISI_LOGIN_BLOCKED.REJECTED,
      message: teknisiLoginBlockMessage(
        TEKNISI_LOGIN_BLOCKED.REJECTED,
        profile.rejectionReason,
      ),
    }
  }

  return { allowed: true }
}
