import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import {
  getRekberPackagingProof,
  submitRekberPackagingProof,
} from '@/lib/rekber-packaging-proof'
import { serializeRekberPackagingProof } from '@/lib/marketplace-packaging-proof-serializer'
import { REKBER_INCLUDE } from '@/lib/rekber-includes'
import { serializeRekber } from '@/lib/rekber-serializer'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  REKBER_NOT_FOUND: { message: 'Transaksi aman tidak ditemukan', status: 404 },
  INVALID_STATUS: { message: 'Bukti packaging hanya untuk transaksi aman dengan dana ditahan', status: 400 },
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
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const proof = await getRekberPackagingProof(id, session.user.id)
    return apiSuccess({ proof: proof ? serializeRekberPackagingProof(proof) : null })
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (code === 'REKBER_NOT_FOUND') return apiError('Transaksi aman tidak ditemukan', 404)
    console.error('[REKBER_PACKAGING_GET]', e)
    return apiError('Gagal memuat bukti packaging', 500)
  }
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
    const photos = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
    const videos = form.getAll('videos').filter((f): f is File => f instanceof File && f.size > 0)

    await submitRekberPackagingProof(id, session.user.id, photos, videos, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    })

    const rekber = await prisma.rekberTransaction.findFirst({
      where: { id, sellerId: session.user.id },
      include: REKBER_INCLUDE,
    })
    if (!rekber) return apiError('Transaksi aman tidak ditemukan', 404)

    return apiSuccess(
      serializeRekber(rekber, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
      }),
    )
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (e instanceof Error) return apiError(e.message, 400)
    console.error('[REKBER_PACKAGING_POST]', e)
    return apiError('Gagal mengirim bukti packaging', 500)
  }
}
