import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { resolveMarketplaceComplaint } from '@/lib/marketplace-complaint-resolve'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  COMPLAINT_NOT_FOUND: { message: 'Komplain tidak ditemukan', status: 404 },
  INVALID_COMPLAINT_STATUS: { message: 'Komplain belum dieskalasi ke admin', status: 400 },
  REFUND_AMOUNT_INVALID: { message: 'Nominal refund sebagian tidak valid', status: 400 },
  INSUFFICIENT_SELLER_BALANCE: {
    message: 'Saldo penjual tidak cukup untuk refund',
    status: 400,
  },
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  try {
    const order = await resolveMarketplaceComplaint(id, session.user.id, body, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'ADMIN',
    })
    return apiSuccess(order)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    console.error('[ADMIN_COMPLAINT_RESOLVE]', e)
    return apiError('Gagal menyelesaikan komplain', 500)
  }
}
