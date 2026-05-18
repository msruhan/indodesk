import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { getConversationForParticipant } from '@/lib/chat-access'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const conversation = await getConversationForParticipant(id, session.user.id)
    if (!conversation) return apiError('Percakapan tidak ditemukan', 404)

    const result = await prisma.chatMessage.updateMany({
      where: {
        conversationId: id,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return apiSuccess({ marked: result.count })
  } catch (e) {
    console.error('[CHAT_READ_POST]', e)
    return apiError('Gagal menandai pesan dibaca', 500)
  }
}
