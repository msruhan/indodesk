/**
 * Activity Log — central audit trail.
 *
 * Pakai `recordActivity()` dari API route, server action, atau worker untuk
 * mencatat aktivitas penting. Helper ini fail-safe (return null) — gagal
 * mencatat tidak boleh menggagalkan aksi utama, jadi kita selalu
 * console.error tanpa throw.
 *
 * Untuk kemudahan instrumentasi, sediakan helper convenient:
 *   - logAuthEvent
 *   - logAccountEvent
 *   - logOrderEvent
 *   - logPaymentEvent
 *   - logCommunicationEvent
 *   - logAdminEvent
 *   - logSecurityEvent
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { buildActivityLogChronology } from '@/lib/activity-log-narrative'

export type ActivityCategory =
  | 'AUTH'
  | 'ACCOUNT'
  | 'ORDER'
  | 'PAYMENT'
  | 'COMMUNICATION'
  | 'ADMIN'
  | 'SECURITY'
  | 'SYSTEM'

export type ActivitySeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

export type ActivityActor = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: 'ADMIN' | 'TEKNISI' | 'USER' | null
}

export type ActivityTarget = {
  type: string
  id?: string | null
  label?: string | null
}

export type RecordActivityInput = {
  action: string
  category: ActivityCategory
  severity?: ActivitySeverity
  summary: string
  detail?: string | null
  actor?: ActivityActor | null
  target?: ActivityTarget | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}

/** Inti pencatat. Dipanggil oleh helper-helper dibawah. */
export async function recordActivity(input: RecordActivityInput): Promise<{ id: string } | null> {
  try {
    const created = await prisma.activityLog.create({
      data: {
        action: input.action,
        category: input.category,
        severity: input.severity ?? 'INFO',
        summary: input.summary,
        detail: input.detail ?? null,
        actorId: input.actor?.id?.trim() || null,
        actorName: input.actor?.name ?? null,
        actorEmail: input.actor?.email ?? null,
        actorRole: input.actor?.role ?? null,
        targetType: input.target?.type ?? null,
        targetId: input.target?.id ?? null,
        targetLabel: input.target?.label ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
      select: { id: true },
    })
    return created
  } catch (e) {
    // If actorId FK fails (user deleted), retry without actorId
    if (e instanceof Error && e.message.includes('Foreign key constraint')) {
      try {
        const created = await prisma.activityLog.create({
          data: {
            action: input.action,
            category: input.category,
            severity: input.severity ?? 'INFO',
            summary: input.summary,
            detail: input.detail ?? null,
            actorId: null,
            actorName: input.actor?.name ?? null,
            actorEmail: input.actor?.email ?? null,
            actorRole: input.actor?.role ?? null,
            targetType: input.target?.type ?? null,
            targetId: input.target?.id ?? null,
            targetLabel: input.target?.label ?? null,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
            metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
          },
          select: { id: true },
        })
        return created
      } catch (retryErr) {
        console.error('[ACTIVITY_LOG_RECORD_RETRY]', retryErr)
        return null
      }
    }
    console.error('[ACTIVITY_LOG_RECORD]', e, input)
    return null
  }
}

/** Ekstrak IP & user-agent dari Request standar Next.js. */
export function extractRequestContext(req?: Request | null) {
  if (!req) return { ip: null, userAgent: null }
  const headers = req.headers
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || null
  const userAgent = headers.get('user-agent') || null
  return { ip, userAgent }
}

/* -------------------------------------------------------------------------- */
/* Convenience helpers                                                         */
/* -------------------------------------------------------------------------- */

export const logAuthEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'AUTH' })

export const logAccountEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'ACCOUNT' })

export const logOrderEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'ORDER' })

export const logPaymentEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'PAYMENT' })

export const logCommunicationEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'COMMUNICATION' })

export const logAdminEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'ADMIN' })

export const logSecurityEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'SECURITY' })

export const logSystemEvent = (input: Omit<RecordActivityInput, 'category'>) =>
  recordActivity({ ...input, category: 'SYSTEM' })

/* -------------------------------------------------------------------------- */
/* Suspicious-attempt detection                                                */
/* -------------------------------------------------------------------------- */

