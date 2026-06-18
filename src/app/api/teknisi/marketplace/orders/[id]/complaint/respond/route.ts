import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { respondToMarketplaceComplaint } from '@/lib/marketplace-complaint'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const response =
    typeof body === 'object' && body && 'response' in body
      ? String((body as { response: unknown }).response)
      : ''

  try {
    const order = await respondToMarketplaceComplaint(id, session.user.id, response, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI',
    })
    return apiSuccess(order)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'COMPLAINT_NOT_FOUND') {
        return apiError('Tidak ada komplain aktif untuk direspons', 404)
      }
      if (e.message === 'SELLER_DEADLINE_PASSED') {
        return apiError('Batas waktu respons sudah lewat', 400)
      }
      return apiError(e.message, 400)
    }
    console.error('[TEKNISI_COMPLAINT_RESPOND]', e)
    return apiError('Gagal menyimpan respons', 500)
  }
}
