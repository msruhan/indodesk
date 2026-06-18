import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { submitMarketplaceComplaintReturn } from '@/lib/marketplace-complaint-return'
import type { ShippingCourier } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  COMPLAINT_NOT_FOUND: { message: 'Komplain tidak ditemukan atau tidak dalam fase retur', status: 404 },
  RETURN_DEADLINE_PASSED: { message: 'Batas waktu kirim retur sudah lewat', status: 400 },
  RETURN_PHOTO_REQUIRED: { message: 'Minimal 1 foto pengemasan retur wajib', status: 400 },
  RETURN_VIDEO_REQUIRED: { message: 'Minimal 1 video pengiriman retur wajib', status: 400 },
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const form = await req.formData()
    const courier = String(form.get('courier') ?? '') as ShippingCourier
    const trackingNumber = String(form.get('trackingNumber') ?? '')
    const returnPhotos = form
      .getAll('returnPhotos')
      .filter((f): f is File => f instanceof File && f.size > 0)
    const returnVideos = form
      .getAll('returnVideos')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const order = await submitMarketplaceComplaintReturn(
      id,
      session.user.id,
      courier,
      trackingNumber,
      returnPhotos,
      returnVideos,
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    )
    return apiSuccess(order)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (e instanceof Error && !code.startsWith('MEDIA_')) {
      return apiError(e.message, 400)
    }
    console.error('[USER_MARKETPLACE_COMPLAINT_RETURN]', e)
    return apiError('Gagal mengirim data retur', 500)
  }
}
