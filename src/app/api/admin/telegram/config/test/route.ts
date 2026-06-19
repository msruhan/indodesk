import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { getTelegramChannelChatId } from '@/lib/telegram/channel-config'
import { isTelegramEnabled, sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

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

  const result = await sendTelegramMessage(
    chatId,
    '✅ *Tes koneksi Bantoo Bot*\n\nPesan uji dari dashboard admin. Channel Telegram siap menerima notifikasi produk baru.',
    { parse_mode: 'Markdown' },
  )

  if (!result.success) {
    const base = result.error ?? 'Gagal mengirim pesan uji'
    const hint =
      /chat not found|not enough rights|Forbidden/i.test(base)
        ? ' Tambahkan @bantoo_bot sebagai admin channel Telegram, lalu coba lagi.'
        : ''
    return apiError(base + hint, 502)
  }

  return apiSuccess({ sent: true })
}