/**
 * Hitung jumlah failed login attempt yang sama (email atau IP) dalam window menit.
 * Jika ≥ threshold, log sebagai SECURITY/CRITICAL.
 */
export async function evaluateLoginFailure(opts: {
  email: string
  ip: string | null
  userAgent: string | null
  windowMinutes?: number
  thresholdWarning?: number
  thresholdCritical?: number
}) {
  const window = opts.windowMinutes ?? 15
  const warn = opts.thresholdWarning ?? 3
  const crit = opts.thresholdCritical ?? 5
  const since = new Date(Date.now() - window * 60_000)

  // Catat percobaan gagal saat ini
  await logSecurityEvent({
    action: 'auth.login.failed',
    severity: 'WARNING',
    summary: `Percobaan login gagal untuk ${opts.email}`,
    actor: { email: opts.email, name: null, id: null, role: null },
    ip: opts.ip,
    userAgent: opts.userAgent,
    metadata: { email: opts.email },
  })

  try {
    const recentByEmail = await prisma.activityLog.count({
      where: {
        action: 'auth.login.failed',
        actorEmail: opts.email,
        createdAt: { gte: since },
      },
    })

    const recentByIp = opts.ip
      ? await prisma.activityLog.count({
          where: {
            action: 'auth.login.failed',
            ip: opts.ip,
            createdAt: { gte: since },
          },
        })
      : 0

    const high = Math.max(recentByEmail, recentByIp)

    if (high >= crit) {
      const bruteMeta = { email: opts.email, attempts: high, windowMinutes: window }
      await logSecurityEvent({
        action: 'auth.suspicious.brute_force',
        severity: 'CRITICAL',
        summary: `Aktivitas mencurigakan: ${high} percobaan login gagal dari ${opts.email}`,
        detail:
          `Threshold ${crit} percobaan dalam ${window} menit terlampaui.\n` +
          `Email: ${opts.email}\nIP: ${opts.ip ?? 'unknown'}\nUser-Agent: ${opts.userAgent ?? 'unknown'}`,
        actor: { email: opts.email, name: null, id: null, role: null },
        ip: opts.ip,
        userAgent: opts.userAgent,
        metadata: {
          ...bruteMeta,
          chronology: buildActivityLogChronology({
            action: 'auth.suspicious.brute_force',
            category: 'SECURITY',
            severity: 'CRITICAL',
            summary: `Aktivitas mencurigakan: ${high} percobaan login gagal dari ${opts.email}`,
            actorEmail: opts.email,
            ip: opts.ip,
            metadata: bruteMeta,
            createdAt: new Date().toISOString(),
          }),
        },
      })
      const { notifyAdminsSecurityEvent } = await import('@/lib/security-notifications')
      void notifyAdminsSecurityEvent({
        title: 'Brute-force login terdeteksi',
        body: `${high} percobaan gagal untuk ${opts.email} dalam ${window} menit. Periksa Log Keamanan.`,
        severity: 'CRITICAL',
      })
    } else if (high >= warn) {
      const repeatMeta = { email: opts.email, attempts: high, windowMinutes: window }
      await logSecurityEvent({
        action: 'auth.suspicious.repeated_failed',
        severity: 'WARNING',
        summary: `Beberapa percobaan login gagal untuk ${opts.email}`,
        detail: `Total ${high} percobaan gagal dalam ${window} menit terakhir.`,
        actor: { email: opts.email, name: null, id: null, role: null },
        ip: opts.ip,
        userAgent: opts.userAgent,
        metadata: {
          ...repeatMeta,
          chronology: buildActivityLogChronology({
            action: 'auth.suspicious.repeated_failed',
            category: 'SECURITY',
            severity: 'WARNING',
            summary: `Beberapa percobaan login gagal untuk ${opts.email}`,
            actorEmail: opts.email,
            ip: opts.ip,
            metadata: repeatMeta,
            createdAt: new Date().toISOString(),
          }),
        },
      })
    }
  } catch (e) {
    console.error('[ACTIVITY_LOG_BRUTEFORCE_CHECK]', e)
  }
}
