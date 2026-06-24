import { prisma } from '@/lib/db'
import { logAccountEvent } from '@/lib/activity-log'
import {
  setTeknisiRegisterCompleteCookie,
  type GoogleRegisterRole,
} from '@/lib/auth/google-register-cookie'
import { notifyAdminUserRegistered } from '@/lib/telegram/notify'
import { notifyRegistrationWelcomeEmail } from '@/lib/registration-welcome-notify'

export type GoogleRegisterEligibility =
  | { eligible: true }
  | { eligible: false; error: 'email_already_registered' }

/** Apakah email boleh dipakai untuk pendaftaran Google baru. */
export async function isEligibleForGoogleRegister(email: string): Promise<GoogleRegisterEligibility> {
  const normalized = email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  })
  if (existing) {
    return { eligible: false, error: 'email_already_registered' }
  }
  return { eligible: true }
}

type GoogleRegistrationProfile = {
  name?: string | null
  email?: string | null
  image?: string | null
}

/** Terapkan role & verifikasi setelah PrismaAdapter membuat user OAuth. */
export async function finalizeGoogleRegistration(
  userId: string,
  role: GoogleRegisterRole,
  profile: GoogleRegistrationProfile,
): Promise<void> {
  const now = new Date()
  const name = profile.name?.trim()
  const image = profile.image?.trim()

  if (role === 'TEKNISI') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'TEKNISI',
        isActive: false,
        emailVerified: now,
        ...(name ? { name } : {}),
        ...(image ? { image } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    })

    await setTeknisiRegisterCompleteCookie(userId)

    void logAccountEvent({
      action: 'account.register',
      severity: 'SUCCESS',
      summary: `Pendaftaran teknisi via Google (lengkapi profil): ${user.name}`,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      target: { type: 'user', id: user.id, label: user.email },
      metadata: { role: user.role, provider: 'google', step: 'oauth_created' },
    })
    return
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'USER',
      isActive: true,
      emailVerified: now,
      ...(name ? { name } : {}),
      ...(image ? { image } : {}),
    },
    select: { id: true, name: true, email: true, role: true },
  })

  void logAccountEvent({
    action: 'account.register',
    severity: 'SUCCESS',
    summary: `Akun user baru via Google: ${user.name}`,
    actor: { id: user.id, name: user.name, email: user.email, role: user.role },
    target: { type: 'user', id: user.id, label: user.email },
    metadata: { role: user.role, provider: 'google' },
  })

  void notifyRegistrationWelcomeEmail({
    email: user.email,
    name: user.name,
    role: 'USER',
    emailAlreadyVerified: true,
  }).catch((e) => {
    console.error('[GOOGLE_REGISTER_WELCOME_EMAIL]', e)
  })

  void notifyAdminUserRegistered(user.id).catch((e) => {
    console.error('[GOOGLE_REGISTER_ADMIN_TELEGRAM]', e)
  })
}
