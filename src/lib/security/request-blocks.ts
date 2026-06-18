import { logSecurityEvent } from '@/lib/activity-log'
import { getClientIp } from '@/lib/rate-limit-store'

type CsrfBlockContext = {
  method: string
  pathname: string
  ip?: string | null
  userAgent?: string | null
  origin?: string | null
  referer?: string | null
}

export function logCsrfBlocked(req: Request, pathname: string): void
export function logCsrfBlocked(ctx: CsrfBlockContext): void
export function logCsrfBlocked(reqOrCtx: Request | CsrfBlockContext, pathname?: string): void {
  const ctx: CsrfBlockContext =
    reqOrCtx instanceof Request
      ? {
          method: reqOrCtx.method,
          pathname: pathname ?? new URL(reqOrCtx.url).pathname,
          ip: getClientIp(reqOrCtx),
          userAgent: reqOrCtx.headers.get('user-agent'),
          origin: reqOrCtx.headers.get('origin'),
          referer: reqOrCtx.headers.get('referer'),
        }
      : reqOrCtx

  void logSecurityEvent({
    action: 'security.csrf.blocked',
    severity: 'WARNING',
    summary: `Permintaan ditolak (CSRF): ${ctx.method} ${ctx.pathname}`,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    metadata: {
      method: ctx.method,
      pathname: ctx.pathname,
      origin: ctx.origin ?? null,
      referer: ctx.referer ?? null,
    },
  })
}

export function logRateLimitBlocked(req: Request, key?: string): void {
  const ip = getClientIp(req)
  void logSecurityEvent({
    action: 'security.rate_limit.blocked',
    severity: 'WARNING',
    summary: `Rate limit: ${key ?? 'unknown'}`,
    ip,
    userAgent: req.headers.get('user-agent'),
    metadata: { key: key ?? null, path: new URL(req.url).pathname },
  })
}

export function logCronAuthFailed(req: Request, route: string): void {
  const ip = getClientIp(req)
  void logSecurityEvent({
    action: 'security.cron.auth_failed',
    severity: 'WARNING',
    summary: `Cron auth gagal: ${route}`,
    ip,
    userAgent: req.headers.get('user-agent'),
    metadata: { route },
  })
}

export function logAdminForbiddenProbe(opts: {
  pathname: string
  actorId?: string | null
  actorRole?: string | null
  requiredRoles: string[]
  ip?: string | null
  userAgent?: string | null
}): void {
  void logSecurityEvent({
    action: 'security.admin.forbidden_probe',
    severity: 'WARNING',
    summary: `Akses admin ditolak: ${opts.pathname}`,
    actor: {
      id: opts.actorId ?? null,
      role: (opts.actorRole as 'ADMIN' | 'TEKNISI' | 'USER' | null) ?? null,
    },
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
    metadata: { pathname: opts.pathname, requiredRoles: opts.requiredRoles },
  })
}
