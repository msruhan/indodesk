import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeTeknisiCertification } from '@/lib/teknisi-certification'

export const dynamic = 'force-dynamic'

const certificationSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(280).optional().nullable(),
  year: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  fileUrl: z.string().min(1).max(2048),
  fileType: z.enum(['image', 'pdf']),
})

export async function GET() {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const rows = await prisma.teknisiCertification.findMany({
      where: { teknisiId: session.user.id },
      orderBy: { sortOrder: 'asc' },
    })
    return apiSuccess(rows.map(serializeTeknisiCertification))
  } catch (e) {
    console.error('[TEKNISI_CERTIFICATIONS_GET]', e)
    return apiError('Gagal memuat sertifikasi', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = certificationSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const count = await prisma.teknisiCertification.count({
      where: { teknisiId: session.user.id },
    })
    if (count >= 12) return apiError('Maksimal 12 sertifikasi')

    const row = await prisma.teknisiCertification.create({
      data: {
        teknisiId: session.user.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        year: parsed.data.year ?? null,
        fileUrl: parsed.data.fileUrl.trim(),
        fileType: parsed.data.fileType,
        sortOrder: count,
      },
    })

    return apiSuccess(serializeTeknisiCertification(row), 201)
  } catch (e) {
    console.error('[TEKNISI_CERTIFICATIONS_POST]', e)
    return apiError('Gagal menambah sertifikasi', 500)
  }
}
