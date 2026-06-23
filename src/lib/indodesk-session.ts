import type { IndodeskClientRole, IndodeskDevice, KonsultasiSession } from '@prisma/client'
import { prisma } from '@/lib/db'
import { INODESK_UNLOCK_STATUSES } from '@/lib/indodesk-session-policy'

export { INODESK_UNLOCK_STATUSES } from '@/lib/indodesk-session-policy'
export {
  buildIndodeskHeartbeatStatus,
  buildIndodeskSessionPreflight,
  isIndodeskRemoteOtpVisible,
} from '@/lib/indodesk-session-policy'

export async function findUnlockEligibleKonsultasiSession(input: {
  userId: string
  role: IndodeskClientRole
}): Promise<KonsultasiSession | null> {
  return prisma.konsultasiSession.findFirst({
    where: {
      status: { in: [...INODESK_UNLOCK_STATUSES] },
      requiresRemote: true,
      remoteId: { not: null },
      remoteOtp: { not: null },
      ...(input.role === 'TEKNISI'
        ? { teknisiId: input.userId }
        : { userId: input.userId }),
    },
    orderBy: { startedAt: 'desc' },
  })
}

export async function findUnlockEligibleSessionForDevice(
  device: IndodeskDevice,
): Promise<KonsultasiSession | null> {
  return findUnlockEligibleKonsultasiSession({
    userId: device.userId,
    role: device.role,
  })
}
