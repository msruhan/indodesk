import { prisma } from '@/lib/db'

export const TEKNISI_POST_COMMENT_LIMITS = {
  minLength: 1,
  maxLength: 500,
} as const

export const teknisiPostInclude = (viewerId?: string | null) => ({
  attachments: true,
  teknisi: { select: { id: true, name: true, image: true } },
  _count: {
    select: {
      likes: true,
      comments: { where: { deletedAt: null } },
    },
  },
  ...(viewerId
    ? {
        likes: {
          where: { userId: viewerId },
          select: { id: true },
          take: 1,
        },
      }
    : {}),
})

export async function getViewerIdFromSession(): Promise<string | null> {
  const { getApiSession } = await import('@/lib/api-auth')
  const session = await getApiSession()
  return session?.user?.id ?? null
}

export async function assertPostVisible(postId: string) {
  const post = await prisma.teknisiPost.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, teknisiId: true },
  })
  return post
}
