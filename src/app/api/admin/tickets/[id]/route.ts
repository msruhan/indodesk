import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { logAdminEvent } from '@/lib/activity-log'
import {
  mapSupportTicketDetail,
  ticketInclude,
} from '@/lib/support-ticket-serializer'
import { adminUpdateSupportTicketSchema } from '@/lib/validations/support-ticket'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.supportTicket.findUnique({
      where: { id },
      include: ticketInclude,
    })
    if (!row) return apiError('Tiket tidak ditemukan', 404)

    if (row.adminUnread) {
      await prisma.supportTicket.update({
        where: { id },
        data: { adminUnread: false },
      })
      row.adminUnread = false
    }

    if (row.status === 'OPEN' && !row.assignedAdminId) {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          assignedAdminId: session.user.id,
          status: 'IN_PROGRESS',
        },
      })
      row.assignedAdminId = session.user.id
      row.status = 'IN_PROGRESS'
    }

    return apiSuccess(mapSupportTicketDetail(row, { includeInternal: true }))
  } catch (e) {
    console.error('[ADMIN_TICKET_GET]', e)
    return apiError('Gagal memuat tiket', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const body = adminUpdateSupportTicketSchema.parse(await req.json())
    const existing = await prisma.supportTicket.findUnique({ where: { id } })
    if (!existing) return apiError('Tiket tidak ditemukan', 404)

    const data: Record<string, unknown> = {}
    if (body.priority) data.priority = body.priority
    if (body.assignedAdminId !== undefined) data.assignedAdminId = body.assignedAdminId
    if (body.status) {
      data.status = body.status
      if (body.status === 'RESOLVED') {
        data.resolvedAt = new Date()
        data.reporterUnread = true
        data.adminUnread = false
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      include: ticketInclude,
    })

    if (body.status) {
      await logAdminEvent({
        action: body.status === 'RESOLVED' ? 'ticket.resolved' : 'ticket.status_changed',
        summary: `Tiket ${existing.publicId} → ${body.status}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'ADMIN',
        },
        target: { type: 'support_ticket', id, label: existing.publicId },
        metadata: { from: existing.status, to: body.status },
      })
    }

    if (body.priority && body.priority !== existing.priority) {
      await logAdminEvent({
        action: 'ticket.priority_changed',
        summary: `Prioritas tiket ${existing.publicId} → ${body.priority}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'ADMIN',
        },
        target: { type: 'support_ticket', id, label: existing.publicId },
      })
    }

    return apiSuccess(mapSupportTicketDetail(updated, { includeInternal: true }))
  } catch (e) {
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[ADMIN_TICKET_PATCH]', e)
    return apiError('Gagal memperbarui tiket', 500)
  }
}
