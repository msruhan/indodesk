import { NextResponse } from 'next/server'
import { isStressTestMode } from '@/lib/stress-mode'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/_internal/db-stats
 *
 * Return PostgreSQL connection stats. Aktif hanya saat STRESS_TEST_MODE=true.
 */
export async function GET() {
  if (!isStressTestMode()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const result = await prisma.$queryRaw<Array<{ state: string | null; count: bigint }>>`
      SELECT state, count(*)::bigint AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
      ORDER BY count DESC
    `

    const byState = result.map((r) => ({
      state: r.state ?? 'idle-no-state',
      count: Number(r.count),
    }))
    const total = byState.reduce((sum, s) => sum + s.count, 0)

    return NextResponse.json({
      total,
      byState,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
