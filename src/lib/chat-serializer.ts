import type { ChatConversation, ChatMessage, User, TeknisiProfile } from '@prisma/client'

type ConversationWithRelations = ChatConversation & {
  user: Pick<User, 'id' | 'name' | 'image'>
  teknisi: Pick<User, 'id' | 'name' | 'image'> & {
    teknisiProfile: Pick<TeknisiProfile, 'isOnline'> | null
  }
  messages: Pick<ChatMessage, 'body' | 'createdAt'>[]
  _count: { messages: number }
}

export type ChatConversationDto = {
  id: string
  peerId: string
  peerName: string
  peerImage: string | null
  peerIsOnline: boolean
  lastMessage: string | null
  timestamp: string
  unread: number
}

export type ChatMessageDto = {
  id: string
  body: string
  senderId: string
  isMine: boolean
  timestamp: string
  read: boolean
}

export function formatChatListTime(date: Date | null | undefined): string {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((startOfToday.getTime() - startOfMsg.getTime()) / 86400000)

  if (diffDays === 0) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function formatChatMessageTime(date: Date): string {
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function serializeConversation(
  conv: ConversationWithRelations,
  currentUserId: string,
): ChatConversationDto {
  const isUserSide = conv.userId === currentUserId
  const peer = isUserSide ? conv.teknisi : conv.user
  const last = conv.messages[0]

  return {
    id: conv.id,
    peerId: peer.id,
    peerName: peer.name,
    peerImage: peer.image,
    peerIsOnline: isUserSide ? (conv.teknisi.teknisiProfile?.isOnline ?? false) : false,
    lastMessage: last?.body ?? null,
    timestamp: formatChatListTime(last?.createdAt ?? conv.lastMessageAt),
    unread: conv._count.messages,
  }
}

export function serializeMessage(msg: ChatMessage, currentUserId: string): ChatMessageDto {
  return {
    id: msg.id,
    body: msg.body,
    senderId: msg.senderId,
    isMine: msg.senderId === currentUserId,
    timestamp: formatChatMessageTime(msg.createdAt),
    read: msg.readAt !== null,
  }
}

export function peerAvatarUrl(peerId: string, peerImage: string | null): string {
  if (peerImage) return peerImage
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(peerId.slice(0, 2))}&background=0d9488&color=fff&size=128`
}
