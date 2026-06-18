import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { respondToRekberComplaint } from '@/lib/rekber-complaint'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  COMPLAINT_NOT_FOUND: { message: 'Komplain tidak ditemukan', status: 404 },
  SELLER_DEADLINE_PASSED: { message: 'Batas waktu respons penjual sudah lewat', status: 400 },
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
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
    const rekber = await respondToRekberComplaint(id, session.user.id, response, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    })
    return apiSuccess(rekber)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    console.error('[REKBER_COMPLAINT_RESPOND]', e)
    return apiError('Gagal mengirim respons', 500)
  }
}
