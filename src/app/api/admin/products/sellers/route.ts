import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const sellers = await prisma.user.findMany({
      where: { role: 'TEKNISI' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    return apiSuccess(sellers)
  } catch (e) {
    console.error('[ADMIN_PRODUCTS_SELLERS_GET]', e)
    return apiError('Gagal memuat daftar teknisi', 500)
  }
}
