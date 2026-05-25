import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendTelegramMessage, TelegramNotificationTemplates, parseTelegramLinkToken, type TelegramUpdate } from '@/lib/telegram'

/**
 * POST /api/telegram/webhook
 * Webhook untuk menerima update dari Telegram Bot
 * 
 * Setup:
 * 1. Deploy aplikasi ke production
 * 2. Set webhook: curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
 *    -H "Content-Type: application/json" \
 *    -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
 */
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json()

    // Handle message
    if (update.message?.text) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text
      const telegramUser = message.from

      if (!text) return NextResponse.json({ success: true })

      // Handle /start command dengan verification token
      if (text.startsWith('/start ')) {
        const token = text.replace('/start ', '').trim()
        const userId = parseTelegramLinkToken(token)

        if (!userId) {
          await sendTelegramMessage(
            chatId,
            '❌ Token verifikasi tidak valid.\n\nSilakan generate token baru dari dashboard IndoTeknizi.'
          )
          return NextResponse.json({ success: true })
        }

        // Cari teknisi profile
        const profile = await prisma.teknisiProfile.findUnique({
          where: { userId },
          include: { user: true },
        })

        if (!profile) {
          await sendTelegramMessage(
            chatId,
            '❌ Profil teknisi tidak ditemukan.\n\nPastikan Anda sudah terdaftar sebagai teknisi.'
          )
          return NextResponse.json({ success: true })
        }

        // Link Telegram ke teknisi profile
        await prisma.teknisiProfile.update({
          where: { userId },
          data: {
            telegramChatId: String(chatId),
            telegramUsername: telegramUser.username || null,
            telegramLinkedAt: new Date(),
          },
        })

        // Kirim konfirmasi
        const welcomeMessage = TelegramNotificationTemplates.accountLinked(
          profile.user.name
        )
        await sendTelegramMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })

        return NextResponse.json({ success: true })
      }

      // Handle /help command
      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          `
📱 *IndoTeknizi Bot*

Bot ini digunakan untuk mengirim notifikasi ke teknisi.

*Perintah:*
/start <token> - Hubungkan akun dengan token verifikasi
/status - Cek status koneksi
/help - Tampilkan bantuan ini

Untuk menghubungkan akun, buka dashboard IndoTeknizi → Settings → Telegram, lalu klik "Hubungkan Telegram".
          `.trim(),
          { parse_mode: 'Markdown' }
        )
        return NextResponse.json({ success: true })
      }

      // Handle /status command
      if (text === '/status') {
        const profile = await prisma.teknisiProfile.findFirst({
          where: { telegramChatId: String(chatId) },
          include: { user: true },
        })

        if (!profile) {
          await sendTelegramMessage(
            chatId,
            '❌ Akun Telegram Anda belum terhubung dengan IndoTeknizi.\n\nSilakan hubungkan dari dashboard.'
          )
        } else {
          await sendTelegramMessage(
            chatId,
            `
✅ *Akun Terhubung*

👤 Nama: ${profile.user.name}
📧 Email: ${profile.user.email}
🎭 Role: ${profile.user.role}

Anda akan menerima notifikasi untuk request baru dan update penting.
            `.trim(),
            { parse_mode: 'Markdown' }
          )
        }
        return NextResponse.json({ success: true })
      }

      // Default response untuk pesan lain
      await sendTelegramMessage(
        chatId,
        'Gunakan /help untuk melihat perintah yang tersedia.'
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

/**
 * GET /api/telegram/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'telegram-webhook' })
}
