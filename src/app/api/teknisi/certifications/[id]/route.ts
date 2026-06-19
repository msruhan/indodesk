import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { deleteCertificationFile } from '@/lib/certification-file-server'
import { serializeTeknisiCertification } from '@/lib/teknisi-certification'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  fileUrl: z.string().min(1).max(2048).optional(),
  fileType: z.enum(['image', 'pdf']).optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.teknisiCertification.findFirst({
      where: { id, teknisiId: session.user.id },
    })
    if (!existing) return apiError('Sertifikasi tidak ditemukan', 404)

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    if (
      parsed.data.fileUrl !== undefined &&
      parsed.data.fileUrl !== existing.fileUrl
    ) {
      await deleteCertificationFile(existing.fileUrl)
    }

    const row = await prisma.teknisiCertification.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
        ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl.trim() } : {}),
        ...(parsed.data.fileType !== undefined ? { fileType: parsed.data.fileType } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      },
    })

    return apiSuccess(serializeTeknisiCertification(row))
  } catch (e) {
    console.error('[TEKNISI_CERTIFICATIONS_PATCH]', e)
    return apiError('Gagal memperbarui sertifikasi', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.teknisiCertification.findFirst({
      where: { id, teknisiId: session.user.id },
    })
    if (!existing) return apiError('Sertifikasi tidak ditemukan', 404)

    await deleteCertificationFile(existing.fileUrl)
    await prisma.teknisiCertification.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    console.error('[TEKNISI_CERTIFICATIONS_DELETE]', e)
    return apiError('Gagal menghapus sertifikasi', 500)
  }
}
