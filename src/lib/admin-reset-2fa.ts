import { UserRole, type User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { extractRequestContext, logAdminEvent } from '@/lib/activity-log'

const RESETTABLE_ROLES = new Set<UserRole>([UserRole.USER, UserRole.TEKNISI])

export async function adminResetUserTwoFactor(
  targetUserId: string,
  admin: Pick<User, 'id' | 'name' | 'email' | 'role'>,
  req?: Request,
) {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  })

  if (!target || !RESETTABLE_ROLES.has(target.role)) {
    return { ok: false as const, status: 404, error: 'Akun tidak ditemukan' }
  }

  if (!target.twoFactorEnabled && !target.twoFactorSecret) {
    return { ok: false as const, status: 400, error: '2FA belum diaktifkan pada akun ini' }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  })

  const { ip, userAgent } = extractRequestContext(req)
  void logAdminEvent({
    action: 'admin.2fa.reset',
    severity: 'WARNING',
    summary: `Admin reset 2FA untuk ${target.email}`,
    detail: `Role: ${target.role}. User dapat login tanpa authenticator dan mengaktifkan 2FA baru.`,
    actor: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role as 'ADMIN',
    },
    target: { type: 'user', id: target.id, label: target.email },
    ip,
    userAgent,
    metadata: { targetRole: target.role, hadEnabled: target.twoFactorEnabled },
  })

  return {
    ok: true as const,
    data: {
      userId: target.id,
      email: target.email,
      twoFactorEnabled: false,
    },
  }
}
