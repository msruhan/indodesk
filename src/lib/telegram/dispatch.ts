import { prisma } from '@/lib/db'
import { getTelegramChannelChatId } from '@/lib/telegram/channel-config'
import { getEventAudience, type TelegramEventKey } from '@/lib/telegram/template-defaults'
import { renderTelegramTemplate } from '@/lib/telegram/template-render'
import { getEffectiveTemplate } from '@/lib/telegram/template-store'
import { isTelegramEnabled, sendTelegramMessage } from '@/lib/telegram'

export type TelegramDispatchContext = {
  teknisiUserId?: string
  vars: Record<string, string | number | null | undefined>
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
      const result = await sendTelegramMessage(chatId, text, { parse_mode: 'Markdown' })
      if (!result.success) {
        console.error(`[Telegram] Gagal kirim ${eventKey} ke channel:`, result.error)
      }
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

    const result = await sendTelegramMessage(profile.telegramChatId, text, {
      parse_mode: 'Markdown',
    })
    if (!result.success) {
      console.error(`[Telegram] Gagal kirim ${eventKey} ke teknisi ${teknisiUserId}:`, result.error)
    }
  } catch (error) {
    console.error(`[Telegram] dispatchTelegramEvent(${eventKey}) error:`, error)
  }
}
