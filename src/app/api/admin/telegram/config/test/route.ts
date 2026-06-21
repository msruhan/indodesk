import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import {
  getTelegramChannelChatId,
  getTelegramGroupChatId,
  getTelegramGroupTopicThreadId,
} from '@/lib/telegram/channel-config'
import { isTelegramEnabled, sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const TEST_MESSAGE =
  '✅ *Tes koneksi Bantoo Bot*\n\nPesan uji dari dashboard admin. Channel Telegram siap menerima notifikasi produk baru.'

const TEST_TOPIC_MESSAGE =
  '✅ *Tes topic Lapak Jual-Beli*\n\nPesan uji dari dashboard admin. Grup topic siap menerima notifikasi produk baru.'

function telegramHint(error: string): string {
  return /chat not found|not enough rights|Forbidden|topic closed/i.test(error)
    ? ' Pastikan bot adalah admin channel/grup dan punya izin kirim pesan di topic.'
    : ''
}

export async function POST() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  if (!isTelegramEnabled()) {
    return apiError('Bot Telegram belum dikonfigurasi (TELEGRAM_BOT_TOKEN)', 400)
  }

  const chatId = await getTelegramChannelChatId()
  if (!chatId) {
    return apiError('Chat ID channel belum diatur', 400)
  }

  const channelResult = await sendTelegramMessage(chatId, TEST_MESSAGE, { parse_mode: 'Markdown' })
  if (!channelResult.success) {
    const base = channelResult.error ?? 'Gagal mengirim pesan uji ke channel'
    return apiError(base + telegramHint(base), 502)
  }

  const groupChatId = await getTelegramGroupChatId()
  const topicThreadId = await getTelegramGroupTopicThreadId()
  if (groupChatId && topicThreadId) {
    const topicResult = await sendTelegramMessage(groupChatId, TEST_TOPIC_MESSAGE, {
      parse_mode: 'Markdown',
      message_thread_id: topicThreadId,
    })
    if (!topicResult.success) {
      const base = topicResult.error ?? 'Channel OK, tetapi gagal kirim ke topic grup'
      return apiError(base + telegramHint(base), 502, { channelSent: true })
    }
    return apiSuccess({ sent: true, channelSent: true, groupTopicSent: true })
  }

  return apiSuccess({ sent: true, channelSent: true, groupTopicSent: false })
}
