import type { Account, User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAuthEvent } from '@/lib/activity-log'
import { checkTeknisiLoginGuard } from '@/lib/teknisi-login-guard'
import { readGoogleLinkIntentUserId } from '@/lib/auth/google-link-cookie'
import {
  readGoogleRegisterIntent,
  setTeknisiRegisterCompleteCookie,
  type GoogleRegisterRole,
} from '@/lib/auth/google-register-cookie'
import { isComingSoonEnabled } from '@/lib/coming-soon-server'
import {
  isTeknisiRegistrationOpen,
  isUserRegistrationOpen,
} from '@/lib/registration-control-server'

type DbUserPick = Pick<User, 'id' | 'isActive' | 'role' | 'twoFactorEnabled' | 'email'>

export type GoogleSignInInput = {
  userId?: string | null
  email?: string | null
  providerAccountId?: string | null
  linkIntentUserId?: string | null
}

export type GoogleSignInResult =
  | { ok: true; mode: 'login' | 'link' | 'register'; role?: GoogleRegisterRole }
  | { ok: false; error: string }

async function resolveDbUser(userId?: string | null, email?: string | null): Promise<DbUserPick | null> {
  if (userId) {
    const byId = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true, twoFactorEnabled: true, email: true },
    })
    if (byId) return byId
  }

  const normalized = email?.toLowerCase().trim()
  if (!normalized) return null

  return prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, isActive: true, role: true, twoFactorEnabled: true, email: true },
  })
}

async function findGoogleAccount(userId: string): Promise<Account | null> {
  return prisma.account.findFirst({
    where: { userId, provider: 'google' },
  })
}

function deny(error: string): GoogleSignInResult {
  return { ok: false, error }
}

async function runLoginGuards(dbUser: DbUserPick): Promise<GoogleSignInResult> {
  const base = await runBaseGuards(dbUser)
  if (!base.ok) return base

  const guard = await checkTeknisiLoginGuard(dbUser.id, dbUser.role)
  if (!guard.allowed) {
    if (guard.code === 'NO_PROFILE') {
      await setTeknisiRegisterCompleteCookie(dbUser.id)
      return deny('teknisi_profile_incomplete')
    }
    return deny('teknisi_blocked')
  }

  return { ok: true, mode: 'login' }
}

async function runBaseGuards(
  dbUser: DbUserPick,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!dbUser.isActive) return deny('account_inactive')
  if (dbUser.role === 'ADMIN') return deny('admin_google')

  if (dbUser.twoFactorEnabled) {
    void logAuthEvent({
      action: 'auth.oauth.blocked_2fa',
      severity: 'WARNING',
      summary: `Login Google ditolak — 2FA aktif untuk ${dbUser.email}`,
      actor: { id: dbUser.id, name: null, email: dbUser.email, role: dbUser.role },
      metadata: { provider: 'google' },
    })
    return deny('oauth_2fa')
  }

  return { ok: true }
}

/**
 * Kebijakan Google OAuth: register (intent cookie), link profil, atau login.
 */
export async function evaluateGoogleSignIn(input: GoogleSignInInput): Promise<GoogleSignInResult> {
  const email = input.email?.toLowerCase().trim()
  if (!email) return deny('google_email_missing')

  const registerRole = await readGoogleRegisterIntent()
  const linkIntentUserId = input.linkIntentUserId ?? (await readGoogleLinkIntentUserId())
  const dbUser = await resolveDbUser(input.userId, email)

  if (registerRole && !linkIntentUserId) {
    if (dbUser) {
      return deny('email_already_registered')
    }
    if (registerRole === 'USER' && !(await isUserRegistrationOpen())) {
      return deny('user_registration_closed')
    }
    if (registerRole === 'TEKNISI' && !(await isTeknisiRegistrationOpen())) {
      return deny('teknisi_registration_closed')
    }
    return { ok: true, mode: 'register', role: registerRole }
  }

  if (!dbUser) return deny('not_registered')

  if ((await isComingSoonEnabled()) && dbUser.role !== 'ADMIN') {
    return deny('coming_soon_admin_only')
  }

  const googleAccount = await findGoogleAccount(dbUser.id)

  if (linkIntentUserId) {
    if (linkIntentUserId !== dbUser.id) return deny('google_link_mismatch')
    if (email !== dbUser.email.toLowerCase()) return deny('google_email_mismatch')
    if (googleAccount) return deny('google_already_linked')
    const base = await runBaseGuards(dbUser)
    if (!base.ok) return base
    return { ok: true, mode: 'link' }
  }

  if (!googleAccount) return deny('google_not_linked')

  if (input.providerAccountId && googleAccount.providerAccountId !== input.providerAccountId) {
    return deny('google_not_linked')
  }

  return runLoginGuards(dbUser)
}
