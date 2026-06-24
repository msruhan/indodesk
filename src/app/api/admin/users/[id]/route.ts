import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { serializeAdminUser } from '@/lib/admin-user-serializer'
import { bumpSessionVersion } from '@/lib/session-version'
import { applyAdminRoleSwitch } from '@/lib/admin-role-switch'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  phone: z.string().max(30).nullable().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'TEKNISI']).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing || existing.role !== UserRole.USER) {
      return apiError('User tidak ditemukan', 404)
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data

    if (data.role && id === session.user.id) {
      return apiError('Tidak dapat mengubah role akun Anda sendiri', 400)
    }

    if (data.email) {
      const email = data.email.trim().toLowerCase()
      const dup = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      })
      if (dup) return apiError('Email sudah dipakai akun lain', 409)
    }

    const passwordHash = data.password ? await hash(data.password, 12) : undefined

    const roleChanged = await applyAdminRoleSwitch(id, existing.role, data.role, {
      name: data.name?.trim() ?? existing.name,
      isVerified: false,
    })

    if (roleChanged && data.role === UserRole.TEKNISI) {
      await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
          ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(passwordHash && {
            password: passwordHash,
            passwordChangedAt: new Date(),
          }),
        },
      })
      await bumpSessionVersion(id)
      const teknisi = await prisma.user.findUnique({
        where: { id },
        include: { teknisiProfile: true },
      })
      if (!teknisi?.teknisiProfile) {
        return apiError('Gagal membuat profil teknisi', 500)
      }

      logAdminGovernance({
        req,
        actor: session.user,
        action: 'admin.user.role_change',
        summary: `Admin mengubah ${existing.email} menjadi teknisi`,
        severity: 'CRITICAL',
        target: { type: 'user', id, label: existing.email },
        metadata: { from: existing.role, to: UserRole.TEKNISI },
      })

      return apiSuccess({
        roleChanged: true,
        newRole: UserRole.TEKNISI,
        message: 'Akun dipindahkan ke daftar Teknisi.',
      })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(passwordHash && {
          password: passwordHash,
          passwordChangedAt: new Date(),
        }),
      },
      include: { _count: { select: { ordersAsBuyer: true } } },
    })

    if (passwordHash || data.isActive === false || roleChanged) {
      await bumpSessionVersion(id)
    }

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.user.update',
      summary: `Admin memperbarui user ${user.email}`,
      severity: data.isActive === false || passwordHash ? 'CRITICAL' : 'WARNING',
      target: { type: 'user', id: user.id, label: user.email },
      metadata: {
        isActive: data.isActive,
        passwordReset: Boolean(passwordHash),
        emailChanged: data.email !== undefined,
      },
    })

    return apiSuccess(serializeAdminUser(user))
  } catch (e) {
    console.error('[ADMIN_USERS_PATCH]', e)
    return apiError('Gagal memperbarui user', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  if (id === session.user.id) {
    return apiError('Tidak dapat menghapus akun Anda sendiri', 400)
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing || existing.role !== UserRole.USER) {
      return apiError('User tidak ditemukan', 404)
    }

    await prisma.user.delete({ where: { id } })

    logAdminGovernance({
      req: _req,
      actor: session.user,
      action: 'admin.user.delete',
      summary: `Admin menghapus user ${existing.email}`,
      severity: 'CRITICAL',
      target: { type: 'user', id: existing.id, label: existing.email },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_USERS_DELETE]', e)
    return apiError('Gagal menghapus user', 500)
  }
}
