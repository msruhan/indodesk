import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  parseListField,
  serializeAdminLowongan,
  slugToJobType,
  type JobTypeSlug,
} from '@/lib/lowongan-serializer'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  company: z.string().min(2).max(120).optional(),
  location: z.string().min(2).max(120).optional(),
  salary: z.string().max(80).nullable().optional(),
  type: z.enum(['full-time', 'part-time', 'contract'] as const).optional(),
  description: z.string().min(10).max(10000).optional(),
  requirements: z.string().optional(),
  skills: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.lowongan.findUnique({ where: { id } })
    if (!existing) return apiError('Lowongan tidak ditemukan', 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    const row = await prisma.lowongan.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.company !== undefined && { company: data.company.trim() }),
        ...(data.location !== undefined && { location: data.location.trim() }),
        ...(data.salary !== undefined && { salary: data.salary?.trim() || null }),
        ...(data.type !== undefined && { type: slugToJobType(data.type as JobTypeSlug) }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.requirements !== undefined && {
          requirements: parseListField(data.requirements),
        }),
        ...(data.skills !== undefined && { skills: parseListField(data.skills) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    const applicants = await prisma.lowonganApplication.count({ where: { lowonganId: id } })
    return apiSuccess(serializeAdminLowongan(row, applicants))
  } catch (e) {
    console.error('[ADMIN_LOWONGAN_PATCH]', e)
    return apiError('Gagal memperbarui lowongan', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.lowongan.findUnique({ where: { id } })
    if (!existing) return apiError('Lowongan tidak ditemukan', 404)

    await prisma.lowongan.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[ADMIN_LOWONGAN_DELETE]', e)
    return apiError('Gagal menghapus lowongan', 500)
  }
}
