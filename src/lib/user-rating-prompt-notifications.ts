import { prisma } from '@/lib/db'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'

const LIMIT = 20

function userRatingNotification(
  partial: Omit<PlatformNotification, 'audiences' | 'active' | 'kind'>,
): PlatformNotification {
  return {
    ...partial,
    audiences: ['USER'],
    active: true,
    kind: 'order',
  }
}

/** Prompt user untuk memberi rating setelah transaksi selesai. */
export async function fetchUserRatingPromptNotifications(
  userId: string,
): Promise<PlatformNotification[]> {
  const [konsultasi, inspeksi, orders] = await Promise.all([
    prisma.konsultasiSession.findMany({
      where: { userId, status: 'COMPLETED', rating: null },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: { teknisi: { select: { name: true } } },
    }),
    prisma.inspectionOrder.findMany({
      where: { userId, status: 'COMPLETED', ratingByUser: null },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      select: { id: true, productName: true, orderCode: true, updatedAt: true, completedAt: true },
    }),
    prisma.order.findMany({
      where: { buyerId: userId, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        reviews: { select: { productId: true } },
      },
    }),
  ])

  const items: PlatformNotification[] = []

  for (const row of konsultasi) {
    const teknisiName = row.teknisi.name ?? 'teknisi'
    items.push(
      userRatingNotification({
        id: `rate-konsultasi-${row.id}`,
        title: 'Beri rating konsultasi',
        body: `Bagaimana konsultasi dengan ${teknisiName}? — ${row.service}`,
        tone: 'primary' as NotificationTone,
        icon: 'message' as NotificationIconKey,
        createdAt: (row.endedAt ?? row.updatedAt).toISOString(),
        href: '/user/konsultasi',
      }),
    )
  }

  for (const row of inspeksi) {
    items.push(
      userRatingNotification({
        id: `rate-inspeksi-${row.id}`,
        title: 'Beri rating inspeksi',
        body: `Nilai pengalaman inspeksi ${row.productName} (${row.orderCode})`,
        tone: 'primary' as NotificationTone,
        icon: 'check' as NotificationIconKey,
        createdAt: (row.completedAt ?? row.updatedAt).toISOString(),
        href: `/user/inspeksi/${row.id}`,
      }),
    )
  }

  for (const order of orders) {
    const reviewedIds = new Set(order.reviews.map((r) => r.productId))
    const pending = order.items.filter((i) => !reviewedIds.has(i.productId))
    if (pending.length === 0) continue

    const names = pending.map((i) => i.product.name).join(', ')
    items.push(
      userRatingNotification({
        id: `rate-marketplace-${order.id}`,
        title: 'Beri rating pesanan Anda',
        body: `${order.orderCode} — ${names}`,
        tone: 'primary' as NotificationTone,
        icon: 'package' as NotificationIconKey,
        createdAt: order.updatedAt.toISOString(),
        href: `/user/orders/${order.id}`,
      }),
    )
  }

  return sortNotificationsNewestFirst(items)
}
