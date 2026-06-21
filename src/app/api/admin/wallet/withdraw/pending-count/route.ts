import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const count = await prisma.walletWithdrawRequest.count({
      where: { status: { in: ['PENDING', 'REJECT_PENDING_RELEASE'] } },
    })
    return apiSuccess({ count })
  } catch (e) {
    console.error('[ADMIN_WITHDRAW_PENDING_COUNT]', e)
    return apiError('Gagal memuat jumlah penarikan pending', 500)
  }
}
