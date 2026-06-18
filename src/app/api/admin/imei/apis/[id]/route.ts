import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import {
  prepareImeiApiWriteData,
  sanitizeImeiApiForAdmin,
} from '@/lib/crypto/imei-api-secret'
import { updateImeiApiSchema } from '@/lib/validations/imei'

export const dynamic = 'force-dynamic'

/** GET /api/admin/imei/apis/[id] — get one API provider */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const api = await prisma.imeiApi.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { title: 'asc' },
          include: { group: { select: { id: true, title: true } } },
        },
      },
    })
    if (!api) return apiError('API tidak ditemukan', 404)
    return apiSuccess({
      ...sanitizeImeiApiForAdmin(api),
      services: api.services,
    })
  } catch (e) {
    console.error('[ADMIN_IMEI_API_GET]', e)
    return apiError('Gagal mengambil data API', 500)
  }
}

/** PATCH /api/admin/imei/apis/[id] — update an API provider */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const existing = await prisma.imeiApi.findUnique({ where: { id } })
    if (!existing) return apiError('API tidak ditemukan', 404)

    const body = await req.json()
    const parsed = updateImeiApiSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const updated = await prisma.imeiApi.update({
      where: { id },
      data: prepareImeiApiWriteData(parsed.data),
    })

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.imei.api.update',
      summary: `API IMEI diperbarui: ${updated.title}`,
      severity: parsed.data.apiKey ? 'CRITICAL' : 'WARNING',
      target: { type: 'imei_api', id: updated.id, label: updated.title },
      metadata: {
        apiKeyRotated: Boolean(parsed.data.apiKey),
        status: updated.status,
      },
    })

    return apiSuccess(sanitizeImeiApiForAdmin(updated))
  } catch (e) {
    console.error('[ADMIN_IMEI_API_PATCH]', e)
    return apiError('Gagal mengupdate API', 500)
  }
}

/** DELETE /api/admin/imei/apis/[id] — delete an API provider */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const existing = await prisma.imeiApi.findUnique({ where: { id } })
    if (!existing) return apiError('API tidak ditemukan', 404)

    // Check if there are services attached
    const servicesCount = await prisma.imeiService.count({ where: { apiId: id } })
    if (servicesCount > 0) {
      return apiError(
        `${servicesCount} service masih terhubung dengan API ini. Hapus service dulu.`,
        409,
      )
    }
    await prisma.imeiApi.delete({ where: { id } })

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.imei.api.delete',
      summary: `API IMEI dihapus: ${existing.title}`,
      severity: 'CRITICAL',
      target: { type: 'imei_api', id: existing.id, label: existing.title },
    })

    return apiSuccess({ id })
  } catch (e) {
    console.error('[ADMIN_IMEI_API_DELETE]', e)
    return apiError('Gagal menghapus API', 500)
  }
}
