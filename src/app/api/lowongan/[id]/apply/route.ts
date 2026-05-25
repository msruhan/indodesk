import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const applySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30),
  coverLetter: z.string().max(5000).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params
  try {
    const lowongan = await prisma.lowongan.findFirst({
      where: { id, isActive: true },
    })
    if (!lowongan) return apiError('Lowongan tidak tersedia', 404)

    const body = await req.json()
    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const existing = await prisma.lowonganApplication.findFirst({
      where: { lowonganId: id, applicantId: session.user.id },
    })
    if (existing) {
      return apiError('Anda sudah melamar lowongan ini')
    }

    await prisma.lowonganApplication.create({
      data: {
        lowonganId: id,
        applicantId: session.user.id,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim(),
        phone: parsed.data.phone.trim(),
        coverLetter: parsed.data.coverLetter?.trim() || null,
      },
    })

    return apiSuccess({ submitted: true }, 201)
  } catch (e) {
    console.error('[LOWONGAN_APPLY_POST]', e)
    return apiError('Gagal mengirim lamaran', 500)
  }
}
