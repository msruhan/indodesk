import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { reviewPackagingProof } from '@/lib/marketplace-packaging-proof'
import { serializeOrderPackagingProof } from '@/lib/marketplace-packaging-proof-serializer'

export const dynamic = 'force-dynamic'

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(2000).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.orderPackagingProof.findUnique({
      where: { id },
      include: {
        media: true,
        order: { select: { orderCode: true, total: true, status: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    })
    if (!row) return apiError('Bukti packaging tidak ditemukan', 404)

    return apiSuccess({
      ...serializeOrderPackagingProof(row),
      orderCode: row.order.orderCode,
      orderTotal: Number(row.order.total),
      orderStatus: row.order.status,
      sellerName: row.seller.name,
      sellerEmail: row.seller.email,
    })
  } catch (e) {
    console.error('[ADMIN_PACKAGING_PROOF_GET]', e)
    return apiError('Gagal memuat detail', 500)
  }
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

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    await reviewPackagingProof(
      id,
      session.user.id,
      parsed.data.action,
      parsed.data.note,
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'ADMIN',
      },
    )

    const row = await prisma.orderPackagingProof.findUnique({
      where: { id },
      include: { media: true },
    })
    if (!row) return apiError('Bukti packaging tidak ditemukan', 404)

    return apiSuccess(serializeOrderPackagingProof(row))
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    if (code === 'PROOF_NOT_FOUND') return apiError('Bukti packaging tidak ditemukan', 404)
    if (code === 'PROOF_NOT_PENDING') return apiError('Bukti sudah direview', 409)
    if (code === 'REJECTION_NOTE_REQUIRED') {
      return apiError('Catatan penolakan wajib diisi (min. 5 karakter)', 400)
    }
    console.error('[ADMIN_PACKAGING_REVIEW]', e)
    return apiError('Gagal mereview bukti packaging', 500)
  }
}
