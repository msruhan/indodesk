import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

export function computeSessionFingerprint(ip: string | null, userAgent: string | null): string {
  const ipPrefix = ip?.split('.').slice(0, 3).join('.') ?? 'unknown'
  const raw = `${ipPrefix}|${userAgent ?? ''}`
  return createHash('sha256').update(raw).digest('hex')
}

export async function createUserSession(opts: {
  userId: string
  ip?: string | null
  userAgent?: string | null
  deviceLabel?: string | null
}): Promise<{ id: string; fingerprint: string; isNewDevice: boolean }> {
  const fingerprint = computeSessionFingerprint(opts.ip ?? null, opts.userAgent ?? null)
  const sessionTokenHash = createHash('sha256')
    .update(`${opts.userId}:${Date.now()}:${randomBytes(16).toString('hex')}`)
    .digest('hex')

  const existing = await prisma.userSession.count({
    where: {
      userId: opts.userId,
      fingerprint,
      revokedAt: null,
    },
  })

  const row = await prisma.userSession.create({
    data: {
      userId: opts.userId,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
      fingerprint,
      deviceLabel: opts.deviceLabel ?? null,
      sessionTokenHash,
    },
    select: { id: true },
  })

  return { id: row.id, fingerprint, isNewDevice: existing === 0 }
}

export async function listUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
    select: {
      id: true,
      deviceLabel: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
    },
  })
}

export async function revokeUserSession(sessionId: string, userId: string): Promise<boolean> {
  const result = await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return result.count === 1
}
