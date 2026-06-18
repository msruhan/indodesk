import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import {
  mapSupportTicketDetail,
  ticketInclude,
} from '@/lib/support-ticket-serializer'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  try {
    const row = await prisma.supportTicket.findFirst({
      where: { id, reporterId: session.user.id },
      include: ticketInclude,
    })
    if (!row) return apiError('Tiket tidak ditemukan', 404)

    if (row.reporterUnread) {
      await prisma.supportTicket.update({
        where: { id },
        data: { reporterUnread: false },
      })
      row.reporterUnread = false
    }

    return apiSuccess(mapSupportTicketDetail(row))
  } catch (e) {
    console.error('[TICKET_GET]', e)
    return apiError('Gagal memuat tiket', 500)
  }
}
