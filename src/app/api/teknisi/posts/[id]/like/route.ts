import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { assertPostVisible } from '@/lib/teknisi-post-queries'

export const dynamic = 'force-dynamic'

/** POST /api/teknisi/posts/[id]/like — toggle suka posting */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const post = await assertPostVisible(id)
    if (!post) return apiError('Posting tidak ditemukan', 404)

    const existing = await prisma.teknisiPostLike.findUnique({
      where: { postId_userId: { postId: id, userId: session.user.id } },
      select: { id: true },
    })

    if (existing) {
      await prisma.teknisiPostLike.delete({ where: { id: existing.id } })
    } else {
      await prisma.teknisiPostLike.create({
        data: { postId: id, userId: session.user.id },
      })
    }

    const likeCount = await prisma.teknisiPostLike.count({ where: { postId: id } })

    return apiSuccess({ liked: !existing, likeCount })
  } catch (e) {
    console.error('[TEKNISI_POST_LIKE_POST]', e)
    return apiError('Gagal memperbarui suka', 500)
  }
}
