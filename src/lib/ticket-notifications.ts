import { prisma } from '@/lib/db'
import type {
  NotificationIconKey,
  NotificationTone,
  PlatformNotification,
} from '@/data/mock-platform-notifications'
import { sortNotificationsNewestFirst } from '@/lib/platform-notifications'
import type { UserRole } from '@prisma/client'
import { supportTicketBasePath } from '@/lib/support-ticket-constants'

const LIMIT = 30

function ticketNotification(
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

export async function fetchTicketNotificationsForReporter(
  userId: string,
  role: UserRole,
): Promise<PlatformNotification[]> {
  if (role !== 'USER' && role !== 'TEKNISI') return []

  const audience = role
  const basePath = supportTicketBasePath(role)

  const [unreadReplies, resolved] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { reporterId: userId, reporterUnread: true, status: { not: 'RESOLVED' } },
      orderBy: { lastMessageAt: 'desc' },
      take: LIMIT,
    }),
    prisma.supportTicket.findMany({
      where: {
        reporterId: userId,
        status: 'RESOLVED',
        resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { resolvedAt: 'desc' },
      take: 10,
    }),
  ])

  const items: PlatformNotification[] = []

  for (const row of unreadReplies) {
    items.push(
      ticketNotification(
        {
          id: `ticket-reply-${row.id}`,
          title: 'Balasan admin pada tiket Anda',
          body: `${row.publicId} — ${row.subject}`,
          tone: 'primary' as NotificationTone,
          icon: 'message' as NotificationIconKey,
          createdAt: row.lastMessageAt.toISOString(),
          href: `${basePath}/${row.id}`,
        },
        [audience],
      ),
    )
  }

  for (const row of resolved) {
    items.push(
      ticketNotification(
        {
          id: `ticket-resolved-${row.id}`,
          title: 'Tiket Anda telah diselesaikan',
          body: `${row.publicId} — ${row.subject}`,
          tone: 'success' as NotificationTone,
          icon: 'check' as NotificationIconKey,
          createdAt: (row.resolvedAt ?? row.updatedAt).toISOString(),
          href: `${basePath}/${row.id}`,
        },
        [audience],
      ),
    )
  }

  return sortNotificationsNewestFirst(items)
}

export async function fetchTicketNotificationsForAdmin(): Promise<PlatformNotification[]> {
  const [newTickets, unreadReplies, urgent] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { status: 'OPEN', adminUnread: true },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: { reporter: { select: { name: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { adminUnread: true, status: { notIn: ['OPEN', 'RESOLVED'] } },
      orderBy: { lastMessageAt: 'desc' },
      take: LIMIT,
      include: { reporter: { select: { name: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { priority: 'URGENT', status: { not: 'RESOLVED' } },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
      include: { reporter: { select: { name: true } } },
    }),
  ])

  const items: PlatformNotification[] = []
  const seen = new Set<string>()

  const push = (n: PlatformNotification) => {
    if (seen.has(n.id)) return
    seen.add(n.id)
    items.push(n)
  }

  for (const row of newTickets) {
    push(
      ticketNotification(
        {
          id: `admin-ticket-new-${row.id}`,
          title: `Tiket baru ${row.publicId}`,
          body: `${row.reporter.name} — ${row.subject}`,
          tone: 'warning' as NotificationTone,
          icon: 'bell' as NotificationIconKey,
          createdAt: row.createdAt.toISOString(),
          href: `/admin/tickets?id=${row.id}`,
        },
        ['ADMIN'],
      ),
    )
  }

  for (const row of unreadReplies) {
    push(
      ticketNotification(
        {
          id: `admin-ticket-reply-${row.id}`,
          title: `Balasan baru ${row.publicId}`,
          body: `${row.reporter.name} — ${row.subject}`,
          tone: 'primary' as NotificationTone,
          icon: 'message' as NotificationIconKey,
          createdAt: row.lastMessageAt.toISOString(),
          href: `/admin/tickets?id=${row.id}`,
        },
        ['ADMIN'],
      ),
    )
  }

  for (const row of urgent) {
    push(
      ticketNotification(
        {
          id: `admin-ticket-urgent-${row.id}`,
          title: `Tiket mendesak ${row.publicId}`,
          body: `${row.reporter.name} — ${row.subject}`,
          tone: 'warning' as NotificationTone,
          icon: 'shield' as NotificationIconKey,
          createdAt: row.lastMessageAt.toISOString(),
          href: `/admin/tickets?id=${row.id}`,
        },
        ['ADMIN'],
      ),
    )
  }

  return sortNotificationsNewestFirst(items)
}

export async function countReporterUnreadTickets(userId: string): Promise<number> {
  return prisma.supportTicket.count({
    where: { reporterId: userId, reporterUnread: true, status: { not: 'RESOLVED' } },
  })
}

export async function countAdminUnreadTickets(): Promise<number> {
  return prisma.supportTicket.count({
    where: { adminUnread: true, status: { not: 'RESOLVED' } },
  })
}
