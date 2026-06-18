import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { fetchRelatedServicesForReporter } from '@/lib/support-ticket-related-services'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role !== 'USER' && session.user.role !== 'TEKNISI') {
    return apiError('Forbidden', 403)
  }

  try {
    const items = await fetchRelatedServicesForReporter(session.user.id, session.user.role)
    return apiSuccess(items)
  } catch (e) {
    console.error('[TICKETS_RELATED_SERVICES]', e)
    return apiError('Gagal memuat layanan terkait', 500)
  }
}
