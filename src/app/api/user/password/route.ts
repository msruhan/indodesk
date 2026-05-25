import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { extractRequestContext, logAccountEvent, logSecurityEvent } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

const schema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, name: true, email: true, role: true },
    })
    if (!user?.password) {
      return apiError('Akun ini tidak memiliki password lokal')
    }

    const valid = await compare(parsed.data.currentPassword, user.password)
    if (!valid) {
      const ctx = extractRequestContext(req)
      void logSecurityEvent({
        action: 'account.password.wrong_current',
        severity: 'WARNING',
        summary: `Percobaan ganti password gagal (password lama salah): ${user.email}`,
        actor: { id: session.user.id, name: user.name, email: user.email, role: user.role },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      })
      return apiError('Password lama tidak sesuai', 401)
    }

    const hashed = await hash(parsed.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
      },
    })

    const ctx = extractRequestContext(req)
    void logAccountEvent({
      action: 'account.password.changed',
      severity: 'SUCCESS',
      summary: `${user.name ?? user.email} mengganti password`,
      actor: { id: session.user.id, name: user.name, email: user.email, role: user.role },
      target: { type: 'user', id: session.user.id, label: user.email ?? undefined },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    })

    return apiSuccess({ ok: true })
  } catch (e) {
    console.error('[USER_PASSWORD_POST]', e)
    return apiError('Gagal mengubah password', 500)
  }
}
