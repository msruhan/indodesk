import { NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { resolveChatParticipants } from '@/lib/chat-access'
import { serializeConversation } from '@/lib/chat-serializer'
import { SESSION_STALE_CODE } from '@/lib/api-constants'
import {
  chatConversationInclude,
  findConversationDtoByParticipants,
  isForeignKeyConstraintError,
  isUniqueConstraintError,
  loadConversationDto,
} from '@/lib/chat-conversation-load'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  peerId: z.string().min(1),
})

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const userId = session.user.id
  const role = session.user.role

  try {
    const conversations = await prisma.chatConversation.findMany({
      where:
        role === UserRole.ADMIN
          ? { teknisiId: userId }
          : {
              OR: [{ userId }, { teknisiId: userId }],
            },
      include: chatConversationInclude,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    })

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readAt: null,
          },
        })
        return serializeConversation({ ...conv, _count: { messages: unread } }, userId)
      }),
    )

    return apiSuccess(withUnread)
  } catch (e) {
    console.error('[CHAT_CONVERSATIONS_GET]', e)
    return apiError('Gagal memuat percakapan', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  if (session.user.role !== UserRole.USER && session.user.role !== UserRole.TEKNISI) {
    return apiError('Hanya user dan teknisi yang dapat memulai chat', 403)
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const peer = await prisma.user.findUnique({
      where: { id: parsed.data.peerId },
      select: { id: true, role: true, name: true },
    })
    if (!peer) {
      return apiError('Teknisi tidak ditemukan. Coba refresh halaman atau login ulang.', 404)
    }

    if (session.user.role === UserRole.USER) {
      if (peer.role !== UserRole.TEKNISI && peer.role !== UserRole.ADMIN) {
        return apiError('User hanya dapat chat dengan teknisi atau admin')
      }
    }
    if (session.user.role === UserRole.TEKNISI) {
      if (peer.role !== UserRole.USER && peer.role !== UserRole.ADMIN) {
        return apiError('Teknisi hanya dapat chat dengan user atau admin')
      }
    }
    if (peer.id === session.user.id) {
      return apiError('Tidak dapat chat dengan diri sendiri')
    }

    const participants = resolveChatParticipants(
      session.user.id,
      session.user.role,
      parsed.data.peerId,
      peer.role,
    )
    if ('error' in participants) return apiError(participants.error)

    const existing = await findConversationDtoByParticipants(
      participants.userId,
      participants.teknisiId,
      session.user.id,
    )

    if (existing) {
      return apiSuccess(existing)
    }

    try {
      const created = await prisma.chatConversation.create({
        data: {
          userId: participants.userId,
          teknisiId: participants.teknisiId,
        },
      })

      const dto = await loadConversationDto(created.id, session.user.id)
      if (!dto) return apiError('Gagal memuat percakapan baru', 500)

      return apiSuccess(dto, 201)
    } catch (createError) {
      if (isUniqueConstraintError(createError)) {
        const retry = await findConversationDtoByParticipants(
          participants.userId,
          participants.teknisiId,
          session.user.id,
        )
        if (retry) return apiSuccess(retry)
      }
      throw createError
    }
  } catch (e) {
    console.error('[CHAT_CONVERSATIONS_POST]', e)
    if (isForeignKeyConstraintError(e)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Sesi login sudah tidak valid (database di-reset). Silakan logout lalu login kembali.',
          code: SESSION_STALE_CODE,
        },
        { status: 401 },
      )
    }
    return apiError('Gagal membuat percakapan', 500)
  }
}
