import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { consumeTelegramLinkToken } from '@/lib/telegram/link-token'
import { sendTelegramMessage, TelegramNotificationTemplates, type TelegramUpdate } from '@/lib/telegram'
import { validateTelegramWebhookSecret } from '@/lib/telegram/webhook-auth'

/**
 * POST /api/telegram/webhook
 * Webhook untuk menerima update dari Telegram Bot.
 *
 * Set webhook dengan secret_token (lihat scripts/setup-telegram-webhook.sh).
 */
export async function POST(req: NextRequest) {
  const authError = validateTelegramWebhookSecret(req)
  if (authError) return authError

  try {
    const update: TelegramUpdate = await req.json()

    if (update.message?.text) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text
      const telegramUser = message.from

      if (!text) return NextResponse.json({ success: true })

      if (text.startsWith('/start ')) {
        const token = text.replace('/start ', '').trim()
        const userId = await consumeTelegramLinkToken(token)

        if (!userId) {
          await sendTelegramMessage(
            chatId,
            '❌ Token verifikasi tidak valid atau sudah kedaluwarsa.\n\nSilakan generate token baru dari dashboard Bantoo.',
          )
          return NextResponse.json({ success: true })
        }

        const profile = await prisma.teknisiProfile.findUnique({
          where: { userId },
          include: { user: true },
        })

        if (!profile) {
          await sendTelegramMessage(
            chatId,
            '❌ Profil teknisi tidak ditemukan.\n\nPastikan Anda sudah terdaftar sebagai teknisi.',
          )
          return NextResponse.json({ success: true })
        }

        await prisma.teknisiProfile.update({
          where: { userId },
          data: {
            telegramChatId: String(chatId),
            telegramUsername: telegramUser.username || null,
            telegramLinkedAt: new Date(),
          },
        })

        await prisma.user.update({
          where: { id: userId },
          data: { telegramLinkedAt: new Date() },
        })

        const welcomeMessage = TelegramNotificationTemplates.accountLinked(profile.user.name)
        await sendTelegramMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })

        return NextResponse.json({ success: true })
      }

      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          `
📱 *Bantoo Bot*

Bot ini digunakan untuk mengirim notifikasi ke teknisi.

*Perintah:*
/start <token> - Hubungkan akun dengan token verifikasi
/status - Cek status koneksi
/help - Tampilkan bantuan ini

Untuk menghubungkan akun, buka dashboard Bantoo → Settings → Telegram, lalu klik "Hubungkan Telegram".
          `.trim(),
          { parse_mode: 'Markdown' },
        )
        return NextResponse.json({ success: true })
      }

      if (text === '/status') {
        const profile = await prisma.teknisiProfile.findFirst({
          where: { telegramChatId: String(chatId) },
          include: { user: true },
        })

        if (!profile) {
          await sendTelegramMessage(
            chatId,
            '❌ Akun Telegram Anda belum terhubung dengan Bantoo.\n\nSilakan hubungkan dari dashboard.',
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
            { parse_mode: 'Markdown' },
          )
        }
        return NextResponse.json({ success: true })
      }

      await sendTelegramMessage(chatId, 'Gunakan /help untuk melihat perintah yang tersedia.')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'telegram-webhook' })
}
