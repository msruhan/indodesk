import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
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
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, reporterId: session.user.id },
      select: { id: true },
    })
    if (!ticket) return apiError('Tiket tidak ditemukan', 404)

    await prisma.supportTicket.update({
      where: { id },
      data: { reporterUnread: false },
    })

    return apiSuccess({ ok: true })
  } catch (e) {
    console.error('[TICKET_READ_PATCH]', e)
    return apiError('Gagal memperbarui status baca', 500)
  }
}
