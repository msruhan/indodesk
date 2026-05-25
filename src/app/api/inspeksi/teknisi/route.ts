import { prisma } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { getInspectionBasePrice } from '@/lib/inspection-pricing'
import type { InspectionTeknisiOption } from '@/lib/inspection-serializer'

export const dynamic = 'force-dynamic'

/** Daftar teknisi verified yang bisa menerima inspeksi. */
export async function GET() {
  try {
    const profiles = await prisma.teknisiProfile.findMany({
      where: {
        isVerified: true,
        verificationStatus: 'APPROVED',
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { rating: 'desc' },
      take: 50,
    })

    const data: InspectionTeknisiOption[] = profiles.map((p) => ({
      id: p.userId,
      name: p.user.name ?? 'Teknisi',
      image: p.user.image,
      location: p.location,
      rating: Number(p.rating),
      reviewCount: p.reviewCount,
      specialty: p.specialty,
      priceOnlineHandphone: getInspectionBasePrice('ONLINE', 'HANDPHONE'),
      priceOnlineLaptop: getInspectionBasePrice('ONLINE', 'LAPTOP'),
      priceOfflineHandphone: getInspectionBasePrice('OFFLINE', 'HANDPHONE'),
      priceOfflineLaptop: getInspectionBasePrice('OFFLINE', 'LAPTOP'),
    }))

    return apiSuccess(data)
  } catch (e) {
    console.error('[INSPEKSI_TEKNISI_GET]', e)
    return apiError('Gagal memuat daftar teknisi', 500)
  }
}
