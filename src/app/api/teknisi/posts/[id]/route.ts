import { prisma } from '@/lib/db'
import { apiError, apiSuccess, getApiSession, requireApiRole } from '@/lib/api-auth'
import {
  serializeTeknisiPost,
  teknisiPostBodySchema,
  validatePostAttachments,
} from '@/lib/teknisi-post'
import { teknisiPostInclude } from '@/lib/teknisi-post-queries'

export const dynamic = 'force-dynamic'

async function getOwnedPost(id: string, teknisiId: string) {
  return prisma.teknisiPost.findFirst({
    where: { id, teknisiId, deletedAt: null },
    include: teknisiPostInclude(teknisiId),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params

  try {
    const existing = await getOwnedPost(id, session.user.id)
    if (!existing) return apiError('Posting tidak ditemukan', 404)

    const body = await req.json()
    const parsed = teknisiPostBodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const attachments = parsed.data.attachments ?? []
    const attachmentError = validatePostAttachments(attachments)
    if (attachmentError) return apiError(attachmentError)

    const row = await prisma.$transaction(async (tx) => {
      await tx.teknisiPostAttachment.deleteMany({ where: { postId: id } })
      return tx.teknisiPost.update({
        where: { id },
        data: {
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
    })

    return apiSuccess(serializeTeknisiPost(row, session.user.id))
  } catch (e) {
    console.error('[TEKNISI_POSTS_PATCH]', e)
    return apiError('Gagal memperbarui posting', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const sessionResult = await getApiSession()
  const session = sessionResult?.user?.id ? sessionResult : null

  if (!session?.user?.id) {
    return apiError('Unauthorized', 401)
  }

  const role = session.user.role
  if (role !== 'TEKNISI' && role !== 'ADMIN') {
    return apiError('Forbidden', 403)
  }

  try {
    const existing = await prisma.teknisiPost.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(role === 'TEKNISI' ? { teknisiId: session.user.id } : {}),
      },
    })

    if (!existing) return apiError('Posting tidak ditemukan', 404)

    await prisma.teknisiPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return apiSuccess({ id, deleted: true })
  } catch (e) {
    console.error('[TEKNISI_POSTS_DELETE]', e)
    return apiError('Gagal menghapus posting', 500)
  }
}
