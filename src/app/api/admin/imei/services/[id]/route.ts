import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { updateImeiServiceSchema } from '@/lib/validations/imei'

export const dynamic = 'force-dynamic'

/** GET /api/admin/imei/services/[id] — get one service */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const service = await prisma.imeiService.findUnique({
      where: { id },
      include: {
        group: true,
        api: true,
      },
    })
    if (!service) return apiError('Service tidak ditemukan', 404)
    return apiSuccess(service)
  } catch (e) {
    console.error('[ADMIN_IMEI_SERVICE_GET]', e)
    return apiError('Gagal mengambil service', 500)
  }
}

/** PATCH /api/admin/imei/services/[id] — update a service */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const body = await req.json()
    const parsed = updateImeiServiceSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const updated = await prisma.imeiService.update({
      where: { id },
      data: parsed.data,
      include: {
        group: { select: { id: true, title: true } },
        api: { select: { id: true, title: true } },
      },
    })
    return apiSuccess(updated)
  } catch (e) {
    console.error('[ADMIN_IMEI_SERVICE_PATCH]', e)
    return apiError('Gagal mengupdate service', 500)
  }
}

/** DELETE /api/admin/imei/services/[id] — delete a service */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const ordersCount = await prisma.imeiOrder.count({ where: { serviceId: id } })
    if (ordersCount > 0) {
      return apiError(
        `${ordersCount} order masih terhubung. Disable service ini saja, jangan dihapus.`,
        409,
      )
    }
    await prisma.imeiService.delete({ where: { id } })
    return apiSuccess({ id })
  } catch (e) {
    console.error('[ADMIN_IMEI_SERVICE_DELETE]', e)
    return apiError('Gagal menghapus service', 500)
  }
}
