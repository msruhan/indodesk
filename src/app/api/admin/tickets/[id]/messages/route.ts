import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { logCommunicationEvent } from '@/lib/activity-log'
import { uploadSupportTicketMediaFiles } from '@/lib/support-ticket-media'
import { mapSupportTicketMessage } from '@/lib/support-ticket-serializer'
import { supportTicketMessageSchema } from '@/lib/validations/support-ticket'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return apiError('Tiket tidak ditemukan', 404)
    if (ticket.status === 'RESOLVED') {
      return apiError('Tiket sudah ditutup', 400)
    }

    const contentType = req.headers.get('content-type') ?? ''
    let body: string
    let isInternal = false
    let files: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      body = String(form.get('body') ?? '')
      isInternal = String(form.get('isInternal') ?? '') === 'true'
      files = form
        .getAll('attachments')
        .filter((f): f is File => f instanceof File && f.size > 0)
    } else {
      const json = await req.json()
      const parsed = supportTicketMessageSchema.parse(json)
      body = parsed.body
      isInternal = parsed.isInternal ?? false
    }

    const parsed = supportTicketMessageSchema.parse({ body, isInternal })

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorId: session.user.id,
        authorRole: 'ADMIN',
        body: parsed.body,
        isInternal: parsed.isInternal ?? false,
      },
      include: {
        author: { select: { id: true, name: true } },
        media: true,
      },
    })

    if (files.length > 0) {
      const uploaded = await uploadSupportTicketMediaFiles(id, session.user.id, files)
      await prisma.supportTicketMedia.createMany({
        data: uploaded.map((u) => ({
          ticketId: id,
          messageId: message.id,
          kind: u.kind,
          url: u.url,
          fileName: u.fileName,
          mimeType: u.mimeType,
          sizeBytes: u.sizeBytes,
        })),
      })
    }

    const ticketUpdate: Record<string, unknown> = {
      lastMessageAt: new Date(),
      assignedAdminId: ticket.assignedAdminId ?? session.user.id,
    }

    if (!parsed.isInternal) {
      ticketUpdate.status = 'WAITING_REPORTER'
      ticketUpdate.reporterUnread = true
      ticketUpdate.adminUnread = false
    }

    if (ticket.status === 'OPEN') {
      ticketUpdate.status = parsed.isInternal ? 'IN_PROGRESS' : 'WAITING_REPORTER'
    }

    await prisma.supportTicket.update({
      where: { id },
      data: ticketUpdate,
    })

    if (!parsed.isInternal) {
      await logCommunicationEvent({
        action: 'ticket.replied',
        summary: `Admin membalas tiket ${ticket.publicId}`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'ADMIN',
        },
        target: { type: 'support_ticket', id: ticket.id, label: ticket.publicId },
      })
    }

    const refreshed = await prisma.supportTicketMessage.findUnique({
      where: { id: message.id },
      include: {
        author: { select: { id: true, name: true } },
        media: true,
      },
    })

    return apiSuccess(refreshed ? mapSupportTicketMessage(refreshed) : null)
  } catch (e) {
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[ADMIN_TICKET_MESSAGE_POST]', e)
    return apiError('Gagal mengirim balasan', 500)
  }
}
