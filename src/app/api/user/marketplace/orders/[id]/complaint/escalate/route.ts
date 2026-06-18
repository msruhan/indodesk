import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { escalateMarketplaceComplaint } from '@/lib/marketplace-complaint'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const order = await escalateMarketplaceComplaint(id, session.user.id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    })
    return apiSuccess(order)
  } catch (e) {
    if (e instanceof Error && e.message === 'COMPLAINT_NOT_FOUND') {
      return apiError('Komplain tidak ditemukan atau tidak dapat dieskalasi', 404)
    }
    console.error('[USER_MARKETPLACE_ORDER_ESCALATE]', e)
    return apiError('Gagal eskalasi komplain', 500)
  }
}
