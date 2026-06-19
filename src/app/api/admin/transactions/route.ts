/**
 * GET /api/admin/transactions
 *
 * Unified transaction list across all platform order types.
 *
 * Query params:
 *   - type: 'all' | 'marketplace' | 'imei' | 'server' | 'topup' | 'rekber'
 *   - status: string (varies per type, or unified: pending/processing/success/failed)
 *   - q: string (search orderCode, user name/email, product/service title)
 *   - from: ISO date
 *   - to: ISO date
 *   - limit: number (default 100, max 300)
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { tryPrismaQuery } from '@/lib/try-prisma-query'

export const dynamic = 'force-dynamic'

export type TransactionType = 'marketplace' | 'imei' | 'server' | 'topup' | 'rekber'

export type UnifiedTransactionDto = {
  id: string
  type: TransactionType
  orderCode: string
  /** Buyer / user yang melakukan order */
  user: { id: string; name: string; email: string; role: string }
  /** Seller / teknisi (jika ada) */
  seller: { id: string; name: string; email: string } | null
  /** Judul / deskripsi singkat */
  title: string
  /** Nominal (IDR) */
  amount: string
  /** Pendapatan platform (fee admin) — null jika tidak berlaku */
  platformRevenue: string | null
  /** Status asli dari model */
  status: string
  /** Status yang dinormalisasi untuk badge */
  normalizedStatus: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'
  /** Waktu dibuat */
  createdAt: string
  /** Waktu terakhir diupdate */
  updatedAt: string
  /** Metadata tambahan per tipe */
  meta: Record<string, string | null>
}

export type TransactionStats = {
  totalAll: number
  totalMarketplace: number
  totalImei: number
  totalServer: number
  totalTopup: number
  totalRekber: number
  pendingCount: number
  successCount: number
  revenueToday: string
}

function normalizeStatus(type: TransactionType, status: string): UnifiedTransactionDto['normalizedStatus'] {
  const s = status.toUpperCase()
  if (['COMPLETED', 'SUCCESS', 'RELEASED', 'PAID'].includes(s)) return 'success'
  if (['CANCELLED', 'REFUNDED'].includes(s)) return 'cancelled'
  if (['REJECTED', 'FAILED', 'DISPUTED'].includes(s)) return 'failed'
  if (['IN_PROCESS', 'PROCESSING', 'SHIPPED', 'FULFILLING', 'HELD', 'ACCEPTED'].includes(s)) return 'processing'
  return 'pending'
}

function marketplacePlatformRevenue(
  status: string,
  buyerFee: { toString(): string },
  sellerFee: { toString(): string },
): string | null {
  if (['CANCELLED', 'REFUNDED'].includes(status.toUpperCase())) return '0'
  const total = Number(buyerFee) + Number(sellerFee)
  if (status.toUpperCase() === 'COMPLETED') return String(total)
  return total > 0 ? String(total) : null
}

function rekberPlatformRevenue(status: string, fee: { toString(): string }): string | null {
  if (['REFUNDED'].includes(status.toUpperCase())) return '0'
  const amount = Number(fee)
  if (amount <= 0) return null
  if (['RELEASED', 'HELD'].includes(status.toUpperCase())) return String(amount)
  return null
}

function topupPlatformRevenue(status: string, fee: { toString(): string }): string | null {
  const amount = Number(fee)
  if (amount <= 0) return null
  if (status.toUpperCase() === 'COMPLETED') return String(amount)
  return null
}

