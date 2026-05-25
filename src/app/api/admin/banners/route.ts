import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { bannerCreateData, serializeBanner } from '@/lib/banner-serializer'
import type { BannerPlacement } from '@/lib/marketplace-banners'

export const dynamic = 'force-dynamic'

const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(500).optional(),
  image: z.string().min(10),
  buttonText: z.string().max(80).optional(),
  active: z.boolean().optional(),
  placement: z.enum(['marketplace', 'shop', 'topup']),
  sortOrder: z.number().int().optional(),
})

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.marketplaceBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return apiSuccess(rows.map(serializeBanner))
  } catch (e) {
    console.error('[ADMIN_BANNERS_GET]', e)
    return apiError('Gagal memuat banner', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = bannerSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const maxOrder = await prisma.marketplaceBanner.aggregate({
      _max: { sortOrder: true },
    })
    const sortOrder = parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1

    const row = await prisma.marketplaceBanner.create({
      data: {
        ...bannerCreateData(parsed.data as { title: string; subtitle?: string; image: string; buttonText?: string; active?: boolean; placement: BannerPlacement }),
        sortOrder,
      },
    })
    return apiSuccess(serializeBanner(row), 201)
  } catch (e) {
    console.error('[ADMIN_BANNERS_POST]', e)
    return apiError('Gagal membuat banner', 500)
  }
}
