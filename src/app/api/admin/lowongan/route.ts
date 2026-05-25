import { z } from 'zod'
import { JobType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  parseListField,
  serializeAdminLowongan,
  slugToJobType,
  type JobTypeSlug,
} from '@/lib/lowongan-serializer'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(3).max(200),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  salary: z.string().max(80).optional(),
  type: z.enum(['full-time', 'part-time', 'contract'] as const),
  description: z.string().min(10).max(10000),
  requirements: z.string().optional(),
  skills: z.string().optional(),
  isActive: z.boolean().optional(),
})

async function withApplicantCounts(ids: string[]) {
  if (ids.length === 0) return new Map<string, number>()
  const grouped = await prisma.lowonganApplication.groupBy({
    by: ['lowonganId'],
    where: { lowonganId: { in: ids } },
    _count: { _all: true },
  })
  return new Map(grouped.map((g) => [g.lowonganId, g._count._all]))
}

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.lowongan.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const counts = await withApplicantCounts(rows.map((r) => r.id))
    return apiSuccess(
      rows.map((r) => serializeAdminLowongan(r, counts.get(r.id) ?? 0)),
    )
  } catch (e) {
    console.error('[ADMIN_LOWONGAN_GET]', e)
    return apiError('Gagal memuat lowongan', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const data = parsed.data
    const row = await prisma.lowongan.create({
      data: {
        posterId: session.user.id,
        title: data.title.trim(),
        company: data.company.trim(),
        location: data.location.trim(),
        salary: data.salary?.trim() || null,
        type: slugToJobType(data.type as JobTypeSlug),
        description: data.description.trim(),
        requirements: parseListField(data.requirements ?? ''),
        skills: parseListField(data.skills ?? ''),
        isActive: data.isActive ?? true,
      },
    })

    return apiSuccess(serializeAdminLowongan(row, 0), 201)
  } catch (e) {
    console.error('[ADMIN_LOWONGAN_POST]', e)
    return apiError('Gagal menambah lowongan', 500)
  }
}
