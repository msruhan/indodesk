import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  serializeTeknisiPost,
  TEKNISI_POST_LIMITS,
  teknisiPostBodySchema,
  validatePostAttachments,
} from '@/lib/teknisi-post'
import { teknisiPostInclude } from '@/lib/teknisi-post-queries'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = teknisiPostBodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const attachments = parsed.data.attachments ?? []
    const attachmentError = validatePostAttachments(attachments)
    if (attachmentError) return apiError(attachmentError)

    const activeCount = await prisma.teknisiPost.count({
      where: { teknisiId: session.user.id, deletedAt: null },
    })
    if (activeCount >= TEKNISI_POST_LIMITS.maxActivePosts) {
      return apiError(`Batas ${TEKNISI_POST_LIMITS.maxActivePosts} posting aktif tercapai`)
    }

    const row = await prisma.teknisiPost.create({
      data: {
        teknisiId: session.user.id,
        content: parsed.data.content.trim(),
        videoUrl: parsed.data.videoUrl?.trim() || null,
        attachments: {
          create: attachments.map((item, index) => ({
            type: item.type,
            url: item.url.trim(),
            fileName: item.fileName?.trim() || null,
            mimeType: item.mimeType?.trim() || null,
            sizeBytes: item.sizeBytes ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: teknisiPostInclude(session.user.id),
    })

    return apiSuccess(serializeTeknisiPost(row, session.user.id), 201)
  } catch (e) {
    console.error('[TEKNISI_POSTS_POST]', e)
    return apiError('Gagal membuat posting', 500)
  }
}
