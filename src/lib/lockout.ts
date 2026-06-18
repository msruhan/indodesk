import { prisma } from '@/lib/db'
import { evaluateLoginFailure } from '@/lib/activity-log'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
/** Lock durations per escalation: 15m → 1h → 24h */
const LOCK_DURATIONS_MS = [15 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000] as const

type FailureEntry = {
  count: number
  windowStart: number
  lockLevel: number
}

const failureStore = new Map<string, FailureEntry>()

export class AccountLockedError extends Error {
  readonly code = 'ACCOUNT_LOCKED'
  readonly lockedUntil: Date

  constructor(lockedUntil: Date) {
    super('Akun terkunci sementara karena terlalu banyak percobaan login gagal')
    this.name = 'AccountLockedError'
    this.lockedUntil = lockedUntil
  }
}

export function isAccountLockedError(err: unknown): err is AccountLockedError {
  return err instanceof AccountLockedError
}

export async function checkLockout(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { lockedUntil: true },
  })
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw new AccountLockedError(user.lockedUntil)
  }
}

export async function recordLoginFailure(opts: {
  email: string
  ip: string | null
  userAgent: string | null
}): Promise<Date | null> {
  return recordAuthFailure(opts)
}

/** Failed 2FA after password was already validated — counts toward lockout. */
export async function recordSecondFactorFailure(opts: {
  email: string
  ip?: string | null
  userAgent?: string | null
}): Promise<Date | null> {
  return recordAuthFailure({
    email: opts.email,
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
    failureAction: 'auth.2fa.failed',
  })
}

async function recordAuthFailure(opts: {
  email: string
  ip: string | null
  userAgent: string | null
  failureAction?: 'auth.login.failed' | 'auth.2fa.failed'
}): Promise<Date | null> {
  const normalized = opts.email.toLowerCase().trim()
  const failureAction = opts.failureAction ?? 'auth.login.failed'

  if (failureAction === 'auth.login.failed') {
    await evaluateLoginFailure({
      email: normalized,
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  } else {
    const { logSecurityEvent } = await import('@/lib/activity-log')
    await logSecurityEvent({
      action: 'auth.2fa.failed',
      severity: 'WARNING',
      summary: `Percobaan 2FA gagal untuk ${normalized}`,
      actor: { email: normalized, name: null, id: null, role: null },
      ip: opts.ip,
      userAgent: opts.userAgent,
      metadata: { email: normalized },
    })
  }

  const now = Date.now()
  let entry = failureStore.get(normalized)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now, lockLevel: entry?.lockLevel ?? 0 }
  }
  entry.count += 1
  failureStore.set(normalized, entry)

  if (entry.count < MAX_ATTEMPTS) return null

  const duration = LOCK_DURATIONS_MS[Math.min(entry.lockLevel, LOCK_DURATIONS_MS.length - 1)]
  const lockedUntil = new Date(now + duration)
  entry.lockLevel += 1
  entry.count = 0
  entry.windowStart = now

  await prisma.user.updateMany({
    where: { email: normalized },
    data: { lockedUntil },
  })

  const { logSecurityEvent } = await import('@/lib/activity-log')
  void logSecurityEvent({
    action: 'auth.account.locked',
    severity: 'CRITICAL',
    summary: `Akun terkunci: ${normalized}`,
    detail: `Terlalu banyak percobaan gagal. Terkunci sampai ${lockedUntil.toISOString()}.`,
    actor: { email: normalized, name: null, id: null, role: null },
    ip: opts.ip,
    userAgent: opts.userAgent,
    metadata: { lockedUntil: lockedUntil.toISOString(), failureAction },
  })

  const { notifyAdminsSecurityEvent } = await import('@/lib/security-notifications')
  void notifyAdminsSecurityEvent({
    title: 'Akun terkunci — terlalu banyak percobaan gagal',
    body: `${normalized} terkunci sampai ${lockedUntil.toLocaleString('id-ID')}.`,
    severity: 'CRITICAL',
  })

  return lockedUntil
}

export async function clearLockout(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim()
  failureStore.delete(normalized)
  await prisma.user.updateMany({
    where: { email: normalized },
    data: { lockedUntil: null },
  })
}
