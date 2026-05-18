import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Admin platform untuk chat CS / dukungan remote. */
export async function getPlatformSupportAdmin() {
  return prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, image: true },
  })
}
