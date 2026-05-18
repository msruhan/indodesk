import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { ensureIndodeskDownloads } from '@/lib/indodesk-download-seed'
import { serializeIndodeskDownload } from '@/lib/indodesk-download'

export const dynamic = 'force-dynamic'

/** GET /api/admin/indodesk/downloads */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    await ensureIndodeskDownloads()
    const rows = await prisma.indodeskDownload.findMany({
      orderBy: { platform: 'asc' },
    })
    return apiSuccess(rows.map(serializeIndodeskDownload))
  } catch (e) {
    console.error('[ADMIN_INODESK_DOWNLOADS_GET]', e)
    return apiError('Gagal memuat konfigurasi download', 500)
  }
}
