import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { serializeUserRemote, type TeknisiParty } from '@/lib/user-remote-serializer'
import { sendTelegramMessage, TelegramNotificationTemplates } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof TeknisiParty, true>

const createSchema = z.object({
  teknisiId: z.string().min(1),
  remoteId: z.string().min(6).max(32),
  otp: z.string().min(4).max(32),
  description: z.string().max(2000).optional(),
  platform: z.string().max(120).optional(),
})

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const { teknisiId, remoteId, otp, description, platform } = parsed.data

  if (teknisiId === session.user.id) {
    return apiError('Tidak dapat meminta remote ke diri sendiri')
  }

  try {
    const teknisi = await prisma.user.findFirst({
      where: {
        id: teknisiId,
        role: 'TEKNISI',
        teknisiProfile: { isNot: null },
      },
      select: { id: true, name: true },
    })
    if (!teknisi) return apiError('Teknisi tidak ditemukan', 404)

    const normalizedRemoteId = remoteId.replace(/\s+/g, ' ').trim()

    const row = await prisma.remoteSession.create({
      data: {
        userId: session.user.id,
        teknisiId,
        remoteId: normalizedRemoteId,
        remoteOtp: otp.trim(),
        description: description?.trim() || null,
        platform: platform?.trim() || null,
        status: 'WAITING',
      },
      include: { 
        teknisi: { 
          select: TEKNISI_SELECT 
        },
        user: {
          select: {
            name: true,
          }
        }
      },
    })

    // 🔔 Send Telegram notification to teknisi
    const teknisiProfile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      select: { telegramChatId: true },
    })

    if (teknisiProfile?.telegramChatId) {
      const message = TelegramNotificationTemplates.newRemoteRequest(
        row.user.name || 'User',
        row.platform || 'Unknown Platform',
        row.remoteId
      )
      
      // Send notification (non-blocking)
      sendTelegramMessage(
        teknisiProfile.telegramChatId,
        message,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        console.error('[TELEGRAM_NOTIFICATION_ERROR]', err)
      })
    }

    void logCommunicationEvent({
      action: 'remote.requested',
      severity: 'INFO',
      summary: `Remote baru ${normalizedRemoteId}: ${session.user.name} → ${teknisi.name}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'remote', id: row.id, label: normalizedRemoteId },
    })

    return apiSuccess(serializeUserRemote(row), 201)
  } catch (e) {
    console.error('[REMOTE_POST]', e)
    return apiError('Gagal mengajukan remote', 500)
  }
}
