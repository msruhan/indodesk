import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getPlatformRevenueSummary } from '@/lib/platform-revenue'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const data = await getPlatformRevenueSummary()
    return apiSuccess(data)
  } catch (e) {
    console.error('[ADMIN_PENDAPATAN_PLATFORM_GET]', e)
    return apiError('Gagal memuat pendapatan platform', 500)
  }
}
