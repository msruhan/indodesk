import { prisma } from '@/lib/db'
import { getTelegramChannelChatId } from '@/lib/telegram/channel-config'
import { getEventAudience, type TelegramEventKey } from '@/lib/telegram/template-defaults'
import { renderTelegramTemplate } from '@/lib/telegram/template-render'
import { getEffectiveTemplate } from '@/lib/telegram/template-store'
import { isTelegramEnabled, sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram'

export type TelegramDispatchContext = {
  teknisiUserId?: string
  vars: Record<string, string | number | null | undefined>
  /** URL HTTPS absolut — jika ada, kirim sendPhoto + caption alih-alih sendMessage. */
  photoUrl?: string | null
}

async function deliverTelegramNotification(
  chatId: string | number,
  text: string,
  photoUrl: string | null | undefined,
  eventKey: string,
): Promise<void> {
  const parseMode = { parse_mode: 'Markdown' as const }

  if (photoUrl?.trim()) {
    const photoResult = await sendTelegramPhoto(chatId, photoUrl.trim(), text, parseMode)
    if (photoResult.success) return
    console.warn(
      `[Telegram] sendPhoto gagal untuk ${eventKey}, fallback ke teks:`,
      photoResult.error,
    )
  }

  const result = await sendTelegramMessage(chatId, text, parseMode)
  if (!result.success) {
    console.error(`[Telegram] Gagal kirim ${eventKey}:`, result.error)
  }
}

export async function dispatchTelegramEvent(
  eventKey: TelegramEventKey,
  context: TelegramDispatchContext,
): Promise<void> {
  if (!isTelegramEnabled()) {
    return
  }

  try {
    const template = await getEffectiveTemplate(eventKey)
    if (!template.isEnabled) return

    const text = renderTelegramTemplate(template.body, context.vars)
    if (!text.trim()) return

    const audience = getEventAudience(eventKey)
    if (audience === 'CHANNEL') {
      const chatId = await getTelegramChannelChatId()
      if (!chatId) {
        console.warn(`[Telegram] Channel chat ID belum dikonfigurasi (${eventKey})`)
        return
      }
      await deliverTelegramNotification(chatId, text, context.photoUrl, eventKey)
      return
    }

    const teknisiUserId = context.teknisiUserId
    if (!teknisiUserId) {
      console.warn(`[Telegram] teknisiUserId wajib untuk event ${eventKey}`)
      return
    }

    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiUserId },
      select: { telegramChatId: true },
    })
    if (!profile?.telegramChatId) {
      return
    }

    await deliverTelegramNotification(profile.telegramChatId, text, context.photoUrl, eventKey)
  } catch (error) {
    console.error(`[Telegram] dispatchTelegramEvent(${eventKey}) error:`, error)
  }
}
