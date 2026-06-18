import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-auth'
import type { NextResponse } from 'next/server'

/**
 * Gate wallet/checkout flows that require a verified email (R1).
 */
export async function requireEmailVerifiedUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: NextResponse }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  })
  if (!user?.emailVerified) {
    return {
      ok: false,
      error: apiError(
        'Verifikasi email diperlukan sebelum melanjutkan. Periksa inbox Anda atau hubungi dukungan.',
        403,
        { code: 'EMAIL_NOT_VERIFIED' },
      ),
    }
  }
  return { ok: true }
}
