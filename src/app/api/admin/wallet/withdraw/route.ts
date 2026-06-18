import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeWithdrawRequest } from '@/lib/wallet/withdraw'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const rows = await prisma.walletWithdrawRequest.findMany({
    where: status
      ? { status: status as 'PENDING' | 'REJECT_PENDING_RELEASE' | 'COMPLETED' | 'REJECTED' }
      : { status: { in: ['PENDING', 'REJECT_PENDING_RELEASE'] } },
    orderBy: [{ riskScore: 'desc' }, { createdAt: 'asc' }],
    take: 100,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })

  const pendingCount = await prisma.walletWithdrawRequest.count({
    where: { status: { in: ['PENDING', 'REJECT_PENDING_RELEASE'] } },
  })

  return apiSuccess({
    items: rows.map(serializeWithdrawRequest),
    pendingCount,
  })
}
