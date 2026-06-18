import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { serializeAdminTeknisi } from '@/lib/admin-user-serializer'
import { bumpSessionVersion } from '@/lib/session-version'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  phone: z.string().max(30).nullable().optional(),
  specialty: z.string().optional(),
  experience: z.string().max(80).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  isVerified: z.boolean().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

function parseSpecialty(raw?: string): string[] | undefined {
  if (raw === undefined) return undefined
  if (!raw.trim()) return ['Service HP']
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { teknisiProfile: true },
    })
    if (!existing || existing.role !== UserRole.TEKNISI) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data

    if (data.email) {
      const email = data.email.trim().toLowerCase()
      const dup = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      })
      if (dup) return apiError('Email sudah dipakai akun lain', 409)
    }

    const passwordHash = data.password ? await hash(data.password, 12) : undefined
    const specialty = parseSpecialty(data.specialty)

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
        teknisiProfile: {
          upsert: {
            create: {
              specialty: specialty ?? ['Service HP'],
              experience: data.experience?.trim() || null,
              location: data.location?.trim() || null,
              description: data.description?.trim() || null,
              isVerified: data.isVerified ?? false,
              verificationStatus: data.isVerified ? 'APPROVED' : 'PENDING',
              price: data.price ?? 50000,
            },
            update: {
              ...(specialty !== undefined && { specialty }),
              ...(data.experience !== undefined && { experience: data.experience?.trim() || null }),
              ...(data.location !== undefined && { location: data.location?.trim() || null }),
              ...(data.description !== undefined && { description: data.description?.trim() || null }),
              ...(data.isVerified !== undefined && {
                isVerified: data.isVerified,
                verificationStatus: data.isVerified ? 'APPROVED' : 'PENDING',
                ...(data.isVerified && { rejectionReason: null }),
              }),
              ...(data.price !== undefined && { price: data.price }),
            },
          },
        },
      },
      include: { teknisiProfile: true },
    })

    if (passwordHash || data.isActive === false) {
      await bumpSessionVersion(id)
    }

    const dto = serializeAdminTeknisi(user)
    if (!dto) return apiError('Profil teknisi tidak ditemukan', 500)

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.teknisi.update',
      summary: `Admin memperbarui teknisi ${user.email}`,
      severity: data.isActive === false || passwordHash ? 'CRITICAL' : 'WARNING',
      target: { type: 'teknisi', id: user.id, label: user.email },
      metadata: {
        isActive: data.isActive,
        isVerified: data.isVerified,
        passwordReset: Boolean(passwordHash),
      },
    })

    return apiSuccess(dto)
  } catch (e) {
    console.error('[ADMIN_TEKNISI_PATCH]', e)
    return apiError('Gagal memperbarui teknisi', 500)
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
    if (!existing || existing.role !== UserRole.TEKNISI) {
      return apiError('Teknisi tidak ditemukan', 404)
    }

    await prisma.user.delete({ where: { id } })

    logAdminGovernance({
      req: _req,
      actor: session.user,
      action: 'admin.teknisi.delete',
      summary: `Admin menghapus teknisi ${existing.email}`,
      severity: 'CRITICAL',
      target: { type: 'teknisi', id: existing.id, label: existing.email },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_TEKNISI_DELETE]', e)
    return apiError('Gagal menghapus teknisi', 500)
  }
}
