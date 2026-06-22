import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { ensureIndodeskDownloads } from '@/lib/indodesk-download-seed'
import { roleSlugToEnum, serializeIndodeskDownload } from '@/lib/indodesk-download'

export const dynamic = 'force-dynamic'

/** GET /api/indodesk/downloads?role=user|teknisi — link download aktif */
export async function GET(req: Request) {
  try {
    await ensureIndodeskDownloads()

    const roleParam = new URL(req.url).searchParams.get('role')
    const roleFilter = roleParam ? roleSlugToEnum(roleParam) : null

    const rows = await prisma.indodeskDownload.findMany({
      where: {
        isActive: true,
        ...(roleFilter ? { role: roleFilter } : {}),
      },
      orderBy: [{ role: 'asc' }, { platform: 'asc' }],
    })

    const downloads = rows.map(serializeIndodeskDownload)
    const latestVersion =
      downloads.length > 0
        ? downloads.reduce((max, d) => (d.version > max ? d.version : max), downloads[0]!.version)
        : '1.3.7'

    return apiSuccess({ version: latestVersion, downloads })
  } catch (e) {
    console.error('[INODESK_DOWNLOADS_GET]', e)
    return apiError('Gagal memuat link download', 500)
  }
}
