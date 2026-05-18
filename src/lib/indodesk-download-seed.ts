import { prisma } from '@/lib/db'
import { DEFAULT_INODESK_DOWNLOADS } from '@/lib/indodesk-download'

export async function ensureIndodeskDownloads() {
  const count = await prisma.indodeskDownload.count()
  if (count > 0) return

  for (const row of DEFAULT_INODESK_DOWNLOADS) {
    await prisma.indodeskDownload.create({ data: row })
  }
}
