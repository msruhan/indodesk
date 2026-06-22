import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeIndodeskDevice } from '@/lib/indodesk-device'

export const dynamic = 'force-dynamic'

/** GET /api/indodesk/devices — perangkat IndoDesk yang terhubung */
export async function GET() {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.indodeskDevice.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
    return apiSuccess({ items: rows.map(serializeIndodeskDevice) })
  } catch (e) {
    console.error('[INODESK_DEVICES_GET]', e)
    return apiError('Gagal memuat perangkat', 500)
  }
}
