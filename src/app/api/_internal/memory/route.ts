import { NextResponse } from 'next/server'
import { isStressTestMode } from '@/lib/stress-mode'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/_internal/memory
 *
 * Return Node.js memory usage. Aktif hanya saat STRESS_TEST_MODE=true.
 * Production safety: return 404 jika flag off.
 */
export async function GET() {
  if (!isStressTestMode()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const m = process.memoryUsage()
  return NextResponse.json({
    rssMB: Math.round((m.rss / 1024 / 1024) * 100) / 100,
    heapUsedMB: Math.round((m.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotalMB: Math.round((m.heapTotal / 1024 / 1024) * 100) / 100,
    externalMB: Math.round((m.external / 1024 / 1024) * 100) / 100,
    arrayBuffersMB: Math.round((m.arrayBuffers / 1024 / 1024) * 100) / 100,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: Math.round(process.uptime()),
  })
}
