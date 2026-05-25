import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const [konsultasiPending, remoteWaiting, marketplacePending, inspectionPending] =
      await Promise.all([
      prisma.konsultasiSession.count({
        where: { teknisiId: session.user.id, status: 'PENDING' },
      }),
      prisma.remoteSession.count({
        where: { teknisiId: session.user.id, status: 'WAITING' },
      }),
      prisma.order.count({
        where: {
          sellerId: session.user.id,
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED'] },
        },
      }),
      prisma.inspectionOrder.count({
        where: { teknisiId: session.user.id, status: 'PAID' },
      }),
    ])

    return apiSuccess({
      konsultasiPending,
      remoteWaiting,
      marketplacePending,
      inspectionPending,
    })
  } catch (e) {
    console.error('[TEKNISI_LAYANAN_COUNTS_GET]', e)
    return apiError('Gagal memuat jumlah layanan', 500)
  }
}
