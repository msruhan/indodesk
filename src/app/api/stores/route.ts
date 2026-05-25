import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { serializePublicStoreListItem } from '@/lib/teknisi-store-serializer'

export const dynamic = 'force-dynamic'

/** Daftar toko teknisi yang sudah disetujui & dipublikasikan. */
export async function GET() {
  try {
    const stores = await prisma.teknisiStore.findMany({
      where: {
        listingStatus: 'APPROVED',
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            teknisiProfile: { select: { rating: true, reviewCount: true } },
          },
        },
      },
      orderBy: [{ totalSold: 'desc' }, { createdAt: 'desc' }],
    })

    return apiSuccess(stores.map((s) => serializePublicStoreListItem(s, s.user.teknisiProfile, s.user.id)))
  } catch (e) {
    console.error('[PUBLIC_STORES_GET]', e)
    return apiError('Gagal memuat daftar toko', 500)
  }
}
