import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import {
  mapDbNotification,
  notificationMatchesRole,
  sortNotificationsNewestFirst,
} from '@/lib/platform-notifications'
import { fetchAdminMonitoringNotifications } from '@/lib/admin-monitoring-notifications'
import { fetchOrderNotificationsForUser } from '@/lib/user-order-notifications'
import { fetchTeknisiServiceNotifications } from '@/lib/teknisi-service-notifications'

export const dynamic = 'force-dynamic'

/** GET /api/notifications — notifikasi aktif untuk role user yang login */
export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const userId = session.user.id

    const isAdmin = session.user.role === 'ADMIN'
    const isTeknisi = session.user.role === 'TEKNISI'

    const [rows, orderNotifications, teknisiNotifications, monitoringNotifications] =
      await Promise.all([
        prisma.platformNotification.findMany({
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        }),
        fetchOrderNotificationsForUser(userId),
        isTeknisi ? fetchTeknisiServiceNotifications(userId) : Promise.resolve([]),
        isAdmin ? fetchAdminMonitoringNotifications() : Promise.resolve([]),
      ])

    const broadcasts = rows
      .map(mapDbNotification)
      .filter((n) => notificationMatchesRole(n, session.user.role))

    const items = sortNotificationsNewestFirst([
      ...monitoringNotifications,
      ...teknisiNotifications,
      ...orderNotifications,
      ...broadcasts,
    ]).slice(0, 50)

    return apiSuccess(items)
  } catch (e) {
    console.error('[NOTIFICATIONS_GET]', e)
    return apiError('Gagal memuat notifikasi', 500)
  }
}
