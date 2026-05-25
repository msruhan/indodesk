import { prisma } from '@/lib/db'

/** Set status ketersediaan teknisi di profil publik (listing / konsultasi). */
export async function setTeknisiPresence(userId: string, isOnline: boolean): Promise<void> {
  await prisma.teknisiProfile.updateMany({
    where: { userId },
    data: { isOnline },
  })
}
