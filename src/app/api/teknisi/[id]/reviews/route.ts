import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import {
  fetchTeknisiUnifiedReviews,
  fetchTeknisiUnifiedReviewStats,
} from '@/lib/teknisi-unified-reviews'
import { isTeknisiProfilePubliclyVisible } from '@/lib/teknisi-profile-visibility'

export const dynamic = 'force-dynamic'

/** GET /api/teknisi/[id]/reviews — testimoni dari transaksi selesai (konsultasi, inspeksi, marketplace) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teknisiId } = await params

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { id: true, isProfileHidden: true },
    })
    if (!profile || !isTeknisiProfilePubliclyVisible(profile)) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    const [items, { stats }] = await Promise.all([
      fetchTeknisiUnifiedReviews(teknisiId),
      fetchTeknisiUnifiedReviewStats(teknisiId),
    ])

    return apiSuccess({
      items,
      stats,
    })
  } catch (e) {
    console.error('[TEKNISI_REVIEWS_GET]', e)
    return apiError('Gagal memuat ulasan', 500)
  }
}

/** POST dihapus — ulasan hanya via transaksi selesai */
export async function POST() {
  return apiError(
    'Ulasan profil manual tidak tersedia. Beri rating setelah konsultasi, inspeksi, atau order marketplace selesai.',
    405,
  )
}
