import { prisma } from '@/lib/db'
import { setCachedSessionVersion } from '@/lib/session-version-cache'

export { getCachedSessionVersion, setCachedSessionVersion } from '@/lib/session-version-cache'

/** Invalidate all active JWT sessions for a user (DB + edge cache). */
export async function bumpSessionVersion(userId: string): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  })
  await setCachedSessionVersion(userId, user.sessionVersion)
  return user.sessionVersion
}
