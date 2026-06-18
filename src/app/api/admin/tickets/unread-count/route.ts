import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { countAdminUnreadTickets } from '@/lib/ticket-notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const count = await countAdminUnreadTickets()
    return apiSuccess({ count })
  } catch (e) {
    console.error('[ADMIN_TICKETS_UNREAD_COUNT]', e)
    return apiError('Gagal memuat jumlah tiket', 500)
  }
}
