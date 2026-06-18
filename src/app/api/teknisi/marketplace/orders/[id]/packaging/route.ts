import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { MARKETPLACE_ORDER_INCLUDE } from '@/lib/marketplace-order-includes'
import {
  getPackagingProofForOrder,
  submitPackagingProof,
} from '@/lib/marketplace-packaging-proof'
import { serializeOrderPackagingProof } from '@/lib/marketplace-packaging-proof-serializer'
import { serializeMarketplaceOrder } from '@/lib/marketplace-order-serializer'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  ORDER_NOT_FOUND: { message: 'Pesanan tidak ditemukan', status: 404 },
  INVALID_STATUS: { message: 'Bukti packaging hanya untuk pesanan yang sudah dibayar', status: 400 },
  PACKAGING_NOT_REQUIRED: { message: 'Pesanan ini tidak memerlukan bukti packaging', status: 400 },
  PACKAGING_PENDING_REVIEW: { message: 'Bukti packaging sedang direview admin', status: 409 },
  PACKAGING_RESUBMIT_EXPIRED: { message: 'Batas waktu upload ulang sudah lewat', status: 400 },
  PACKAGING_PHOTO_REQUIRED: { message: 'Minimal 1 foto packaging wajib', status: 400 },
  PACKAGING_VIDEO_REQUIRED: { message: 'Minimal 1 video packaging wajib', status: 400 },
  PACKAGING_PHOTO_TOO_MANY: { message: 'Maksimal 5 foto', status: 400 },
  PACKAGING_VIDEO_TOO_MANY: { message: 'Maksimal 2 video', status: 400 },
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const proof = await getPackagingProofForOrder(id, session.user.id)
    return apiSuccess({ proof: proof ? serializeOrderPackagingProof(proof) : null })
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    console.error('[TEKNISI_PACKAGING_GET]', e)
    return apiError('Gagal memuat bukti packaging', 500)
  }
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
    const photos = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
    const videos = form.getAll('videos').filter((f): f is File => f instanceof File && f.size > 0)

    await submitPackagingProof(id, session.user.id, photos, videos, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'TEKNISI',
    })

    const order = await prisma.order.findFirst({
      where: { id, sellerId: session.user.id },
      include: MARKETPLACE_ORDER_INCLUDE,
    })
    if (!order) return apiError('Pesanan tidak ditemukan', 404)

    return apiSuccess(
      serializeMarketplaceOrder(order, {
        viewerId: session.user.id,
        viewerRole: 'TEKNISI',
      }),
    )
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[TEKNISI_PACKAGING_POST]', e)
    return apiError('Gagal mengirim bukti packaging', 500)
  }
}
