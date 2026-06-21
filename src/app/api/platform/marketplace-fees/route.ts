import { NextResponse } from 'next/server'
import { DEFAULT_PLATFORM_SETTINGS } from '@/lib/platform-settings-shared'
import { getPublicMarketplaceFeeRates } from '@/lib/platform-settings'

export const dynamic = 'force-dynamic'

/** GET /api/platform/marketplace-fees — publik, untuk kalkulasi cart */
export async function GET() {
  try {
    const rates = await getPublicMarketplaceFeeRates()
    return NextResponse.json({ success: true, data: rates })
  } catch (e) {
    console.error('[PUBLIC_MARKETPLACE_FEES_GET]', e)
    return NextResponse.json({
      success: true,
      data: {
        buyerFeePercent: DEFAULT_PLATFORM_SETTINGS.buyerFeePercent,
        buyerFlatFeePerItem: DEFAULT_PLATFORM_SETTINGS.buyerFlatFeePerItem,
        sellerFeePercent: DEFAULT_PLATFORM_SETTINGS.sellerFeePercent,
        sellerFeeTiers: DEFAULT_PLATFORM_SETTINGS.sellerFeeTiers,
      },
    })
  }
}
