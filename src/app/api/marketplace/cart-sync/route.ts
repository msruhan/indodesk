import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { fetchCartProductSync } from '@/lib/marketplace-coupon-preview'

export const dynamic = 'force-dynamic'

const schema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(50),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const products = await fetchCartProductSync(parsed.data.productIds)
    return apiSuccess({ products })
  } catch (e) {
    console.error('[CART_SYNC]', e)
    return apiError('Gagal sinkronisasi keranjang', 500)
  }
}
