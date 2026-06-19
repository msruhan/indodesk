import { z } from 'zod'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { getRekberSellerPreview } from '@/lib/rekber-seller-check'

export const dynamic = 'force-dynamic'

const querySchema = z
  .object({
    sellerId: z.string().min(1).optional(),
    sellerEmail: z.string().email().optional(),
  })
  .refine((d) => Boolean(d.sellerId?.trim() || d.sellerEmail?.trim()), {
    message: 'sellerId atau sellerEmail wajib',
  })

export async function GET(req: Request) {
  const { error } = await requireApiAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    sellerId: searchParams.get('sellerId') ?? undefined,
    sellerEmail: searchParams.get('sellerEmail') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Parameter tidak valid')
  }

  try {
    const preview = await getRekberSellerPreview(parsed.data)
    if (!preview) return apiError('Penjual tidak ditemukan', 404)
    return apiSuccess(preview)
  } catch (e) {
    console.error('[REKBER_CHECK_SELLER]', e)
    return apiError('Gagal memeriksa penjual', 500)
  }
}
