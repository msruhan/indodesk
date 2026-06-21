import { prisma } from '@/lib/db'

export const TELEGRAM_CHANNEL_CHAT_ID_KEY = 'telegram_channel_chat_id'
export const TELEGRAM_GROUP_CHAT_ID_KEY = 'telegram_group_chat_id'
export const TELEGRAM_GROUP_TOPIC_THREAD_ID_KEY = 'telegram_group_topic_thread_id'

async function getPlatformSettingValue(key: string): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key } })
  const value = row?.value?.trim()
  return value || null
}

async function savePlatformSettingValue(key: string, value: string): Promise<void> {
  const trimmed = value.trim()
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: trimmed },
    update: { value: trimmed },
  })
}

async function clearPlatformSettingValue(key: string): Promise<void> {
  await prisma.platformSetting.deleteMany({ where: { key } })
}

export async function getTelegramChannelChatId(): Promise<string | null> {
  return getPlatformSettingValue(TELEGRAM_CHANNEL_CHAT_ID_KEY)
}

export async function saveTelegramChannelChatId(chatId: string): Promise<void> {
  await savePlatformSettingValue(TELEGRAM_CHANNEL_CHAT_ID_KEY, chatId)
}

export async function getTelegramGroupChatId(): Promise<string | null> {
  return getPlatformSettingValue(TELEGRAM_GROUP_CHAT_ID_KEY)
}

export async function getTelegramGroupTopicThreadId(): Promise<number | null> {
  const raw = await getPlatformSettingValue(TELEGRAM_GROUP_TOPIC_THREAD_ID_KEY)
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function saveTelegramGroupTopicConfig(
  groupChatId: string,
  topicThreadId: string,
): Promise<void> {
  const trimmedChatId = groupChatId.trim()
  const trimmedTopicId = topicThreadId.trim()

  if (!trimmedChatId && !trimmedTopicId) {
    await clearPlatformSettingValue(TELEGRAM_GROUP_CHAT_ID_KEY)
    await clearPlatformSettingValue(TELEGRAM_GROUP_TOPIC_THREAD_ID_KEY)
    return
  }

  if (!trimmedChatId || !trimmedTopicId) {
    throw new Error('Chat ID grup dan Topic ID harus diisi bersamaan, atau keduanya dikosongkan')
  }

  const parsedTopicId = Number.parseInt(trimmedTopicId, 10)
  if (!Number.isFinite(parsedTopicId) || parsedTopicId <= 0) {
    throw new Error('Topic ID tidak valid')
  }

  await savePlatformSettingValue(TELEGRAM_GROUP_CHAT_ID_KEY, trimmedChatId)
  await savePlatformSettingValue(TELEGRAM_GROUP_TOPIC_THREAD_ID_KEY, String(parsedTopicId))
}

export function maskChatId(chatId: string | null): string | null {
  if (!chatId) return null
  if (chatId.length <= 6) return chatId
  return `${'*'.repeat(Math.max(0, chatId.length - 4))}${chatId.slice(-4)}`
}
