import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { SHIPPING_LOCATION_TYPE_MAP } from '@/lib/shipping-locations'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  type: z.enum(['province', 'city', 'district', 'village']),
  parentId: z.string().max(64).optional(),
  query: z.string().max(80).optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = querySchema.safeParse({
      type: url.searchParams.get('type') ?? undefined,
      parentId: url.searchParams.get('parentId') ?? undefined,
      query: url.searchParams.get('query') ?? undefined,
    })
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Parameter tidak valid')
    }

    const { type, parentId, query } = parsed.data
    if (type !== 'province' && !parentId) {
      return apiError('Parent lokasi wajib dipilih lebih dulu')
    }

    const count = await prisma.shippingLocation.count()
    if (count === 0) {
      return apiError('Data lokasi belum disiapkan di database', 503)
    }

    const rows = await prisma.shippingLocation.findMany({
      where: {
        type: SHIPPING_LOCATION_TYPE_MAP[type],
        ...(type === 'province' ? {} : { parentId }),
        ...(query?.trim()
          ? {
              name: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, label: true },
    })

    const locations = rows.map((row) => ({ ...row, type }))
    return apiSuccess({ locations })
  } catch (e) {
    console.error('[SHIPPING_LOCATIONS]', e)
    return apiError('Gagal memuat lokasi', 500)
  }
}
