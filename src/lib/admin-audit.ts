import type { UserRole } from '@prisma/client'
import { extractRequestContext, logAdminEvent, type ActivitySeverity } from '@/lib/activity-log'

type AdminActor = {
  id: string
  name?: string | null
  email?: string | null
  role: UserRole
}

export function logAdminGovernance(opts: {
  req?: Request
  actor: AdminActor
  action: string
  summary: string
  detail?: string
  severity?: ActivitySeverity
  target?: { type: string; id?: string; label?: string }
  metadata?: Record<string, unknown>
}): void {
  const { ip, userAgent } = extractRequestContext(opts.req)
  void logAdminEvent({
    action: opts.action,
    severity: opts.severity ?? 'WARNING',
    summary: opts.summary,
    detail: opts.detail,
    actor: {
      id: opts.actor.id,
      name: opts.actor.name ?? null,
      email: opts.actor.email ?? null,
      role: opts.actor.role === 'ADMIN' ? 'ADMIN' : opts.actor.role,
    },
    target: opts.target,
    ip,
    userAgent,
    metadata: opts.metadata,
  })
}
