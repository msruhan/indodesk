import { apiError, apiSuccess } from '@/lib/api-auth'
import { getPublicComingSoonConfig } from '@/lib/platform-settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getPublicComingSoonConfig()
    return apiSuccess(config)
  } catch (e) {
    console.error('[PUBLIC_COMING_SOON_GET]', e)
    return apiError('Gagal memuat konfigurasi', 500)
  }
}
