import 'server-only'

import { prisma } from '@/lib/db'
import type { SupportTicketRelatedType, UserRole } from '@prisma/client'
import {
  SUPPORT_TICKET_RELATED_LIMIT,
  supportTicketBasePath,
} from '@/lib/support-ticket-constants'

export type RelatedServiceItem = {
  type: SupportTicketRelatedType
  id: string | null
  label: string
  subtitle?: string
  href?: string
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)

export async function fetchRelatedServicesForReporter(
  userId: string,
  role: UserRole,
): Promise<RelatedServiceItem[]> {
  const basePath = supportTicketBasePath(role === 'TEKNISI' ? 'TEKNISI' : 'USER')
  const items: RelatedServiceItem[] = []

  if (role === 'USER') {
    const [konsultasi, remote, inspeksi, orders] = await Promise.all([
      prisma.konsultasiSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { teknisi: { select: { name: true } } },
      }),
      prisma.remoteSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { teknisi: { select: { name: true } } },
      }),
      prisma.inspectionOrder.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { teknisi: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { buyerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: {
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      }),
    ])

    for (const row of konsultasi) {
      items.push({
        type: 'KONSULTASI',
        id: row.id,
        label: `Konsultasi — ${row.teknisi.name} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${row.service}`,
        href: `${basePath}/new?relatedType=KONSULTASI&relatedId=${row.id}`,
      })
    }
    for (const row of remote) {
      items.push({
        type: 'REMOTE',
        id: row.id,
        label: `Remote — ${row.teknisi.name} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ID ${row.remoteId}`,
        href: `${basePath}/new?relatedType=REMOTE&relatedId=${row.id}`,
      })
    }
    for (const row of inspeksi) {
      items.push({
        type: 'INSPEKSI',
        id: row.id,
        label: `Inspeksi — ${row.productName} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${row.orderCode}`,
        href: `${basePath}/new?relatedType=INSPEKSI&relatedId=${row.id}`,
      })
    }
    for (const row of orders) {
      const productName = row.items[0]?.product.name ?? 'Produk'
      items.push({
        type: 'MARKETPLACE_ORDER',
        id: row.id,
        label: `Order — ${row.orderCode} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${productName}`,
        href: `${basePath}/new?relatedType=MARKETPLACE_ORDER&relatedId=${row.id}`,
      })
    }
  } else if (role === 'TEKNISI') {
    const [konsultasi, remote, inspeksi, orders] = await Promise.all([
      prisma.konsultasiSession.findMany({
        where: { teknisiId: userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { user: { select: { name: true } } },
      }),
      prisma.remoteSession.findMany({
        where: { teknisiId: userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { user: { select: { name: true } } },
      }),
      prisma.inspectionOrder.findMany({
        where: { teknisiId: userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: { user: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { sellerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: SUPPORT_TICKET_RELATED_LIMIT,
        include: {
          buyer: { select: { name: true } },
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      }),
    ])

    for (const row of konsultasi) {
      items.push({
        type: 'KONSULTASI',
        id: row.id,
        label: `Konsultasi — ${row.user.name} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${row.service}`,
        href: `${basePath}/new?relatedType=KONSULTASI&relatedId=${row.id}`,
      })
    }
    for (const row of remote) {
      items.push({
        type: 'REMOTE',
        id: row.id,
        label: `Remote — ${row.user.name} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ID ${row.remoteId}`,
        href: `${basePath}/new?relatedType=REMOTE&relatedId=${row.id}`,
      })
    }
    for (const row of inspeksi) {
      items.push({
        type: 'INSPEKSI',
        id: row.id,
        label: `Inspeksi — ${row.productName} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${row.orderCode}`,
        href: `${basePath}/new?relatedType=INSPEKSI&relatedId=${row.id}`,
      })
    }
    for (const row of orders) {
      const productName = row.items[0]?.product.name ?? 'Produk'
      items.push({
        type: 'MARKETPLACE_ORDER',
        id: row.id,
        label: `Pesanan — ${row.orderCode} — ${fmtDate(row.updatedAt)}`,
        subtitle: `Status: ${row.status} · ${productName} · ${row.buyer.name}`,
        href: `${basePath}/new?relatedType=MARKETPLACE_ORDER&relatedId=${row.id}`,
      })
    }
  }

  items.sort((a, b) => {
    const da = a.subtitle ?? ''
    const db = b.subtitle ?? ''
    return db.localeCompare(da)
  })

  const limited = items.slice(0, SUPPORT_TICKET_RELATED_LIMIT)
  limited.push({ type: 'OTHER', id: null, label: 'Lainnya (isi manual)' })
  return limited
}

export async function verifyRelatedServiceOwnership(
  userId: string,
  role: UserRole,
  relatedType: SupportTicketRelatedType,
  relatedId: string,
): Promise<boolean> {
  if (relatedType === 'OTHER') return true

  switch (relatedType) {
    case 'KONSULTASI': {
      const row = await prisma.konsultasiSession.findUnique({
        where: { id: relatedId },
        select: { userId: true, teknisiId: true },
      })
      if (!row) return false
      return role === 'USER' ? row.userId === userId : row.teknisiId === userId
    }
    case 'REMOTE': {
      const row = await prisma.remoteSession.findUnique({
        where: { id: relatedId },
        select: { userId: true, teknisiId: true },
      })
      if (!row) return false
      return role === 'USER' ? row.userId === userId : row.teknisiId === userId
    }
    case 'INSPEKSI': {
      const row = await prisma.inspectionOrder.findUnique({
        where: { id: relatedId },
        select: { userId: true, teknisiId: true },
      })
      if (!row) return false
      return role === 'USER' ? row.userId === userId : row.teknisiId === userId
    }
    case 'MARKETPLACE_ORDER': {
      const row = await prisma.order.findUnique({
        where: { id: relatedId },
        select: { buyerId: true, sellerId: true },
      })
      if (!row) return false
      return role === 'USER' ? row.buyerId === userId : row.sellerId === userId
    }
    default:
      return false
  }
}
