import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { confirmMarketplaceComplaintReturn } from '@/lib/marketplace-complaint-return'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const order = await confirmMarketplaceComplaintReturn(id, session.user.id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI',
    })
    return apiSuccess(order)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'COMPLAINT_NOT_FOUND') {
        return apiError('Tidak ada retur yang menunggu konfirmasi', 404)
      }
      return apiError(e.message, 400)
    }
    console.error('[TEKNISI_COMPLAINT_RETURN_CONFIRM]', e)
    return apiError('Gagal mengonfirmasi retur', 500)
  }
}
