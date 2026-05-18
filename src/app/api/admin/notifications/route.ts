import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { defaultPlatformNotifications } from '@/data/mock-platform-notifications'
import {
  mapDbNotification,
  serializeNotificationAudiences,
  sortNotificationsNewestFirst,
} from '@/lib/platform-notifications'
import { createPlatformNotificationSchema } from '@/lib/validations/platform-notification'

export const dynamic = 'force-dynamic'

async function ensureSeedNotifications() {
  const count = await prisma.platformNotification.count()
  if (count > 0) return

  await prisma.platformNotification.createMany({
    data: defaultPlatformNotifications.map((n) => ({
      title: n.title,
      body: n.body,
      audiences: serializeNotificationAudiences(n.audiences),
      tone: n.tone,
      icon: n.icon,
      active: n.active,
      createdAt: new Date(n.createdAt),
    })),
  })
}

/** GET /api/admin/notifications */
export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    await ensureSeedNotifications()
    const rows = await prisma.platformNotification.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(sortNotificationsNewestFirst(rows.map(mapDbNotification)))
  } catch (e) {
    console.error('[ADMIN_NOTIFICATIONS_GET]', e)
    return apiError('Gagal memuat notifikasi', 500)
  }
}

/** POST /api/admin/notifications */
export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createPlatformNotificationSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const created = await prisma.platformNotification.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        audiences: serializeNotificationAudiences(parsed.data.audiences),
        tone: parsed.data.tone,
        icon: parsed.data.icon,
        active: parsed.data.active,
      },
    })

    return apiSuccess(mapDbNotification(created), 201)
  } catch (e) {
    console.error('[ADMIN_NOTIFICATIONS_POST]', e)
    return apiError('Gagal membuat notifikasi', 500)
  }
}
