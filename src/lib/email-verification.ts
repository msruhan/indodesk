import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'
import { sendEmail, buildEmailVerificationEmail } from '@/lib/email'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function sendEmailVerification(userId: string, email: string): Promise<void> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)

  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  })

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`

  const payload = buildEmailVerificationEmail(verifyUrl)

  await sendEmail({
    ...payload,
    to: email,
  })
}

export async function confirmEmailVerification(
  tokenPlain: string,
): Promise<
  | { ok: true; userId: string; role: 'ADMIN' | 'TEKNISI' | 'USER' }
  | { ok: false; message: string }
> {
  const tokenHash = hashToken(tokenPlain.trim())
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  })

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, message: 'Token verifikasi tidak valid atau kedaluwarsa' }
  }

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { role: true },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        emailVerified: new Date(),
        ...(user?.role === 'USER' ? { isActive: true } : {}),
      },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { ok: true, userId: row.userId, role: user?.role ?? 'USER' }
}
