import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializeBanner } from '@/lib/banner-serializer'
import type { BannerPlacement } from '@/lib/marketplace-banners'

export const dynamic = 'force-dynamic'

const VALID_PLACEMENTS = new Set<BannerPlacement>(['marketplace', 'shop', 'topup'])

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const placement = (searchParams.get('placement') ?? 'marketplace') as BannerPlacement

  if (!VALID_PLACEMENTS.has(placement)) {
    return apiError('Placement tidak valid')
  }

  try {
    const rows = await prisma.marketplaceBanner.findMany({
      where: { placement, active: true },
      orderBy: { sortOrder: 'asc' },
    })
    return apiSuccess(rows.map(serializeBanner))
  } catch (e) {
    console.error('[BANNERS_GET]', e)
    return apiError('Gagal memuat banner', 500)
  }
}
