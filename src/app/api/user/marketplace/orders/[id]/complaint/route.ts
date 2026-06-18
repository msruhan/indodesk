import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { createMarketplaceOrderComplaint } from '@/lib/marketplace-complaint'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  ORDER_NOT_FOUND: { message: 'Pesanan tidak ditemukan', status: 404 },
  INVALID_STATUS: { message: 'Komplain hanya untuk pesanan yang sedang dikirim', status: 400 },
  NOT_DELIVERED: { message: 'Paket belum terdeteksi sampai', status: 400 },
  DEADLINE_PASSED: { message: 'Batas waktu komplain sudah lewat', status: 400 },
  COMPLAINT_EXISTS: { message: 'Komplain sudah diajukan untuk pesanan ini', status: 409 },
  MEDIA_PHOTO_REQUIRED: { message: 'Minimal 1 foto bukti wajib', status: 400 },
  MEDIA_VIDEO_REQUIRED: { message: 'Minimal 1 video bukti wajib', status: 400 },
  DEFECT_PHOTO_REQUIRED: { message: 'Minimal 1 foto masalah wajib', status: 400 },
  UNBOXING_VIDEO_REQUIRED: { message: 'Minimal 1 video unboxing wajib', status: 400 },
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
    const reason = String(form.get('reason') ?? '')
    const defectPhotos = form
      .getAll('defectPhotos')
      .filter((f): f is File => f instanceof File && f.size > 0)
    const unboxingVideos = form
      .getAll('unboxingVideos')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const order = await createMarketplaceOrderComplaint(
      id,
      session.user.id,
      reason,
      defectPhotos,
      unboxingVideos,
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
    console.error('[USER_MARKETPLACE_ORDER_COMPLAINT]', e)
    return apiError('Gagal mengajukan komplain', 500)
  }
}
