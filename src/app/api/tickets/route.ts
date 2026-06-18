import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { logCommunicationEvent } from '@/lib/activity-log'
import { generateSupportTicketPublicId } from '@/lib/support-ticket-public-id'
import { uploadSupportTicketMediaFiles } from '@/lib/support-ticket-media'
import {
  verifyRelatedServiceOwnership,
  fetchRelatedServicesForReporter,
} from '@/lib/support-ticket-related-services'
import { buildRelatedServiceSnapshot } from '@/lib/support-ticket-snapshot'
import {
  mapSupportTicketListItem,
  ticketInclude,
  mapSupportTicketDetail,
} from '@/lib/support-ticket-serializer'
import {
  SUPPORT_TICKET_RATE_LIMIT,
  SUPPORT_TICKET_RATE_WINDOW_SECONDS,
} from '@/lib/support-ticket-constants'
import { createSupportTicketSchema } from '@/lib/validations/support-ticket'
import type { SupportTicketReporterRole, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  try {
    const rows = await prisma.supportTicket.findMany({
      where: { reporterId: session.user.id },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    })
    return apiSuccess(rows.map(mapSupportTicketListItem))
  } catch (e) {
    console.error('[TICKETS_GET]', e)
    return apiError('Gagal memuat tiket', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  const rate = checkRateLimit(`ticket-create:${session.user.id}`, {
    limit: SUPPORT_TICKET_RATE_LIMIT,
    windowSeconds: SUPPORT_TICKET_RATE_WINDOW_SECONDS,
  })
  if (!rate.allowed) {
    return apiError('Terlalu banyak tiket dibuat. Coba lagi nanti.', 429)
  }

  try {
    const form = await req.formData()
    const payload = createSupportTicketSchema.parse({
      category: String(form.get('category') ?? ''),
      priority: String(form.get('priority') ?? 'NORMAL'),
      subject: String(form.get('subject') ?? ''),
      description: String(form.get('description') ?? ''),
      relatedType: form.get('relatedType') ? String(form.get('relatedType')) : null,
      relatedId: form.get('relatedId') ? String(form.get('relatedId')) : null,
      relatedLabel: form.get('relatedLabel') ? String(form.get('relatedLabel')) : null,
      relatedManualNote: form.get('relatedManualNote')
        ? String(form.get('relatedManualNote'))
        : null,
      previousTicketId: form.get('previousTicketId')
        ? String(form.get('previousTicketId'))
        : null,
    })

    if (payload.previousTicketId) {
      const prev = await prisma.supportTicket.findFirst({
        where: {
          id: payload.previousTicketId,
          reporterId: session.user.id,
          status: 'RESOLVED',
        },
      })
      if (!prev) return apiError('Tiket sebelumnya tidak valid', 400)
    }

    if (payload.relatedType && payload.relatedType !== 'OTHER' && payload.relatedId) {
      const ok = await verifyRelatedServiceOwnership(
        session.user.id,
        session.user.role,
        payload.relatedType,
        payload.relatedId,
      )
      if (!ok) return apiError('Layanan terkait tidak ditemukan', 400)
    }

    const snapshot =
      payload.relatedType && payload.relatedType !== 'OTHER' && payload.relatedId
        ? await buildRelatedServiceSnapshot(
            session.user.id,
            session.user.role,
            payload.relatedType,
            payload.relatedId,
          )
        : null

    const publicId = await generateSupportTicketPublicId()
    const reporterRole: SupportTicketReporterRole =
      session.user.role === 'TEKNISI' ? 'TEKNISI' : 'USER'

    const ticket = await prisma.supportTicket.create({
      data: {
        publicId,
        reporterId: session.user.id,
        reporterRole,
        category: payload.category,
        priority: payload.priority,
        subject: payload.subject,
        description: payload.description,
        relatedType: payload.relatedType ?? null,
        relatedId: payload.relatedId ?? null,
        relatedLabel: payload.relatedLabel ?? null,
        relatedManualNote:
          payload.relatedType === 'OTHER' ? payload.relatedManualNote?.trim() ?? null : null,
        relatedSnapshot: (snapshot as Prisma.InputJsonValue) ?? undefined,
        previousTicketId: payload.previousTicketId ?? null,
        adminUnread: true,
        reporterUnread: false,
      },
    })

    const files = form
      .getAll('attachments')
      .filter((f): f is File => f instanceof File && f.size > 0)

    if (files.length > 0) {
      const uploaded = await uploadSupportTicketMediaFiles(ticket.id, session.user.id, files)
      await prisma.supportTicketMedia.createMany({
        data: uploaded.map((u) => ({
          ticketId: ticket.id,
          kind: u.kind,
          url: u.url,
          fileName: u.fileName,
          mimeType: u.mimeType,
          sizeBytes: u.sizeBytes,
        })),
      })
    }

    await logCommunicationEvent({
      action: 'ticket.created',
      summary: `Tiket ${publicId} dibuat`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'support_ticket', id: ticket.id, label: publicId },
      metadata: { category: payload.category, priority: payload.priority },
    })

    const detail = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: ticketInclude,
    })

    return apiSuccess(detail ? mapSupportTicketDetail(detail) : { id: ticket.id })
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') {
      return apiError('Data tiket tidak valid', 400)
    }
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[TICKETS_POST]', e)
    return apiError('Gagal membuat tiket', 500)
  }
}
