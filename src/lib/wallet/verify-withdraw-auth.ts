import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifySecondFactor } from '@/lib/auth/verify-2fa'
import { verifyWithdrawEmailOtp, WithdrawOtpError } from '@/lib/wallet/withdraw-otp'

export class WithdrawAuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = 'WithdrawAuthError'
  }
}

export async function verifyWithdrawAuth(
  userId: string,
  opts: {
    emailOtp: string
    totp?: string
    confirmPassword?: string
  },
): Promise<void> {
  if (!opts.emailOtp?.trim()) {
    throw new WithdrawAuthError('Kode OTP email wajib diisi', 'EMAIL_OTP_REQUIRED')
  }

  try {
    await verifyWithdrawEmailOtp(userId, opts.emailOtp)
  } catch (e) {
    if (e instanceof WithdrawOtpError) {
      throw new WithdrawAuthError(e.message, e.code)
    }
    throw e
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, twoFactorEnabled: true, twoFactorSecret: true },
  })
  if (!user?.password) {
    throw new WithdrawAuthError('Akun tidak memiliki password lokal', 'NO_LOCAL_PASSWORD')
  }

  if (user.twoFactorEnabled) {
    if (!opts.totp?.trim()) {
      throw new WithdrawAuthError('Kode MFA (authenticator) wajib diisi', 'MFA_REQUIRED')
    }
    const ok2fa = await verifySecondFactor({
      userId,
      input: opts.totp,
      totpSecret: user.twoFactorSecret,
    })
    if (!ok2fa) {
      throw new WithdrawAuthError('Kode MFA tidak valid', 'INVALID_MFA')
    }
    return
  }

  if (!opts.confirmPassword) {
    throw new WithdrawAuthError('Password konfirmasi wajib diisi', 'PASSWORD_REQUIRED')
  }
  const ok = await compare(opts.confirmPassword, user.password)
  if (!ok) {
    throw new WithdrawAuthError('Password konfirmasi tidak valid', 'INVALID_PASSWORD')
  }
}
