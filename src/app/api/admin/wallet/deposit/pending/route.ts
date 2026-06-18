import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { listPendingDepositRequests } from '@/lib/wallet/dual-control'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await listPendingDepositRequests()
    return apiSuccess({
      items: rows.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
    })
  } catch (e) {
    console.error('[ADMIN_WALLET_DEPOSIT_PENDING_GET]', e)
    return apiError('Gagal memuat antrian deposit', 500)
  }
}
