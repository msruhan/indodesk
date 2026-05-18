import { apiError, apiSuccess } from '@/lib/api-auth'
import { getPlatformSupportAdmin } from '@/lib/chat-support'

export const dynamic = 'force-dynamic'

/** GET /api/chat/support — admin CS untuk chat dukungan */
export async function GET() {
  try {
    const admin = await getPlatformSupportAdmin()
    if (!admin) {
      return apiError('Admin dukungan belum tersedia', 503)
    }
    return apiSuccess({
      id: admin.id,
      name: admin.name,
      image: admin.image,
    })
  } catch (e) {
    console.error('[CHAT_SUPPORT_GET]', e)
    return apiError('Gagal memuat kontak dukungan', 500)
  }
}
