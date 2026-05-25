import { prisma } from '@/lib/db'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'

const LIMIT = 40

function teknisiNotification(
  partial: Omit<PlatformNotification, 'audiences' | 'active' | 'kind'>,
): PlatformNotification {
  return {
    ...partial,
    audiences: ['TEKNISI'],
    active: true,
    kind: 'order',
  }
}

/** Notifikasi layanan untuk teknisi: remote menunggu, konsultasi pending, pesanan toko baru. */
export async function fetchTeknisiServiceNotifications(
  teknisiId: string,
): Promise<PlatformNotification[]> {
  const [remoteWaiting, konsultasiPending, marketplacePending] = await Promise.all([
    prisma.remoteSession.findMany({
      where: { teknisiId, status: 'WAITING' },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: { user: { select: { name: true } } },
    }),
    prisma.konsultasiSession.findMany({
      where: { teknisiId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: { user: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { sellerId: teknisiId, status: { in: ['PAID', 'PROCESSING'] } },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: {
        buyer: { select: { name: true } },
        items: { take: 1, include: { product: { select: { name: true } } } },
      },
    }),
  ])

  const items: PlatformNotification[] = []

  for (const row of remoteWaiting) {
    const userName = row.user.name ?? 'Pelanggan'
    items.push(
      teknisiNotification({
        id: `teknisi-remote-${row.id}`,
        title: 'Permintaan remote baru',
        body: `${userName} mengajukan remote — kode ${row.remoteId}`,
        tone: 'warning' as NotificationTone,
        icon: 'message' as NotificationIconKey,
        createdAt: row.createdAt.toISOString(),
        href: '/teknisi/remote',
      }),
    )
  }

  for (const row of konsultasiPending) {
    const userName = row.user.name ?? 'Pelanggan'
    items.push(
      teknisiNotification({
        id: `teknisi-konsultasi-${row.id}`,
        title: 'Konsultasi baru',
        body: `${userName} — ${row.service}`,
        tone: 'primary' as NotificationTone,
        icon: 'message' as NotificationIconKey,
        createdAt: row.createdAt.toISOString(),
        href: '/teknisi/konsultasi',
      }),
    )
  }

  for (const order of marketplacePending) {
    const productName = order.items[0]?.product.name ?? 'Produk'
    const buyerName = order.buyer.name ?? 'Pembeli'
    const statusLabel = order.status === 'PAID' ? 'dibayar' : 'diproses'
    items.push(
      teknisiNotification({
        id: `teknisi-marketplace-${order.id}`,
        title: 'Pesanan marketplace',
        body: `${buyerName} — ${productName} (${statusLabel})`,
        tone: 'primary' as NotificationTone,
        icon: 'package' as NotificationIconKey,
        createdAt: order.updatedAt.toISOString(),
        href: '/teknisi/pesanan',
      }),
    )
  }

  return sortNotificationsNewestFirst(items)
}
