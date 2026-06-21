import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { countPendingMarketplacePackagingProofs } from '@/lib/marketplace-packaging-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const count = await countPendingMarketplacePackagingProofs()
    return apiSuccess({ count })
  } catch (e) {
    console.error('[ADMIN_PACKAGING_PENDING_COUNT]', e)
    return apiError('Gagal memuat jumlah bukti packaging', 500)
  }
}
