import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import type { SmartSearchApiResult } from '@/lib/dashboard-smart-search'

export const dynamic = 'force-dynamic'

const MIN_QUERY_LEN = 2
const DEFAULT_LIMIT = 8

function takeLimit(raw: string | null): number {
  const n = parseInt(raw || String(DEFAULT_LIMIT), 10)
  return Math.min(15, Math.max(1, Number.isFinite(n) ? n : DEFAULT_LIMIT))
}

async function searchForUser(userId: string, q: string, limit: number): Promise<SmartSearchApiResult[]> {
  const results: SmartSearchApiResult[] = []
  const pattern = q

  const [imei, server, topup, shop] = await Promise.all([
    prisma.imeiOrder.findMany({
      where: {
        userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { imei: { contains: pattern } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        service: { select: { title: true } },
      },
    }),
    prisma.serverOrder.findMany({
      where: {
        userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        service: { select: { title: true } },
      },
    }),
    prisma.topupOrder.findMany({
      where: {
        userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { productSlug: { contains: pattern, mode: 'insensitive' } },
          { accountId: { contains: pattern, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderCode: true, status: true, productSlug: true },
    }),
    prisma.order.findMany({
      where: {
        buyerId: userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { items: { some: { product: { name: { contains: pattern, mode: 'insensitive' } } } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        items: { take: 1, select: { product: { select: { name: true } } } },
      },
    }),
  ])

  for (const o of imei) {
    results.push({
      id: `imei-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `IMEI · ${o.service.title} · ${o.status}`,
      href: `/imei/orders?q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of server) {
    results.push({
      id: `server-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Server · ${o.service.title} · ${o.status}`,
      href: `/imei/orders?tab=server&q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of topup) {
    results.push({
      id: `topup-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Top up · ${o.productSlug} · ${o.status}`,
      href: `/user/riwayat?q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of shop) {
    const productName = o.items[0]?.product.name ?? 'Belanja'
    results.push({
      id: `shop-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Belanja · ${productName} · ${o.status}`,
      href: `/user/riwayat?q=${encodeURIComponent(o.orderCode)}`,
    })
  }

  return results.slice(0, limit)
}

async function searchForTeknisi(userId: string, q: string, limit: number): Promise<SmartSearchApiResult[]> {
  const results: SmartSearchApiResult[] = []
  const pattern = q

  const [products, shopSold, imei, server] = await Promise.all([
    prisma.product.findMany({
      where: {
        sellerId: userId,
        OR: [
          { name: { contains: pattern, mode: 'insensitive' } },
          { description: { contains: pattern, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, category: true },
    }),
    prisma.order.findMany({
      where: {
        sellerId: userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { buyer: { name: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        buyer: { select: { name: true } },
      },
    }),
    prisma.imeiOrder.findMany({
      where: {
        userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { imei: { contains: pattern } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        service: { select: { title: true } },
      },
    }),
    prisma.serverOrder.findMany({
      where: {
        userId,
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        service: { select: { title: true } },
      },
    }),
  ])

  for (const p of products) {
    results.push({
      id: `product-${p.id}`,
      kind: 'product',
      label: p.name,
      hint: `Produk · ${p.category}`,
      href: `/teknisi/produk?q=${encodeURIComponent(p.name)}`,
    })
  }
  for (const o of shopSold) {
    results.push({
      id: `shop-sold-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Penjualan · ${o.buyer.name} · ${o.status}`,
      href: `/teknisi/saldo?q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of imei) {
    results.push({
      id: `imei-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `IMEI · ${o.service.title} · ${o.status}`,
      href: `/imei/orders?q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of server) {
    results.push({
      id: `server-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Server · ${o.service.title} · ${o.status}`,
      href: `/imei/orders?tab=server&q=${encodeURIComponent(o.orderCode)}`,
    })
  }

  return results.slice(0, limit)
}

async function searchForAdmin(q: string, limit: number): Promise<SmartSearchApiResult[]> {
  const results: SmartSearchApiResult[] = []
  const pattern = q

  const [users, imei, server, products] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: pattern, mode: 'insensitive' } },
          { email: { contains: pattern, mode: 'insensitive' } },
          { phone: { contains: pattern, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.imeiOrder.findMany({
      where: {
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { imei: { contains: pattern } },
          { user: { email: { contains: pattern, mode: 'insensitive' } } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        user: { select: { name: true } },
        service: { select: { title: true } },
      },
    }),
    prisma.serverOrder.findMany({
      where: {
        OR: [
          { orderCode: { contains: pattern, mode: 'insensitive' } },
          { user: { email: { contains: pattern, mode: 'insensitive' } } },
          { service: { title: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        status: true,
        user: { select: { name: true } },
        service: { select: { title: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: pattern, mode: 'insensitive' } },
          { seller: { name: { contains: pattern, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        seller: { select: { name: true } },
      },
    }),
  ])

  for (const u of users) {
    results.push({
      id: `user-${u.id}`,
      kind: 'user',
      label: u.name,
      hint: `${u.role} · ${u.email}`,
      href: `/admin/management?q=${encodeURIComponent(u.email)}`,
    })
  }
  for (const o of imei) {
    results.push({
      id: `imei-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `IMEI · ${o.user.name} · ${o.status}`,
      href: `/admin/imei?tab=orders&q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const o of server) {
    results.push({
      id: `server-${o.id}`,
      kind: 'order',
      label: o.orderCode,
      hint: `Server · ${o.user.name} · ${o.status}`,
      href: `/admin/imei?tab=server-orders&q=${encodeURIComponent(o.orderCode)}`,
    })
  }
  for (const p of products) {
    results.push({
      id: `product-${p.id}`,
      kind: 'product',
      label: p.name,
      hint: `Produk · ${p.seller.name}`,
      href: `/admin/produk?q=${encodeURIComponent(p.name)}`,
    })
  }

  return results.slice(0, limit)
}

async function runSearch(role: UserRole, userId: string, q: string, limit: number) {
  if (role === 'ADMIN') return searchForAdmin(q, limit)
  if (role === 'TEKNISI') return searchForTeknisi(userId, q, limit)
  return searchForUser(userId, q, limit)
}

/** GET /api/search?q=... — role-scoped dashboard search */
export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = takeLimit(searchParams.get('limit'))

  if (q.length < MIN_QUERY_LEN) {
    return apiSuccess({ results: [] as SmartSearchApiResult[], query: q })
  }

  try {
    const results = await runSearch(session.user.role as UserRole, session.user.id, q, limit)
    return apiSuccess({ results, query: q })
  } catch (e) {
    console.error('[API_SEARCH]', e)
    return apiError('Gagal mencari', 500)
  }
}
