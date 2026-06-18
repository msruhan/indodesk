import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { escalateRekberComplaint } from '@/lib/rekber-complaint'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  COMPLAINT_NOT_FOUND: { message: 'Komplain tidak ditemukan atau belum bisa dieskalasi', status: 404 },
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const rekber = await escalateRekberComplaint(id, session.user.id, {
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
    console.error('[REKBER_COMPLAINT_ESCALATE]', e)
    return apiError('Gagal eskalasi komplain', 500)
  }
}
