import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { previewMarketplaceCouponDiscount } from '@/lib/marketplace-coupon-preview'

export const dynamic = 'force-dynamic'

const schema = z.object({
  couponCode: z.string().min(1).max(20),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const discount = await previewMarketplaceCouponDiscount(
      parsed.data.items,
      parsed.data.couponCode,
    )

    return apiSuccess({
      discount,
      valid: discount > 0,
    })
  } catch (e) {
    console.error('[COUPON_PREVIEW]', e)
    return apiError('Gagal memvalidasi kupon', 500)
  }
}
