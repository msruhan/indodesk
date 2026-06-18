import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeOrderPackagingProof } from '@/lib/marketplace-packaging-proof-serializer'
import { PACKAGING_ADMIN_SLA_HOURS } from '@/lib/validations/marketplace-packaging'

export const dynamic = 'force-dynamic'

const MS_PER_HOUR = 60 * 60 * 1000

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED'

  try {
    const cutoff = new Date(Date.now() - PACKAGING_ADMIN_SLA_HOURS * MS_PER_HOUR)
    const rows = await prisma.orderPackagingProof.findMany({
      where: { status },
      include: {
        media: true,
        order: { select: { orderCode: true, total: true, status: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'asc' },
      take: 100,
    })

    return apiSuccess({
      items: rows.map((r) => ({
        ...serializeOrderPackagingProof(r),
        orderCode: r.order.orderCode,
        orderTotal: Number(r.order.total),
        orderStatus: r.order.status,
        sellerName: r.seller.name,
        sellerEmail: r.seller.email,
        overdue24h: Boolean(r.submittedAt && r.submittedAt < cutoff && r.status === 'PENDING'),
      })),
    })
  } catch (e) {
    console.error('[ADMIN_PACKAGING_PROOFS_GET]', e)
    return apiError('Gagal memuat antrian bukti packaging', 500)
  }
}
