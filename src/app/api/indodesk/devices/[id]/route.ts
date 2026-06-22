import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** DELETE /api/indodesk/devices/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.indodeskDevice.findUnique({ where: { id } })
    if (!existing) return apiError('Perangkat tidak ditemukan', 404)
    if (existing.userId !== session.user.id) {
      return apiError('Akses ditolak', 403)
    }

    await prisma.indodeskDevice.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[INODESK_DEVICES_DELETE]', e)
    return apiError('Gagal menghapus perangkat', 500)
  }
}
