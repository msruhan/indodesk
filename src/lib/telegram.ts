/**
 * Telegram Bot API Integration
 * Digunakan untuk mengirim notifikasi ke teknisi via Telegram
 */

import { isStressTestMode, mockDelay } from './stress-mode'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_BASE = 'https://api.telegram.org'

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: {
    id: number
    type: string
  }
  date: number
  text?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

/**
 * Check if Telegram bot is enabled
 */
export function isTelegramEnabled(): boolean {
  return Boolean(TELEGRAM_BOT_TOKEN)
}

/**
 * Set webhook untuk menerima update dari Telegram (optional secret_token).
 */
export async function setTelegramWebhook(
  webhookUrl: string,
  secretToken?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  try {
    const body: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ['message'],
    }
    if (secretToken?.trim()) {
      body.secret_token = secretToken.trim()
    }

    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Gagal set webhook' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Telegram] Error set webhook:', error)
    return { success: false, error: 'Network error' }
  }
}

/** @deprecated Use issueTelegramLinkToken from @/lib/telegram/link-token */
export { issueTelegramLinkToken as generateTelegramLinkToken } from '@/lib/telegram/link-token'

/**
 * Kirim pesan teks ke chat Telegram
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML'
    disable_web_page_preview?: boolean
    disable_notification?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] Bot token tidak dikonfigurasi')
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  if (isStressTestMode()) {
    await mockDelay(50)
    return { success: true }
  }

  try {
    console.log(`[Telegram] Sending message to chat ${chatId}...`)
    
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('[Telegram] Gagal kirim pesan:', data)
      return { success: false, error: data.description || 'Gagal mengirim pesan' }
    }

    console.log(`[Telegram] ✅ Message sent successfully to chat ${chatId}`)
    return { success: true }
  } catch (error) {
    console.error('[Telegram] Error kirim pesan:', error)
    return { success: false, error: 'Network error' }
  }
}

/** Kirim foto dengan caption (Markdown/HTML) ke chat Telegram. */
export async function sendTelegramPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML'
    disable_notification?: boolean
  },
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] Bot token tidak dikonfigurasi')
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  if (isStressTestMode()) {
    await mockDelay(50)
    return { success: true }
  }

  const safeCaption = caption.length > 1024 ? `${caption.slice(0, 1021)}…` : caption

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: safeCaption,
        ...options,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('[Telegram] Gagal kirim foto:', data)
      return { success: false, error: data.description || 'Gagal mengirim foto' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Telegram] Error kirim foto:', error)
    return { success: false, error: 'Network error' }
  }
}

let cachedBotUsername: string | null | undefined

/** Username bot: env (konfigurasi eksplisit) lalu getMe sebagai fallback. */
export async function resolveTelegramBotUsername(): Promise<string | null> {
  if (cachedBotUsername) return cachedBotUsername

  const fromEnv = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '')
  if (fromEnv) {
    cachedBotUsername = fromEnv
    return cachedBotUsername
  }

  if (TELEGRAM_BOT_TOKEN) {
    const info = await getTelegramBotInfo()
    if (info.success && info.data?.username) {
      cachedBotUsername = info.data.username
      return cachedBotUsername
    }
  }

  return null
}

export function buildTelegramDeepLink(username: string, startParam: string): string {
  const clean = username.trim().replace(/^@/, '')
  return `https://t.me/${clean}?start=${encodeURIComponent(startParam)}`
}

/**
 * Generate link untuk menghubungkan akun dengan bot Telegram
 * User akan klik link ini, lalu bot akan menerima /start dengan parameter
 */
export async function generateTelegramBotLink(verificationCode: string): Promise<string | null> {
  const botUsername = await resolveTelegramBotUsername()
  if (!botUsername) return null
  return buildTelegramDeepLink(botUsername, verificationCode)
}

/**
 * Hapus webhook
 */
export async function deleteTelegramWebhook(): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`, {
      method: 'POST',
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Gagal hapus webhook' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Telegram] Error hapus webhook:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Get info bot
 */
export async function getTelegramBotInfo(): Promise<{ success: boolean; data?: TelegramUser; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const data = await response.json()

    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Gagal get bot info' }
    }

    return { success: true, data: data.result }
  } catch (error) {
    console.error('[Telegram] Error get bot info:', error)
    return { success: false, error: 'Network error' }
  }
}

/** Info webhook terdaftar di Telegram (untuk admin diagnostics). */
export async function getTelegramWebhookInfo(): Promise<{
  success: boolean
  data?: { url?: string; hasCustomCertificate?: boolean; pendingUpdateCount?: number }
  error?: string
}> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const data = await response.json()

    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Gagal get webhook info' }
    }

    return { success: true, data: data.result }
  } catch (error) {
    console.error('[Telegram] Error get webhook info:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Template notifikasi untuk berbagai event
 */
export const TelegramNotificationTemplates = {
  newKonsultasiRequest: (userName: string, service: string, orderCode: string) => `
🔔 *Request Konsultasi Baru*

👤 User: ${userName}
📋 Layanan: ${service}
🔖 Kode: \`${orderCode}\`

Silakan cek dashboard untuk menerima atau menolak request ini.
  `.trim(),

  newRemoteRequest: (userName: string, platform: string, remoteId: string) => `
🔔 *Request Remote Baru*

👤 User: ${userName}
💻 Platform: ${platform}
🔖 Remote ID: \`${remoteId}\`

Silakan cek dashboard untuk menerima request ini.
  `.trim(),

  newInspectionRequest: (userName: string, productName: string, mode: string, orderCode: string) => `
🔔 *Request Inspeksi Baru*

👤 User: ${userName}
📱 Produk: ${productName}
📍 Mode: ${mode}
🔖 Kode: \`${orderCode}\`

Silakan cek dashboard untuk menerima request ini.
  `.trim(),

  payoutReady: (amount: string, orderCode: string) => `
💰 *Payout Siap Dicairkan*

💵 Jumlah: ${amount}
🔖 Order: \`${orderCode}\`

Saldo sudah masuk ke wallet Anda.
  `.trim(),

  newMessage: (userName: string, preview: string) => `
💬 *Pesan Baru dari User*

👤 ${userName}
📝 "${preview}"

Balas segera untuk menjaga response time Anda!
  `.trim(),

  accountLinked: (name: string) => `
✅ *Akun Berhasil Terhubung*

Halo ${name}! 👋

Akun Anda sudah terhubung dengan Bantoo Bot di Telegram. Anda akan menerima notifikasi untuk:
• Pesanan dari pelanggan
• Request konsultasi baru
• Request inspeksi
• Payout siap dicairkan


Anda bisa unlink kapan saja dari dashboard.
  `.trim(),

  newMarketplaceOrder: (userName: string, productName: string, orderCode: string) => `
🛒 *Order Marketplace Baru*

👤 User: ${userName}
📦 Produk: ${productName}
🔖 Kode: \`${orderCode}\`

Segera proses order ini!
  `.trim(),

  newReview: (userName: string, rating: number, comment: string) => `
⭐ *Review Baru*

👤 ${userName}
⭐ Rating: ${rating}/5
💬 "${comment}"

Terima kasih atas pelayanan Anda!
  `.trim(),

  paymentReceived: (amount: string, orderCode: string) => `
💳 *Pembayaran Diterima*

💵 Jumlah: ${amount}
🔖 Order: \`${orderCode}\`

Silakan proses order.
  `.trim(),
}
