import { createHash, randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { buildPasswordResetEmail, sendEmail } from '@/lib/email'
import { clearLockout } from '@/lib/lockout'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { bumpSessionVersion } from '@/lib/session-version'

const TOKEN_TTL_MS = 30 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Always completes without throwing (anti-enumeration).
 * Sends email only when user exists and has a password (not OAuth-only).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, password: true },
  })
  if (!user?.password) return

  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const resetUrl = `${baseUrl}/login?resetToken=${token}`
  const payload = buildPasswordResetEmail(resetUrl)
  await sendEmail({ ...payload, to: user.email })
}

export async function confirmPasswordReset(
  tokenPlain: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
  const policy = validatePasswordPolicy(newPassword)
  if (!policy.ok) {
    return { ok: false, message: policy.message, code: 'PASSWORD_POLICY' }
  }

  const tokenHash = hashToken(tokenPlain.trim())
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true } } },
  })

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, message: 'Token reset tidak valid atau sudah kedaluwarsa', code: 'INVALID_TOKEN' }
  }

  const hashedPassword = await hash(newPassword, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ])

  await clearLockout(row.user.email)
  await bumpSessionVersion(row.userId)
  return { ok: true }
}
