import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { logCommunicationEvent } from '@/lib/activity-log'
import { uploadSupportTicketMediaFiles } from '@/lib/support-ticket-media'
import { mapSupportTicketMessage } from '@/lib/support-ticket-serializer'
import { supportTicketMessageSchema } from '@/lib/validations/support-ticket'
import type { SupportTicketAuthorRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, reporterId: session.user.id },
    })
    if (!ticket) return apiError('Tiket tidak ditemukan', 404)
    if (ticket.status === 'RESOLVED') {
      return apiError('Tiket sudah ditutup. Buat tiket baru untuk masalah lanjutan.', 400)
    }

    const contentType = req.headers.get('content-type') ?? ''
    let body: string
    let files: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      body = String(form.get('body') ?? '')
      files = form
        .getAll('attachments')
        .filter((f): f is File => f instanceof File && f.size > 0)
    } else {
      const json = await req.json()
      const parsed = supportTicketMessageSchema.parse(json)
      body = parsed.body
    }

    const parsed = supportTicketMessageSchema.parse({ body })

    const authorRole: SupportTicketAuthorRole =
      session.user.role === 'TEKNISI' ? 'TEKNISI' : 'USER'

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorId: session.user.id,
        authorRole,
        body: parsed.body,
        isInternal: false,
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

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        adminUnread: true,
        reporterUnread: false,
        lastMessageAt: new Date(),
      },
    })

    await logCommunicationEvent({
      action: 'ticket.replied',
      summary: `Balasan pada tiket ${ticket.publicId}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'support_ticket', id: ticket.id, label: ticket.publicId },
    })

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
    console.error('[TICKET_MESSAGE_POST]', e)
    return apiError('Gagal mengirim balasan', 500)
  }
}
