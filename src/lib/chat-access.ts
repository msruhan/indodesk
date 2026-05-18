import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function getConversationForParticipant(conversationId: string, userId: string) {
  return prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId }, { teknisiId: userId }],
    },
  })
}

export function resolveChatParticipants(
  currentUserId: string,
  currentRole: string,
  peerId: string,
  peerRole: string,
): { userId: string; teknisiId: string } | { error: string } {
  if (currentRole === UserRole.USER && peerRole === UserRole.TEKNISI) {
    return { userId: currentUserId, teknisiId: peerId }
  }
  if (currentRole === UserRole.USER && peerRole === UserRole.ADMIN) {
    return { userId: currentUserId, teknisiId: peerId }
  }
  if (currentRole === UserRole.TEKNISI && peerRole === UserRole.USER) {
    return { userId: peerId, teknisiId: currentUserId }
  }
  if (currentRole === UserRole.TEKNISI && peerRole === UserRole.ADMIN) {
    return { userId: currentUserId, teknisiId: peerId }
  }
  return { error: 'Kombinasi chat tidak didukung' }
}
