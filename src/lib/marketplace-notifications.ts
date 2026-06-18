import { prisma } from '@/lib/db'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'
import { PACKAGING_ADMIN_SLA_HOURS } from '@/lib/validations/marketplace-packaging'
import { isTerminalTrackingStatus } from '@/lib/shipping-courier'

const LIMIT = 30
const MS_PER_HOUR = 60 * 60 * 1000
const RECENT_RESOLVED_MS = 7 * 24 * 60 * 60 * 1000

function mktNotification(
  partial: Omit<PlatformNotification, 'audiences' | 'active' | 'kind'>,
  audiences: PlatformNotification['audiences'],
): PlatformNotification {
  return {
    ...partial,
    audiences,
    active: true,
    kind: 'order',
  }
}

/** Notifikasi marketplace untuk pembeli: konfirmasi paket, komplain, dll. */
export async function fetchMarketplaceBuyerNotifications(
  buyerId: string,
): Promise<PlatformNotification[]> {
  const now = new Date()
  const items: PlatformNotification[] = []

  const [awaitingConfirm, complaints] = await Promise.all([
    prisma.order.findMany({
      where: {
        buyerId,
        status: 'SHIPPED',
        deliveredAt: { not: null },
        buyerActionDeadline: { gt: now },
        complaint: null,
      },
      orderBy: { deliveredAt: 'desc' },
      take: LIMIT,
      include: {
        items: { take: 1, include: { product: { select: { name: true } } } },
      },
    }),
    prisma.orderComplaint.findMany({
      where: {
        buyerId,
        status: { in: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: { order: { select: { orderCode: true } } },
    }),
  ])

  for (const order of awaitingConfirm) {
    if (!isTerminalTrackingStatus(order.trackingSummaryStatus)) continue
    const productName = order.items[0]?.product.name ?? 'Produk'
    items.push(
      mktNotification(
        {
          id: `mkt-buyer-confirm-${order.id}`,
          title: 'Paket sudah sampai',
          body: `${order.orderCode} — ${productName}. Konfirmasi pesanan sesuai atau ajukan komplain.`,
          tone: 'warning' as NotificationTone,
          icon: 'package' as NotificationIconKey,
          createdAt: (order.deliveredAt ?? order.updatedAt).toISOString(),
          href: '/user/orders',
        },
        ['USER'],
      ),
    )
  }

  for (const c of complaints) {
    if (c.status === 'RESOLVED' && c.resolvedAt) {
      if (now.getTime() - c.resolvedAt.getTime() > RECENT_RESOLVED_MS) continue
      items.push(
        mktNotification(
          {
            id: `mkt-buyer-complaint-resolved-${c.id}`,
            title: 'Komplain diselesaikan',
            body: `${c.order.orderCode} — keputusan admin: ${c.resolution ?? 'selesai'}.`,
            tone: 'success' as NotificationTone,
            icon: 'check' as NotificationIconKey,
            createdAt: c.resolvedAt.toISOString(),
            href: '/user/orders',
          },
          ['USER'],
        ),
      )
      continue
    }

    if (c.status === 'OPEN') {
      items.push(
        mktNotification(
          {
            id: `mkt-buyer-complaint-open-${c.id}`,
            title: 'Komplain menunggu respons penjual',
            body: `${c.order.orderCode} — penjual punya waktu untuk merespons.`,
            tone: 'warning' as NotificationTone,
            icon: 'bell' as NotificationIconKey,
            createdAt: c.updatedAt.toISOString(),
            href: '/user/orders',
          },
          ['USER'],
        ),
      )
    } else if (c.status === 'SELLER_RESPONDED') {
      items.push(
        mktNotification(
          {
            id: `mkt-buyer-complaint-responded-${c.id}`,
            title: 'Penjual merespons komplain',
            body: `${c.order.orderCode} — tinjau respons atau eskalasi ke admin.`,
            tone: 'primary' as NotificationTone,
            icon: 'message' as NotificationIconKey,
            createdAt: (c.sellerRespondedAt ?? c.updatedAt).toISOString(),
            href: '/user/orders',
          },
          ['USER'],
        ),
      )
    } else if (c.status === 'ESCALATED') {
      items.push(
        mktNotification(
          {
            id: `mkt-buyer-complaint-escalated-${c.id}`,
            title: 'Komplain ditinjau admin',
            body: `${c.order.orderCode} — menunggu keputusan admin.`,
            tone: 'primary' as NotificationTone,
            icon: 'shield' as NotificationIconKey,
            createdAt: (c.escalatedAt ?? c.updatedAt).toISOString(),
            href: '/user/orders',
          },
          ['USER'],
        ),
      )
    }
  }

  return items
}

/** Notifikasi marketplace untuk penjual: packaging, komplain, pesanan baru. */
export async function fetchMarketplaceSellerNotifications(
  sellerId: string,
): Promise<PlatformNotification[]> {
  const now = new Date()
  const items: PlatformNotification[] = []

  const [packagingNeeded, packagingProofs, complaints] = await Promise.all([
    prisma.order.findMany({
      where: {
        sellerId,
        status: 'PAID',
        OR: [
          { packagingProof: null },
          { packagingProof: { status: 'REJECTED', resubmitDeadline: { gt: now } } },
        ],
        items: { some: { product: { category: { not: 'SOFTWARE' } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: {
        items: { take: 1, include: { product: { select: { name: true } } } },
        packagingProof: true,
      },
    }),
    prisma.orderPackagingProof.findMany({
      where: {
        sellerId,
        status: { in: ['PENDING', 'APPROVED', 'REJECTED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: { order: { select: { orderCode: true, status: true } } },
    }),
    prisma.orderComplaint.findMany({
      where: {
        sellerId,
        status: { in: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
      include: { order: { select: { orderCode: true } } },
    }),
  ])

  for (const order of packagingNeeded) {
    const productName = order.items[0]?.product.name ?? 'Produk'
    const rejected = order.packagingProof?.status === 'REJECTED'
    items.push(
      mktNotification(
        {
          id: `mkt-seller-packaging-needed-${order.id}`,
          title: rejected ? 'Upload ulang bukti packaging' : 'Upload bukti packaging wajib',
          body: rejected
            ? `${order.orderCode} — ${productName}. Bukti ditolak, upload ulang sebelum batas waktu.`
            : `${order.orderCode} — ${productName}. Upload foto & video kemasan sebelum proses pesanan.`,
          tone: 'warning' as NotificationTone,
          icon: 'package' as NotificationIconKey,
          createdAt: order.updatedAt.toISOString(),
          href: '/teknisi/pesanan',
        },
        ['TEKNISI'],
      ),
    )
  }

  for (const proof of packagingProofs) {
    if (proof.order.status !== 'PAID' && proof.status !== 'PENDING') continue

    if (proof.status === 'PENDING') {
      items.push(
        mktNotification(
          {
            id: `mkt-seller-packaging-pending-${proof.id}`,
            title: 'Bukti packaging menunggu review',
            body: `${proof.order.orderCode} — admin sedang mereview bukti kemasan Anda.`,
            tone: 'primary' as NotificationTone,
            icon: 'bell' as NotificationIconKey,
            createdAt: (proof.submittedAt ?? proof.updatedAt).toISOString(),
            href: '/teknisi/pesanan',
          },
          ['TEKNISI'],
        ),
      )
    } else if (proof.status === 'APPROVED' && proof.reviewedAt) {
      const recent = now.getTime() - proof.reviewedAt.getTime() < RECENT_RESOLVED_MS
      if (!recent) continue
      items.push(
        mktNotification(
          {
            id: `mkt-seller-packaging-approved-${proof.id}`,
            title: 'Bukti packaging disetujui',
            body: `${proof.order.orderCode} — Anda bisa memproses dan kirim pesanan.`,
            tone: 'success' as NotificationTone,
            icon: 'check' as NotificationIconKey,
            createdAt: proof.reviewedAt.toISOString(),
            href: '/teknisi/pesanan',
          },
          ['TEKNISI'],
        ),
      )
    }
  }

  for (const c of complaints) {
    if (c.status === 'OPEN' && c.sellerDeadline > now) {
      items.push(
        mktNotification(
          {
            id: `mkt-seller-complaint-open-${c.id}`,
            title: 'Komplain baru dari pembeli',
            body: `${c.order.orderCode} — respons dalam batas waktu yang ditentukan.`,
            tone: 'warning' as NotificationTone,
            icon: 'message' as NotificationIconKey,
            createdAt: c.createdAt.toISOString(),
            href: '/teknisi/pesanan',
          },
          ['TEKNISI'],
        ),
      )
    } else if (c.status === 'ESCALATED') {
      items.push(
        mktNotification(
          {
            id: `mkt-seller-complaint-escalated-${c.id}`,
            title: 'Komplain dieskalasi ke admin',
            body: `${c.order.orderCode} — admin akan memutuskan.`,
            tone: 'primary' as NotificationTone,
            icon: 'shield' as NotificationIconKey,
            createdAt: (c.escalatedAt ?? c.updatedAt).toISOString(),
            href: '/teknisi/pesanan',
          },
          ['TEKNISI'],
        ),
      )
    } else if (c.status === 'RESOLVED' && c.resolvedAt) {
      if (now.getTime() - c.resolvedAt.getTime() > RECENT_RESOLVED_MS) continue
      items.push(
        mktNotification(
          {
            id: `mkt-seller-complaint-resolved-${c.id}`,
            title: 'Komplain diselesaikan',
            body: `${c.order.orderCode} — keputusan: ${c.resolution ?? 'selesai'}.`,
            tone: 'neutral' as NotificationTone,
            icon: 'check' as NotificationIconKey,
            createdAt: c.resolvedAt.toISOString(),
            href: '/teknisi/pesanan',
          },
          ['TEKNISI'],
        ),
      )
    }
  }

  return items
}

/** Notifikasi marketplace untuk admin: packaging review, komplain eskalasi. */
export async function fetchMarketplaceAdminNotifications(): Promise<PlatformNotification[]> {
  const now = new Date()
  const slaCutoff = new Date(now.getTime() - PACKAGING_ADMIN_SLA_HOURS * MS_PER_HOUR)
  const items: PlatformNotification[] = []

  const [packagingPending, complaintsEscalated, complaintsOpenExpired] = await Promise.all([
    prisma.orderPackagingProof.findMany({
      where: { status: 'PENDING' },
      orderBy: { submittedAt: 'asc' },
      take: LIMIT,
      include: {
        order: { select: { orderCode: true } },
        seller: { select: { name: true } },
      },
    }),
    prisma.orderComplaint.findMany({
      where: { status: 'ESCALATED' },
      orderBy: { escalatedAt: 'asc' },
      take: LIMIT,
      include: {
        order: { select: { orderCode: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    }),
    prisma.orderComplaint.findMany({
      where: { status: 'OPEN', sellerDeadline: { lt: now } },
      orderBy: { sellerDeadline: 'asc' },
      take: 10,
      include: { order: { select: { orderCode: true } } },
    }),
  ])

  for (const proof of packagingPending) {
    const overdue = proof.submittedAt != null && proof.submittedAt < slaCutoff
    items.push(
      mktNotification(
        {
          id: `mkt-admin-packaging-${proof.id}`,
          title: overdue ? 'URGENT: Bukti packaging >24 jam' : 'Bukti packaging menunggu review',
          body: `${proof.order.orderCode} — ${proof.seller.name ?? 'Penjual'}.`,
          tone: (overdue ? 'warning' : 'primary') as NotificationTone,
          icon: 'package' as NotificationIconKey,
          createdAt: (proof.submittedAt ?? proof.createdAt).toISOString(),
          href: '/admin/marketplace-packaging',
        },
        ['ADMIN'],
      ),
    )
  }

  for (const c of complaintsEscalated) {
    items.push(
      mktNotification(
        {
          id: `mkt-admin-complaint-${c.id}`,
          title: 'Komplain marketplace dieskalasi',
          body: `${c.order.orderCode} — ${c.buyer.name} vs ${c.seller.name}.`,
          tone: 'warning' as NotificationTone,
          icon: 'shield' as NotificationIconKey,
          createdAt: (c.escalatedAt ?? c.updatedAt).toISOString(),
          href: '/admin/komplain?tab=marketplace',
        },
        ['ADMIN'],
      ),
    )
  }

  for (const c of complaintsOpenExpired) {
    items.push(
      mktNotification(
        {
          id: `mkt-admin-complaint-expired-${c.id}`,
          title: 'Komplain menunggu eskalasi otomatis',
          body: `${c.order.orderCode} — batas respons penjual sudah lewat.`,
          tone: 'warning' as NotificationTone,
          icon: 'bell' as NotificationIconKey,
          createdAt: c.sellerDeadline.toISOString(),
          href: '/admin/komplain?tab=marketplace&status=ACTIVE',
        },
        ['ADMIN'],
      ),
    )
  }

  return items
}

export async function fetchMarketplaceNotificationsForUser(
  userId: string,
  role: 'USER' | 'TEKNISI' | 'ADMIN',
): Promise<PlatformNotification[]> {
  const [buyer, seller, admin] = await Promise.all([
    fetchMarketplaceBuyerNotifications(userId),
    role === 'TEKNISI'
      ? fetchMarketplaceSellerNotifications(userId)
      : Promise.resolve([]),
    role === 'ADMIN' ? fetchMarketplaceAdminNotifications() : Promise.resolve([]),
  ])

  return sortNotificationsNewestFirst([...buyer, ...seller, ...admin])
}
