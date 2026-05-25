/**
 * GET /api/admin/logs
 *
 * Query params:
 *   - category: ActivityCategory (filter)
 *   - severity: ActivitySeverity (filter)
 *   - q: string (search actor name/email/summary)
 *   - from: ISO date
 *   - to: ISO date
 *   - page: number (default 1)
 *   - pageSize: number (default 20, allowed: 10 | 20 | 50)
 *   - limit: legacy alias for pageSize
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { buildPaginationMeta, parsePaginationParams } from '@/lib/pagination'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = [
  'AUTH', 'ACCOUNT', 'ORDER', 'PAYMENT', 'COMMUNICATION', 'ADMIN', 'SECURITY', 'SYSTEM',
] as const

const VALID_SEVERITIES = ['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'] as const

export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const url = new URL(req.url)
  const category = url.searchParams.get('category')?.toUpperCase()
  const severity = url.searchParams.get('severity')?.toUpperCase()
  const q = url.searchParams.get('q')?.trim()
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const { page, pageSize, skip } = parsePaginationParams(url.searchParams)

  const where: Prisma.ActivityLogWhereInput = {}

  if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as Prisma.ActivityLogWhereInput['category']
  }
  if (severity && (VALID_SEVERITIES as readonly string[]).includes(severity)) {
    where.severity = severity as Prisma.ActivityLogWhereInput['severity']
  }
  if (q) {
    where.OR = [
      { actorName: { contains: q, mode: 'insensitive' } },
      { actorEmail: { contains: q, mode: 'insensitive' } },
      { summary: { contains: q, mode: 'insensitive' } },
      { action: { contains: q, mode: 'insensitive' } },
      { targetLabel: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    const range: Prisma.DateTimeFilter = {}
    if (from) range.gte = new Date(from)
    if (to) range.lt = new Date(to)
    where.createdAt = range
  }

  try {
    const startOf24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const startOf7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [items, total, warnings24h, criticals24h, totalToday, totalWeek] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.activityLog.count({ where }),
      prisma.activityLog.count({ where: { severity: 'WARNING', createdAt: { gte: startOf24h } } }),
      prisma.activityLog.count({ where: { severity: 'CRITICAL', createdAt: { gte: startOf24h } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: startOf24h } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: startOf7d } } }),
    ])

    const stats = {
      total,
      totalToday,
      totalWeek,
      warnings24h,
      criticals24h,
    }

    const serialized = items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }))

    return apiSuccess({
      items: serialized,
      stats,
      pagination: buildPaginationMeta(total, page, pageSize),
    })
  } catch (e) {
    console.error('[ADMIN_LOGS_GET]', e)
    return apiError('Gagal memuat log aktivitas', 500)
  }
}
