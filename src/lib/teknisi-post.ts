import { z } from 'zod'
import type { TeknisiPost, TeknisiPostAttachment, User } from '@prisma/client'
import { isR2PublicUrl } from '@/lib/image-url-utils'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'
import { isAllowedVideoUrl, parseVideoEmbedUrl, type ParsedVideoEmbed } from '@/lib/video-embed-url'

export const TEKNISI_POST_UPLOAD_PREFIX = '/uploads/teknisi-posts/'

export const TEKNISI_POST_LIMITS = {
  maxActivePosts: 50,
  minContentLength: 10,
  maxContentLength: 2000,
  maxImages: 4,
  maxPdf: 1,
} as const

const attachmentInputSchema = z.object({
  type: z.enum(['image', 'pdf']),
  url: z.string().min(1).max(2048),
  fileName: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  sizeBytes: z.number().int().nonnegative().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const teknisiPostBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(TEKNISI_POST_LIMITS.minContentLength, `Minimal ${TEKNISI_POST_LIMITS.minContentLength} karakter`)
    .max(TEKNISI_POST_LIMITS.maxContentLength),
  videoUrl: z
    .string()
    .max(2048)
    .optional()
    .nullable()
    .refine((v) => !v || isAllowedVideoUrl(v), { message: 'URL video tidak valid (YouTube, Vimeo, atau TikTok)' }),
  attachments: z.array(attachmentInputSchema).max(TEKNISI_POST_LIMITS.maxImages + TEKNISI_POST_LIMITS.maxPdf).optional(),
})

export type TeknisiPostAttachmentDto = {
  id: string
  type: 'image' | 'pdf'
  url: string
  fileName: string | null
  sortOrder: number
}

export type TeknisiPostAuthorDto = {
  id: string
  name: string
  avatarUrl: string | null
}

export type TeknisiPostDto = {
  id: string
  content: string
  videoUrl: string | null
  videoEmbed: ParsedVideoEmbed | null
  publishedAt: string
  updatedAt: string
  attachments: TeknisiPostAttachmentDto[]
  author: TeknisiPostAuthorDto
  isOwner: boolean
  likeCount: number
  commentCount: number
  likedByViewer: boolean
}

type PostRow = TeknisiPost & {
  attachments: TeknisiPostAttachment[]
  teknisi: Pick<User, 'id' | 'name' | 'image'>
  _count?: { likes: number; comments: number }
  likes?: { id: string }[]
}

export function isTeknisiPostHostedUrl(url: string): boolean {
  if (url.startsWith(TEKNISI_POST_UPLOAD_PREFIX)) return true
  return isR2PublicUrl(url)
}

export function validatePostAttachments(
  attachments: z.infer<typeof attachmentInputSchema>[],
): string | null {
  const images = attachments.filter((a) => a.type === 'image')
  const pdfs = attachments.filter((a) => a.type === 'pdf')

  if (images.length > TEKNISI_POST_LIMITS.maxImages) {
    return `Maksimal ${TEKNISI_POST_LIMITS.maxImages} foto per posting`
  }
  if (pdfs.length > TEKNISI_POST_LIMITS.maxPdf) {
    return `Maksimal ${TEKNISI_POST_LIMITS.maxPdf} PDF per posting`
  }

  for (const item of attachments) {
    if (!isTeknisiPostHostedUrl(item.url)) {
      return 'Lampiran harus diunggah melalui platform'
    }
  }

  return null
}

export function serializeTeknisiPost(
  row: PostRow,
  viewerId?: string | null,
): TeknisiPostDto {
  const videoEmbed = row.videoUrl ? parseVideoEmbedUrl(row.videoUrl) : null

  return {
    id: row.id,
    content: row.content,
    videoUrl: row.videoUrl,
    videoEmbed,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    attachments: row.attachments
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((a) => ({
        id: a.id,
        type: a.type === 'pdf' ? 'pdf' : 'image',
        url: resolveDisplayImageUrl(a.url) ?? a.url,
        fileName: a.fileName,
        sortOrder: a.sortOrder,
      })),
    author: {
      id: row.teknisi.id,
      name: row.teknisi.name,
      avatarUrl: resolveDisplayImageUrl(row.teknisi.image),
    },
    isOwner: Boolean(viewerId && viewerId === row.teknisiId),
    likeCount: row._count?.likes ?? 0,
    commentCount: row._count?.comments ?? 0,
    likedByViewer: Boolean(viewerId && row.likes && row.likes.length > 0),
  }
}
