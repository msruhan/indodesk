import { prisma } from '@/lib/db'

export const TELEGRAM_CHANNEL_CHAT_ID_KEY = 'telegram_channel_chat_id'

export async function getTelegramChannelChatId(): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: TELEGRAM_CHANNEL_CHAT_ID_KEY },
  })
  const value = row?.value?.trim()
  return value || null
}

export async function saveTelegramChannelChatId(chatId: string): Promise<void> {
  const trimmed = chatId.trim()
  await prisma.platformSetting.upsert({
    where: { key: TELEGRAM_CHANNEL_CHAT_ID_KEY },
    create: { key: TELEGRAM_CHANNEL_CHAT_ID_KEY, value: trimmed },
    update: { value: trimmed },
  })
}

export function maskChatId(chatId: string | null): string | null {
  if (!chatId) return null
  if (chatId.length <= 6) return chatId
  return `${'*'.repeat(Math.max(0, chatId.length - 4))}${chatId.slice(-4)}`
}
