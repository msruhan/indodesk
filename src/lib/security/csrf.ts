import { NextResponse } from 'next/server'
import { getAllowedOrigins, originMatchesAllowlist } from '@/lib/security/origins'

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Paths exempt from Origin check (webhooks, cron, stress tooling). */
const EXEMPT_PREFIXES = [
  '/api/telegram/webhook',
  '/api/cron/',
  '/api/stress-internal/',
  '/api/payments/',
]

export function isCsrfExemptPath(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
}

export function validateOriginRefererParts(
  method: string,
  pathname: string,
  origin: string | null,
  referer: string | null,
): { ok: true } | { ok: false; code: 'CSRF_BLOCKED' } {
  const verb = method.toUpperCase()
  if (!STATE_CHANGING.has(verb)) return { ok: true }
  if (!pathname.startsWith('/api/')) return { ok: true }
  if (isCsrfExemptPath(pathname)) return { ok: true }

  const allowlist = getAllowedOrigins()
  if (originMatchesAllowlist(origin, allowlist) || originMatchesAllowlist(referer, allowlist)) {
    return { ok: true }
  }

  return { ok: false, code: 'CSRF_BLOCKED' }
}

export function validateOriginReferer(req: Request): { ok: true } | { ok: false } {
  const url = new URL(req.url)
  const result = validateOriginRefererParts(
    req.method,
    url.pathname,
    req.headers.get('origin'),
    req.headers.get('referer'),
  )
  return result.ok ? { ok: true } : { ok: false }
}

/** Defense-in-depth for API route handlers (reads middleware-forwarded headers). */
export async function assertOriginAllowed(): Promise<NextResponse | null> {
  const { headers } = await import('next/headers')
  const h = await headers()
  const method = h.get('x-request-method') ?? 'GET'
  const pathname = h.get('x-request-pathname') ?? ''
  const result = validateOriginRefererParts(
    method,
    pathname,
    h.get('origin'),
    h.get('referer'),
  )
  if (result.ok) return null
  const { logCsrfBlocked } = await import('@/lib/security/request-blocks')
  logCsrfBlocked({
    method,
    pathname,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip'),
    userAgent: h.get('user-agent'),
    origin: h.get('origin'),
    referer: h.get('referer'),
  })
  return NextResponse.json(
    { success: false, error: 'Permintaan ditolak (CSRF).', code: result.code },
    { status: 403 },
  )
}
