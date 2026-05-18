import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { createImeiApiSchema } from '@/lib/validations/imei'

export const dynamic = 'force-dynamic'

/** GET /api/admin/imei/apis — list all API providers */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const apis = await prisma.imeiApi.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { services: true } },
      },
    })
    return apiSuccess(apis)
  } catch (e) {
    console.error('[ADMIN_IMEI_APIS_GET]', e)
    return apiError('Gagal mengambil data API', 500)
  }
}

/** POST /api/admin/imei/apis — create a new API provider */
export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createImeiApiSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message)
    }

    const created = await prisma.imeiApi.create({ data: parsed.data })
    return apiSuccess(created, 201)
  } catch (e) {
    console.error('[ADMIN_IMEI_APIS_POST]', e)
    return apiError('Gagal membuat API', 500)
  }
}
