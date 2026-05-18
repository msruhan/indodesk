import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { serializeConversation } from '@/lib/chat-serializer'

export const chatConversationInclude = {
  user: { select: { id: true, name: true, image: true } },
  teknisi: {
    select: {
      id: true,
      name: true,
      image: true,
      teknisiProfile: { select: { isOnline: true } },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { body: true, createdAt: true },
  },
  _count: {
    select: {
      messages: true,
    },
  },
} as const

export async function loadConversationDto(
  conversationId: string,
  currentUserId: string,
) {
  const conv = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: chatConversationInclude,
  })
  if (!conv) return null

  const unread = await prisma.chatMessage.count({
    where: {
      conversationId: conv.id,
      senderId: { not: currentUserId },
      readAt: null,
    },
  })

  return serializeConversation({ ...conv, _count: { messages: unread } }, currentUserId)
}

export async function findConversationDtoByParticipants(
  userId: string,
  teknisiId: string,
  currentUserId: string,
) {
  const conv = await prisma.chatConversation.findUnique({
    where: {
      userId_teknisiId: { userId, teknisiId },
    },
    include: chatConversationInclude,
  })
  if (!conv) return null

  const unread = await prisma.chatMessage.count({
    where: {
      conversationId: conv.id,
      senderId: { not: currentUserId },
      readAt: null,
    },
  })

  return serializeConversation({ ...conv, _count: { messages: unread } }, currentUserId)
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  )
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'
  )
}
