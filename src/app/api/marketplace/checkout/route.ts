import { z } from 'zod'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { processMarketplaceCheckout } from '@/lib/marketplace-checkout'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  EMPTY_CART: { message: 'Keranjang kosong', status: 400 },
  PRODUCT_NOT_FOUND: { message: 'Produk tidak tersedia atau sudah dihapus', status: 404 },
  OWN_PRODUCT: { message: 'Tidak dapat membeli produk sendiri', status: 400 },
  INVALID_QUANTITY: { message: 'Jumlah tidak valid', status: 400 },
  OUT_OF_STOCK: { message: 'Stok produk tidak mencukupi', status: 409 },
  WALLET_NOT_FOUND: { message: 'Wallet tidak ditemukan', status: 400 },
  INSUFFICIENT_BALANCE: { message: 'Saldo tidak cukup. Top-up dulu ya.', status: 402 },
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  try {
    const orders = await processMarketplaceCheckout(
      session.user.id,
      session.user.name,
      session.user.email,
      session.user.role,
      parsed.data.items,
    )

    const totalPaid = orders.reduce((sum, o) => sum + o.total, 0)

    return apiSuccess(
      {
        orders,
        totalPaid,
        orderCodes: orders.map((o) => o.orderCode),
      },
      201,
    )
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    console.error('[MARKETPLACE_CHECKOUT]', e)
    return apiError('Gagal checkout', 500)
  }
}
