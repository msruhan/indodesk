import { z } from 'zod'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { BinderbyteShippingError } from '@/lib/binderbyte-shipping'
import { loadWeightBySellerFromLines } from '@/lib/product-weight-server'
import { quoteShippingRatesBySeller } from '@/lib/shipping-rates-server'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  destinationLocationId: z.string().min(3).max(64),
  sellerIds: z.array(z.string().min(1)).min(1).max(20),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .max(50)
    .optional(),
})

export async function POST(req: Request) {
  const { error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const weightBySeller = parsed.data.lines?.length
      ? await loadWeightBySellerFromLines(parsed.data.lines)
      : {}

    const quote = await quoteShippingRatesBySeller(
      parsed.data.destinationLocationId,
      parsed.data.sellerIds,
      weightBySeller,
    )

    return apiSuccess(quote)
  } catch (e) {
    if (e instanceof Error && e.message === 'SHIPPING_API_UNAVAILABLE') {
      return apiError('Layanan ongkir belum dikonfigurasi', 503)
    }
    if (e instanceof BinderbyteShippingError) {
      return apiError(e.message, e.code === 'INVALID_LOCATION' ? 400 : 502)
    }
    console.error('[SHIPPING_RATES]', e)
    return apiError('Gagal menghitung ongkir', 500)
  }
}
