import { createHash, randomInt } from 'node:crypto'
import { prisma } from '@/lib/db'
import { buildWithdrawOtpEmail, sendEmail } from '@/lib/email'
import { isSmtpConfigured } from '@/lib/smtp-settings'

const OTP_TTL_MS = 10 * 60 * 1000

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000))
}

export class WithdrawOtpError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = 'WithdrawOtpError'
  }
}

export async function sendWithdrawEmailOtp(
  userId: string,
  email: string,
  opts?: { amount?: number; userName?: string | null },
): Promise<{ expiresAt: string; maskedEmail: string }> {
  const smtpOk = await isSmtpConfigured()
  if (!smtpOk && process.env.NODE_ENV === 'production') {
    throw new WithdrawOtpError(
      'SMTP belum dikonfigurasi. OTP penarikan tidak dapat dikirim.',
      'SMTP_NOT_CONFIGURED',
    )
  }

  const code = generateOtpCode()
  const codeHash = hashOtp(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await prisma.$transaction([
    prisma.walletWithdrawOtp.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    }),
    prisma.walletWithdrawOtp.create({
      data: { userId, codeHash, expiresAt },
    }),
  ])

  const payload = buildWithdrawOtpEmail({
    code,
    amount: opts?.amount,
    userName: opts?.userName,
  })
  await sendEmail({ ...payload, to: email })

  return {
    expiresAt: expiresAt.toISOString(),
    maskedEmail: maskEmail(email),
  }
}

export async function verifyWithdrawEmailOtp(userId: string, codePlain: string): Promise<void> {
  const code = codePlain.replace(/\s/g, '')
  if (!/^\d{6}$/.test(code)) {
    throw new WithdrawOtpError('Kode OTP email harus 6 digit', 'INVALID_EMAIL_OTP')
  }

  const codeHash = hashOtp(code)
  const row = await prisma.walletWithdrawOtp.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!row) {
    throw new WithdrawOtpError('Kode OTP email tidak valid atau sudah kedaluwarsa', 'INVALID_EMAIL_OTP')
  }

  await prisma.walletWithdrawOtp.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  })
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`
}
