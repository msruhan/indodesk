import 'server-only'

import { prisma } from '@/lib/db'
import type { ApiSession } from '@/lib/api-auth'

function keyFromPrivateMediaPath(pathSegments: string[]): string {
  const joined = pathSegments.join('/')
  if (joined.startsWith('local/')) return joined
  if (joined.startsWith('private/')) return joined
  return `private/${joined}`
}

export function normalizePrivateMediaKey(pathSegments: string[]): string {
  return keyFromPrivateMediaPath(pathSegments)
}

/**
 * Authorize access to a private media object key.
 */
export async function canAccessPrivateMediaKey(
  key: string,
  session: ApiSession,
): Promise<boolean> {
  if (session.user.role === 'ADMIN') return true

  if (!key.startsWith('private/') && !key.startsWith('local/')) {
    return false
  }

  const parts = key.split('/')
  const folder = key.startsWith('local/') ? parts[1] : parts[1]
  const filename = key.startsWith('local/') ? parts[2] : parts[2]
  if (!folder || !filename) return false

  const ownerPrefix = filename.split('-')[0]
  const urlSuffix = key.startsWith('local/')
    ? key
    : key.replace(/^private\//, '')
  const privateUrl = `/api/media/private/${urlSuffix}`

  if (folder === 'inspection') {
    if (session.user.role === 'TEKNISI' && session.user.id === ownerPrefix) return true
    if (session.user.role === 'USER') {
      const reports = await prisma.inspectionReport.findMany({
        where: { order: { userId: session.user.id } },
        select: { photoUrls: true },
      })
      return reports.some((r) =>
        r.photoUrls.some(
          (u) =>
            u === privateUrl ||
            u.includes(filename) ||
            u.endsWith(`/api/media/private/${key}`),
        ),
      )
    }
    return false
  }

  if (folder === 'ktp') {
    return session.user.id === ownerPrefix
  }

  if (folder === 'certificates') {
    if (session.user.role === 'TEKNISI') return true
    if (session.user.role === 'USER') {
      const order = await prisma.inspectionOrder.findFirst({
        where: {
          userId: session.user.id,
          report: { isNot: null },
        },
        select: { id: true },
      })
      return Boolean(order)
    }
  }

  return false
}
