import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeRekberPackagingProof } from '@/lib/marketplace-packaging-proof-serializer'
import { PACKAGING_ADMIN_SLA_HOURS } from '@/lib/validations/marketplace-packaging'
import { tryPrismaQuery } from '@/lib/try-prisma-query'

export const dynamic = 'force-dynamic'

const MS_PER_HOUR = 60 * 60 * 1000

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED'

  try {
    const cutoff = new Date(Date.now() - PACKAGING_ADMIN_SLA_HOURS * MS_PER_HOUR)
    const rows = await tryPrismaQuery(
      'admin-rekber-packaging-proofs',
      () =>
        prisma.rekberPackagingProof.findMany({
          where: { status },
          include: {
            media: true,
            rekber: { select: { orderCode: true, amount: true, status: true } },
            seller: { select: { id: true, name: true, email: true } },
          },
          orderBy: { submittedAt: 'asc' },
          take: 100,
        }),
      [],
    )

    return apiSuccess({
      items: rows.map((r) => ({
        ...serializeRekberPackagingProof(r),
        rekberId: r.rekberId,
        orderCode: r.rekber.orderCode,
        orderTotal: Number(r.rekber.amount),
        rekberStatus: r.rekber.status,
        sellerName: r.seller.name,
        sellerEmail: r.seller.email,
        overdue24h: Boolean(r.submittedAt && r.submittedAt < cutoff && r.status === 'PENDING'),
      })),
    })
  } catch (e) {
    console.error('[ADMIN_REKBER_PACKAGING_PROOFS_GET]', e)
    return apiError('Gagal memuat antrian bukti packaging rekber', 500)
  }
}
