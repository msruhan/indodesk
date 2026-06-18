import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { mapSupportTicketAdminListItem } from '@/lib/support-ticket-serializer'
import type { SupportTicketPriority, SupportTicketStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const status = url.searchParams.get('status') as SupportTicketStatus | null
  const priority = url.searchParams.get('priority') as SupportTicketPriority | null
  const category = url.searchParams.get('category')
  const reporterRole = url.searchParams.get('reporterRole')
  const tab = url.searchParams.get('tab')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (category) where.category = category
  if (reporterRole) where.reporterRole = reporterRole

  if (tab === 'new') where.status = 'OPEN'
  else if (tab === 'processing') where.status = 'IN_PROGRESS'
  else if (tab === 'waiting') where.status = 'WAITING_REPORTER'
  else if (tab === 'resolved') where.status = 'RESOLVED'
  else if (tab === 'unread') where.adminUnread = true

  try {
    const rows = await prisma.supportTicket.findMany({
      where,
      orderBy: [
        { adminUnread: 'desc' },
        { priority: 'desc' },
        { lastMessageAt: 'desc' },
      ],
      take: 200,
      include: {
        reporter: { select: { name: true, email: true } },
        assignedAdmin: { select: { name: true } },
      },
    })

    return apiSuccess({
      items: rows.map(mapSupportTicketAdminListItem),
      stats: {
        open: await prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        unread: await prisma.supportTicket.count({
          where: { adminUnread: true, status: { not: 'RESOLVED' } },
        }),
      },
    })
  } catch (e) {
    console.error('[ADMIN_TICKETS_GET]', e)
    return apiError('Gagal memuat tiket', 500)
  }
}
