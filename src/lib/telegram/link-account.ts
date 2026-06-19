import 'server-only'

import { prisma } from '@/lib/db'
import { consumeTelegramLinkToken } from '@/lib/telegram/link-token'
import { sendTelegramMessage, TelegramNotificationTemplates } from '@/lib/telegram'

export type TelegramLinkResult =
  | { ok: true; username: string | null }
  | { ok: false; reason: 'invalid_token' | 'no_profile' | 'send_failed' }

/** Hubungkan chat Telegram ke profil teknisi setelah token valid. */
export async function linkTeknisiTelegramAccount(opts: {
  token: string
  chatId: number | string
  username?: string | null
}): Promise<TelegramLinkResult> {
  const userId = await consumeTelegramLinkToken(opts.token)
  if (!userId) {
    return { ok: false, reason: 'invalid_token' }
  }

  const profile = await prisma.teknisiProfile.findUnique({
    where: { userId },
    include: { user: true },
  })

  if (!profile) {
    return { ok: false, reason: 'no_profile' }
  }

  const chatId = String(opts.chatId)
  const telegramUsername = opts.username?.replace(/^@/, '').trim() || null

  await prisma.teknisiProfile.update({
    where: { userId },
    data: {
      telegramChatId: chatId,
      telegramUsername,
      telegramLinkedAt: new Date(),
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkedAt: new Date() },
  })

  const welcomeMessage = TelegramNotificationTemplates.accountLinked(profile.user.name)
  const sent = await sendTelegramMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })
  if (!sent.success) {
    console.warn('[Telegram] Welcome message failed after link:', sent.error)
  }

  return { ok: true, username: telegramUsername }
}
