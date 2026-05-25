import 'server-only'

import { prisma } from '@/lib/db'

/** Sinkronkan totalKonsultasi = jumlah sesi konsultasi + remote yang sudah selesai. */
export async function syncTeknisiCompletedSessions(teknisiId: string): Promise<number> {
  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId: teknisiId },
    select: { id: true },
  })
  if (!profile) return 0

  const [konsultasiCount, remoteCount] = await Promise.all([
    prisma.konsultasiSession.count({
      where: { teknisiId, status: 'COMPLETED' },
    }),
    prisma.remoteSession.count({
      where: { teknisiId, status: 'COMPLETED' },
    }),
  ])

  const total = konsultasiCount + remoteCount
  await prisma.teknisiProfile.update({
    where: { id: profile.id },
    data: { totalKonsultasi: total },
  })
  return total
}
