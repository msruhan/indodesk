import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { confirmMarketplaceOrderReceipt } from '@/lib/marketplace-order-confirm'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  ORDER_NOT_FOUND: { message: 'Pesanan tidak ditemukan', status: 404 },
  INVALID_STATUS: {
    message: 'Konfirmasi hanya dapat dilakukan saat pesanan sedang dikirim',
    status: 400,
  },
  NOT_DELIVERED: {
    message: 'Paket belum terdeteksi sampai. Tunggu update pelacakan terlebih dahulu.',
    status: 400,
  },
  DEADLINE_PASSED: { message: 'Batas waktu konfirmasi sudah lewat', status: 400 },
  COMPLAINT_ACTIVE: { message: 'Selesaikan komplain terlebih dahulu', status: 409 },
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const order = await confirmMarketplaceOrderReceipt(id, session.user.id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    })
    return apiSuccess(order)
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    const mapped = ERROR_MAP[code]
    if (mapped) return apiError(mapped.message, mapped.status)
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup untuk menyelesaikan transaksi', 402)
    }
    console.error('[USER_MARKETPLACE_ORDER_CONFIRM]', e)
    return apiError('Gagal mengonfirmasi penerimaan', 500)
  }
}
