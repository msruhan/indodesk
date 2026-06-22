import type { TeknisiPostComment, User } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'

export type TeknisiPostCommentDto = {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    avatarUrl: string | null
  }
  likeCount: number
  likedByViewer: boolean
  isOwner: boolean
}

type CommentRow = TeknisiPostComment & {
  user: Pick<User, 'id' | 'name' | 'image'>
  _count: { likes: number }
  likes?: { id: string }[]
}

export function serializeTeknisiPostComment(
  row: CommentRow,
  viewerId?: string | null,
): TeknisiPostCommentDto {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.user.id,
      name: row.user.name,
      avatarUrl: resolveDisplayImageUrl(row.user.image),
    },
    likeCount: row._count.likes,
    likedByViewer: Boolean(viewerId && row.likes && row.likes.length > 0),
    isOwner: Boolean(viewerId && viewerId === row.userId),
  }
}

export const teknisiPostCommentInclude = (viewerId?: string | null) => ({
  user: { select: { id: true, name: true, image: true } },
  _count: { select: { likes: true } },
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
