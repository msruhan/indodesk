import type { OrderComplaintStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeOrderComplaint } from '@/lib/marketplace-order-complaint-serializer'

export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES: OrderComplaintStatus[] = [
  'OPEN',
  'SELLER_RESPONDED',
  'AWAITING_RETURN',
  'RETURN_SHIPPED',
  'AWAITING_SELLER_CONFIRM',
  'ESCALATED',
]

function complaintStatusesFromParam(param: string): OrderComplaintStatus[] {
  if (param === 'ACTIVE') return ACTIVE_STATUSES
  const single = param as OrderComplaintStatus
  if (ACTIVE_STATUSES.includes(single) || single === 'RESOLVED' || single === 'WITHDRAWN' || single === 'RETURN_EXPIRED') {
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
    const rows = await prisma.orderComplaint.findMany({
      where: { status: { in: statuses } },
      include: {
        media: true,
        order: {
          select: { orderCode: true, total: true, status: true },
        },
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
        ...serializeOrderComplaint(r),
        orderCode: r.order.orderCode,
        orderTotal: Number(r.order.total),
        orderStatus: r.order.status,
        buyerName: r.buyer.name,
        sellerName: r.seller.name,
      })),
    })
  } catch (e) {
    console.error('[ADMIN_COMPLAINTS_GET]', e)
    return apiError('Gagal memuat komplain', 500)
  }
}
