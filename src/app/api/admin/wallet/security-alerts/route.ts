import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'OPEN'

  const rows = await prisma.walletSecurityAlert.findMany({
    where: { status: status as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED' },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  const openCount = await prisma.walletSecurityAlert.count({
    where: { status: 'OPEN', severity: { in: ['HIGH', 'CRITICAL'] } },
  })

  return apiSuccess({
    items: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.user?.name ?? null,
      userEmail: row.user?.email ?? null,
      walletId: row.walletId,
      ruleCode: row.ruleCode,
      severity: row.severity,
      status: row.status,
      title: row.title,
      body: row.body,
      withdrawRequestId: row.withdrawRequestId,
      ledgerId: row.ledgerId,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    })),
    openCriticalCount: openCount,
  })
}
