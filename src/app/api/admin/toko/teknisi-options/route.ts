import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import type { TeknisiStoreOption } from '@/lib/admin-store-serializer'

export const dynamic = 'force-dynamic'

/** Teknisi yang belum punya toko — untuk dropdown tambah toko. */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const teknisi = await prisma.user.findMany({
      where: {
        role: UserRole.TEKNISI,
        teknisiStore: null,
        isActive: true,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })

    const data: TeknisiStoreOption[] = teknisi.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
    }))

    return apiSuccess(data)
  } catch (e) {
    console.error('[ADMIN_TOKO_TEKNISI_OPTIONS_GET]', e)
    return apiError('Gagal memuat daftar teknisi', 500)
  }
}
