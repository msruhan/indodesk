import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  mapDbNotification,
  serializeNotificationAudiences,
} from '@/lib/platform-notifications'
import { updatePlatformNotificationSchema } from '@/lib/validations/platform-notification'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/notifications/[id] */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    const body = await req.json()
    const parsed = updatePlatformNotificationSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const data = parsed.data
    const updated = await prisma.platformNotification.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.audiences !== undefined
          ? { audiences: serializeNotificationAudiences(data.audiences) }
          : {}),
        ...(data.tone !== undefined ? { tone: data.tone } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    })

    return apiSuccess(mapDbNotification(updated))
  } catch (e) {
    console.error('[ADMIN_NOTIFICATIONS_PATCH]', e)
    return apiError('Gagal memperbarui notifikasi', 500)
  }
}

/** DELETE /api/admin/notifications/[id] */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { id } = await context.params
    await prisma.platformNotification.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_NOTIFICATIONS_DELETE]', e)
    return apiError('Gagal menghapus notifikasi', 500)
  }
}
