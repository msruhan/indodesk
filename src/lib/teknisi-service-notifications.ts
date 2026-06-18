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

/** Notifikasi layanan untuk teknisi: konsultasi pending, pesanan toko baru. */
export async function fetchTeknisiServiceNotifications(
  teknisiId: string,
): Promise<PlatformNotification[]> {
  const [konsultasiPending, marketplacePending] = await Promise.all([
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

  for (const row of konsultasiPending) {
    const userName = row.user.name ?? 'Pelanggan'
    const remoteSuffix =
      row.requiresRemote && row.remoteId ? ` · remote ${row.remoteId}` : ''
    items.push(
      teknisiNotification({
        id: `teknisi-konsultasi-${row.id}`,
        title: row.requiresRemote ? 'Konsultasi remote baru' : 'Konsultasi baru',
        body: `${userName} — ${row.service}${remoteSuffix}`,
        tone: (row.requiresRemote ? 'warning' : 'primary') as NotificationTone,
        icon: 'message' as NotificationIconKey,
        createdAt: row.createdAt.toISOString(),
        href: row.requiresRemote ? '/teknisi/konsultasi?filter=remote' : '/teknisi/konsultasi',
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
