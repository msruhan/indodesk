import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, getApiSession, requireApiAuth } from '@/lib/api-auth'
import {
  serializeTeknisiPostComment,
  teknisiPostCommentInclude,
} from '@/lib/teknisi-post-comment'
import { TEKNISI_POST_COMMENT_LIMITS, assertPostVisible } from '@/lib/teknisi-post-queries'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const commentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(TEKNISI_POST_COMMENT_LIMITS.minLength, 'Komentar tidak boleh kosong')
    .max(
      TEKNISI_POST_COMMENT_LIMITS.maxLength,
      `Komentar maksimal ${TEKNISI_POST_COMMENT_LIMITS.maxLength} karakter`,
    ),
})

/** GET /api/teknisi/posts/[id]/comments */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const post = await assertPostVisible(id)
    if (!post) return apiError('Posting tidak ditemukan', 404)

    const session = await getApiSession()
    const viewerId = session?.user?.id ?? null

    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
    )
    const skip = (page - 1) * limit

    const [rows, total] = await Promise.all([
      prisma.teknisiPostComment.findMany({
        where: { postId: id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: teknisiPostCommentInclude(viewerId),
      }),
      prisma.teknisiPostComment.count({ where: { postId: id, deletedAt: null } }),
    ])

    return apiSuccess({
      items: rows.map((row) => serializeTeknisiPostComment(row, viewerId)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: skip + rows.length < total,
      },
    })
  } catch (e) {
    console.error('[TEKNISI_POST_COMMENTS_GET]', e)
    return apiError('Gagal memuat komentar', 500)
  }
}

/** POST /api/teknisi/posts/[id]/comments */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const post = await assertPostVisible(id)
    if (!post) return apiError('Posting tidak ditemukan', 404)

    const body = await req.json()
    const parsed = commentBodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const row = await prisma.teknisiPostComment.create({
      data: {
        postId: id,
        userId: session.user.id,
        content: parsed.data.content.trim(),
      },
      include: teknisiPostCommentInclude(session.user.id),
    })

    const commentCount = await prisma.teknisiPostComment.count({
      where: { postId: id, deletedAt: null },
    })

    return apiSuccess(
      {
        comment: serializeTeknisiPostComment(row, session.user.id),
        commentCount,
      },
      201,
    )
  } catch (e) {
    console.error('[TEKNISI_POST_COMMENTS_POST]', e)
    return apiError('Gagal menambah komentar', 500)
  }
}
