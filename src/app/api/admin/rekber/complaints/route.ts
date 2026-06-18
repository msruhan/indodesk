import type { RekberComplaintStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeRekberComplaint } from '@/lib/rekber-complaint-serializer'

export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES: RekberComplaintStatus[] = ['OPEN', 'SELLER_RESPONDED', 'ESCALATED']

function complaintStatusesFromParam(param: string): RekberComplaintStatus[] {
  if (param === 'ACTIVE') return ACTIVE_STATUSES
  const single = param as RekberComplaintStatus
  if (
    ACTIVE_STATUSES.includes(single) ||
    single === 'RESOLVED' ||
    single === 'WITHDRAWN'
  ) {
    return [single]
  }
  return ['ESCALATED']
}

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status') ?? 'ESCALATED'
  const statuses = complaintStatusesFromParam(statusParam)

  try {
    const rows = await prisma.rekberComplaint.findMany({
      where: { status: { in: statuses } },
      include: {
        media: true,
        rekber: { select: { orderCode: true, amount: true, status: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy:
        statusParam === 'ACTIVE'
          ? [{ escalatedAt: 'desc' }, { createdAt: 'desc' }]
          : { escalatedAt: 'asc' },
      take: 100,
    })

    return apiSuccess({
      items: rows.map((r) => ({
        ...serializeRekberComplaint(r),
        rekberCode: r.rekber.orderCode,
        rekberAmount: Number(r.rekber.amount),
        rekberStatus: r.rekber.status,
        buyerName: r.buyer.name,
        sellerName: r.seller.name,
      })),
    })
  } catch (e) {
    console.error('[ADMIN_REKBER_COMPLAINTS_GET]', e)
    return apiError('Gagal memuat komplain rekber', 500)
  }
}
