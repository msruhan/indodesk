import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { getConversationForParticipant } from '@/lib/chat-access'
import { serializeMessage } from '@/lib/chat-serializer'

export const dynamic = 'force-dynamic'

const sendSchema = z.object({
  body: z.string().min(1, 'Pesan tidak boleh kosong').max(5000),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const conversation = await getConversationForParticipant(id, session.user.id)
    if (!conversation) return apiError('Percakapan tidak ditemukan', 404)

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    return apiSuccess(messages.map((m) => serializeMessage(m, session.user.id)))
  } catch (e) {
    console.error('[CHAT_MESSAGES_GET]', e)
    return apiError('Gagal memuat pesan', 500)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const conversation = await getConversationForParticipant(id, session.user.id)
    if (!conversation) return apiError('Percakapan tidak ditemukan', 404)

    const body = await req.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    const text = parsed.data.body.trim()

    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          body: text,
        },
      }),
      prisma.chatConversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ])

    return apiSuccess(serializeMessage(message, session.user.id), 201)
  } catch (e) {
    console.error('[CHAT_MESSAGES_POST]', e)
    return apiError('Gagal mengirim pesan', 500)
  }
}
