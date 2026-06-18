import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { countReporterUnreadTickets } from '@/lib/ticket-notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  try {
    const count = await countReporterUnreadTickets(session.user.id)
    return apiSuccess({ count })
  } catch (e) {
    console.error('[TICKETS_UNREAD_COUNT]', e)
    return apiError('Gagal memuat jumlah tiket', 500)
  }
}
