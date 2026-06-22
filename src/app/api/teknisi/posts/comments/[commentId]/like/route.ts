import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** POST /api/teknisi/posts/comments/[commentId]/like — toggle suka komentar */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { commentId } = await params

  try {
    const comment = await prisma.teknisiPostComment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true },
    })
    if (!comment) return apiError('Komentar tidak ditemukan', 404)

    const existing = await prisma.teknisiPostCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId: session.user.id } },
      select: { id: true },
    })

    if (existing) {
      await prisma.teknisiPostCommentLike.delete({ where: { id: existing.id } })
    } else {
      await prisma.teknisiPostCommentLike.create({
        data: { commentId, userId: session.user.id },
      })
    }

    const likeCount = await prisma.teknisiPostCommentLike.count({ where: { commentId } })

    return apiSuccess({ liked: !existing, likeCount })
  } catch (e) {
    console.error('[TEKNISI_POST_COMMENT_LIKE_POST]', e)
    return apiError('Gagal memperbarui suka komentar', 500)
  }
}
