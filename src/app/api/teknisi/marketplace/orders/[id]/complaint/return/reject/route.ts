import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { rejectMarketplaceComplaintReturn } from '@/lib/marketplace-complaint-return'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  COMPLAINT_NOT_FOUND: { message: 'Tidak ada retur yang menunggu konfirmasi', status: 404 },
  REJECT_PHOTO_REQUIRED: { message: 'Minimal 1 foto bukti penolakan wajib', status: 400 },
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const form = await req.formData()
    const reason = String(form.get('reason') ?? '')
    const rejectPhotos = form
      .getAll('rejectPhotos')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const order = await rejectMarketplaceComplaintReturn(
      id,
      session.user.id,
      reason,
      rejectPhotos,
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'TEKNISI',
      },
    )
    return apiSuccess(order)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[TEKNISI_COMPLAINT_RETURN_REJECT]', e)
    return apiError('Gagal menolak retur', 500)
  }
}
