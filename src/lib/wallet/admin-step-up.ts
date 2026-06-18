import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifySecondFactor } from '@/lib/auth/verify-2fa'

export class StepUpAuthError extends Error {
  constructor(
    message: string,
    readonly code = 'STEP_UP_REQUIRED',
  ) {
    super(message)
    this.name = 'StepUpAuthError'
  }
}

export async function verifyAdminStepUp(
  adminId: string,
  opts: { confirmPassword?: string; totp?: string },
): Promise<void> {
  const { confirmPassword, totp } = opts
  if (!confirmPassword && !totp) {
    throw new StepUpAuthError('Konfirmasi password atau kode 2FA wajib diisi')
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { password: true, twoFactorEnabled: true, twoFactorSecret: true, role: true },
  })
  if (!user || user.role !== 'ADMIN') {
    throw new StepUpAuthError('Akses ditolak', 'FORBIDDEN')
  }
  if (!user.password) {
    throw new StepUpAuthError('Akun admin tidak memiliki password lokal')
  }

  if (user.twoFactorEnabled) {
    if (!totp) {
      throw new StepUpAuthError('Kode 2FA wajib untuk aksi sensitif admin', 'STEP_UP_2FA_REQUIRED')
    }
    const ok2fa = await verifySecondFactor({
      userId: adminId,
      input: totp,
      totpSecret: user.twoFactorSecret,
    })
    if (!ok2fa) throw new StepUpAuthError('Kode 2FA tidak valid', 'INVALID_2FA')
    return
  }

  if (!confirmPassword) {
    throw new StepUpAuthError('Konfirmasi password wajib diisi')
  }
  const ok = await compare(confirmPassword, user.password)
  if (!ok) throw new StepUpAuthError('Password konfirmasi tidak valid', 'INVALID_PASSWORD')
}