function buildDateFilter(from: string | null, to: string | null): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined
  const range: Prisma.DateTimeFilter = {}
  if (from) {
    const d = new Date(from)
    if (Number.isNaN(d.getTime())) return undefined
    range.gte = d
  }
  if (to) {
    const d = new Date(to)
    if (Number.isNaN(d.getTime())) return undefined
    d.setHours(23, 59, 59, 999)
    range.lte = d
  }
  return range
}

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const type = (url.searchParams.get('type') ?? 'all') as 'all' | TransactionType
  const statusParam = url.searchParams.get('status')?.toUpperCase() ?? ''
  const q = url.searchParams.get('q')?.trim() ?? ''
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '100', 10) || 100, 1), 300)

  const dateFilter = buildDateFilter(from, to)

  try {
    const results: UnifiedTransactionDto[] = []

    // --- Marketplace Orders ---
    if (type === 'all' || type === 'marketplace') {
      const marketplaceItems = await tryPrismaQuery(
        'admin-transactions-marketplace',
        async () => {
          const where: Prisma.OrderWhereInput = {}
          if (statusParam) where.status = statusParam as Prisma.OrderWhereInput['status']
          if (dateFilter) where.createdAt = dateFilter
          if (q) {
            where.OR = [
              { orderCode: { contains: q, mode: 'insensitive' } },
              { buyer: { name: { contains: q, mode: 'insensitive' } } },
              { buyer: { email: { contains: q, mode: 'insensitive' } } },
              { seller: { name: { contains: q, mode: 'insensitive' } } },
            ]
          }
          const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              buyer: { select: { id: true, name: true, email: true, role: true } },
              seller: { select: { id: true, name: true, email: true } },
              items: { include: { product: { select: { name: true } } }, take: 3 },
            },
          })
          return orders.map((o) => {
            const productNames = o.items.map((i) => i.product.name).join(', ')
            return {
              id: o.id,
              type: 'marketplace' as const,
              orderCode: o.orderCode,
              user: { ...o.buyer, role: o.buyer.role },
              seller: o.seller,
              title: productNames || 'Marketplace order',
              amount: o.total.toString(),
              platformRevenue: marketplacePlatformRevenue(o.status, o.buyerFeeAmount, o.sellerFeeAmount),
              status: o.status,
              normalizedStatus: normalizeStatus('marketplace', o.status),
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt.toISOString(),
              meta: {
                note: o.note,
                buyerFee: o.buyerFeeAmount.toString(),
                sellerFee: o.sellerFeeAmount.toString(),
              },
            }
          })
        },
        [] as UnifiedTransactionDto[],
      )
      results.push(...marketplaceItems)
    }

    // --- IMEI Orders ---
    if (type === 'all' || type === 'imei') {
      const where: Prisma.ImeiOrderWhereInput = {}
      if (statusParam) where.status = statusParam as Prisma.ImeiOrderWhereInput['status']
      if (dateFilter) where.createdAt = dateFilter
      if (q) {
        where.OR = [
          { orderCode: { contains: q, mode: 'insensitive' } },
          { imei: { contains: q } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { service: { title: { contains: q, mode: 'insensitive' } } },
        ]
      }
      const orders = await prisma.imeiOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          service: { select: { title: true } },
        },
      })
      for (const o of orders) {
        results.push({
          id: o.id,
          type: 'imei',
          orderCode: o.orderCode,
          user: { ...o.user, role: o.user.role },
          seller: null,
          title: o.service.title,
          amount: o.price.toString(),
          platformRevenue: null,
          status: o.status,
          normalizedStatus: normalizeStatus('imei', o.status),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          meta: { imei: o.imei, code: o.code },
        })
      }
    }

    // --- Server Orders ---
    if (type === 'all' || type === 'server') {
      const where: Prisma.ServerOrderWhereInput = {}
      if (statusParam) where.status = statusParam as Prisma.ServerOrderWhereInput['status']
      if (dateFilter) where.createdAt = dateFilter
      if (q) {
        where.OR = [
          { orderCode: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { service: { title: { contains: q, mode: 'insensitive' } } },
        ]
      }
      const orders = await prisma.serverOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          service: { select: { title: true } },
        },
      })
      for (const o of orders) {
        results.push({
          id: o.id,
          type: 'server',
          orderCode: o.orderCode,
          user: { ...o.user, role: o.user.role },
          seller: null,
          title: o.service.title,
          amount: o.price.toString(),
          platformRevenue: null,
          status: o.status,
          normalizedStatus: normalizeStatus('server', o.status),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          meta: { email: o.email, code: o.code },
        })
      }
    }

    // --- Topup Orders ---
    if (type === 'all' || type === 'topup') {
      const where: Prisma.TopupOrderWhereInput = {}
      if (statusParam) where.status = statusParam as Prisma.TopupOrderWhereInput['status']
      if (dateFilter) where.createdAt = dateFilter
      if (q) {
        where.OR = [
          { orderCode: { contains: q, mode: 'insensitive' } },
          { accountId: { contains: q } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ]
      }
      const orders = await prisma.topupOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      })
      for (const o of orders) {
        results.push({
          id: o.id,
          type: 'topup',
          orderCode: o.orderCode,
          user: o.user
            ? { ...o.user, role: o.user.role }
            : { id: '', name: o.email ?? 'Guest', email: o.email ?? '', role: 'USER' },
          seller: null,
          title: `Top Up ${o.productSlug} (${o.denominationSku})`,
          amount: o.total.toString(),
          platformRevenue: topupPlatformRevenue(o.status, o.fee),
          status: o.status,
          normalizedStatus: normalizeStatus('topup', o.status),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          meta: { accountId: o.accountId, paymentMethod: o.paymentMethod, fee: o.fee.toString() },
        })
      }
    }

    // --- Rekber ---
    if (type === 'all' || type === 'rekber') {
      const rekberItems = await tryPrismaQuery(
        'admin-transactions-rekber',
        async () => {
          const where: Prisma.RekberTransactionWhereInput = {}
          if (statusParam) where.status = statusParam as Prisma.RekberTransactionWhereInput['status']
          if (dateFilter) where.createdAt = dateFilter
          if (q) {
            where.OR = [
              { orderCode: { contains: q, mode: 'insensitive' } },
              { buyer: { name: { contains: q, mode: 'insensitive' } } },
              { seller: { name: { contains: q, mode: 'insensitive' } } },
              { description: { contains: q, mode: 'insensitive' } },
            ]
          }
          const orders = await prisma.rekberTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              buyer: { select: { id: true, name: true, email: true, role: true } },
              seller: { select: { id: true, name: true, email: true } },
            },
          })
          return orders.map((o) => ({
            id: o.id,
            type: 'rekber' as const,
            orderCode: o.orderCode,
            user: { ...o.buyer, role: o.buyer.role },
            seller: o.seller,
            title: o.description ?? 'Transaksi aman',
            amount: o.amount.toString(),
            platformRevenue: rekberPlatformRevenue(o.status, o.fee),
            status: o.status,
            normalizedStatus: normalizeStatus('rekber', o.status),
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
            meta: { fee: o.fee.toString(), note: o.note },
          }))
        },
        [] as UnifiedTransactionDto[],
      )
      results.push(...rekberItems)
    }

    // Sort all by createdAt desc
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const trimmed = results.slice(0, limit)

    // Stats
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [mktCount, imeiCount, serverCount, topupCount, rekberCount, pendingImei, pendingServer, successImei, successServer, todayImei, todayServer] = await Promise.all([
      tryPrismaQuery('stats-marketplace', () => prisma.order.count(), 0),
      tryPrismaQuery('stats-imei', () => prisma.imeiOrder.count(), 0),
      tryPrismaQuery('stats-server', () => prisma.serverOrder.count(), 0),
      tryPrismaQuery('stats-topup', () => prisma.topupOrder.count(), 0),
      tryPrismaQuery('stats-rekber', () => prisma.rekberTransaction.count(), 0),
      tryPrismaQuery('stats-imei-pending', () => prisma.imeiOrder.count({ where: { status: 'PENDING' } }), 0),
      tryPrismaQuery('stats-server-pending', () => prisma.serverOrder.count({ where: { status: 'PENDING' } }), 0),
      tryPrismaQuery('stats-imei-success', () => prisma.imeiOrder.count({ where: { status: 'SUCCESS' } }), 0),
      tryPrismaQuery('stats-server-success', () => prisma.serverOrder.count({ where: { status: 'SUCCESS' } }), 0),
      tryPrismaQuery(
        'stats-imei-today',
        () =>
          prisma.imeiOrder.aggregate({
            _sum: { price: true },
            where: { createdAt: { gte: startOfToday } },
          }),
        { _sum: { price: null } },
      ),
      tryPrismaQuery(
        'stats-server-today',
        () =>
          prisma.serverOrder.aggregate({
            _sum: { price: true },
            where: { createdAt: { gte: startOfToday } },
          }),
        { _sum: { price: null } },
      ),
    ])

    const revenueToday = (
      Number(todayImei._sum.price ?? 0) + Number(todayServer._sum.price ?? 0)
    ).toString()

    const stats: TransactionStats = {
      totalAll: mktCount + imeiCount + serverCount + topupCount + rekberCount,
      totalMarketplace: mktCount,
      totalImei: imeiCount,
      totalServer: serverCount,
      totalTopup: topupCount,
      totalRekber: rekberCount,
      pendingCount: pendingImei + pendingServer,
      successCount: successImei + successServer,
      revenueToday,
    }

    return apiSuccess({ items: trimmed, stats })
  } catch (e) {
    console.error('[ADMIN_TRANSACTIONS_GET]', e)
    return apiError('Gagal memuat data transaksi', 500)
  }
}
