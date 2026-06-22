import { prisma } from '@/lib/db'
import { DEFAULT_INODESK_DOWNLOADS } from '@/lib/indodesk-download'

export async function ensureIndodeskDownloads() {
  for (const row of DEFAULT_INODESK_DOWNLOADS) {
    await prisma.indodeskDownload.upsert({
      where: {
        platform_role: {
          platform: row.platform,
          role: row.role,
        },
      },
      create: row,
      update: {},
    })
  }
}
