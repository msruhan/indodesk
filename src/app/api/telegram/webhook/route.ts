import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { linkTeknisiTelegramAccount } from '@/lib/telegram/link-account'
import { sendTelegramMessage, type TelegramUpdate } from '@/lib/telegram'
import { validateTelegramWebhookSecret } from '@/lib/telegram/webhook-auth'

/**
 * POST /api/telegram/webhook
 * Webhook untuk menerima update dari Telegram Bot.
 */
export async function POST(req: NextRequest) {
  const authError = validateTelegramWebhookSecret(req)
  if (authError) return authError

  try {
    const update: TelegramUpdate = await req.json()

    if (update.message?.text) {
      const message = update.message
      const chatId = message.chat.id
      const rawText = message.text
      const telegramUser = message.from

      if (!rawText?.trim()) return NextResponse.json({ success: true })

      const text = rawText.trim()

      if (text.startsWith('/start')) {
        const token = text.replace(/^\/start\s*/i, '').trim()

        if (!token) {
          await sendTelegramMessage(
            chatId,
            '👋 Halo! Untuk menghubungkan akun Bantoo, buka dashboard teknisi → Pengaturan → Telegram Alerts, lalu klik *Hubungkan Telegram*.\n\nJangan ketik /start manual — gunakan tombol dari web agar token verifikasi terkirim otomatis.',
            { parse_mode: 'Markdown' },
          )
          return NextResponse.json({ success: true })
        }

        const result = await linkTeknisiTelegramAccount({
          token,
          chatId,
          username: telegramUser?.username ?? null,
        })

        if (!result.ok) {
          if (result.reason === 'invalid_token') {
            await sendTelegramMessage(
              chatId,
              '❌ Token verifikasi tidak valid atau sudah kedaluwarsa.\n\nSilakan generate token baru dari dashboard Bantoo.',
            )
          } else if (result.reason === 'no_profile') {
            await sendTelegramMessage(
              chatId,
              '❌ Profil teknisi tidak ditemukan.\n\nPastikan Anda sudah terdaftar sebagai teknisi.',
            )
          }
          return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: true })
      }

      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          `
📱 *Bantoo Bot*

Bot ini digunakan untuk mengirim notifikasi ke teknisi.

*Perintah:*
/start <token> - Hubungkan akun dengan token verifikasi dari dashboard
/status - Cek status koneksi
/help - Tampilkan bantuan ini

Untuk menghubungkan akun, buka dashboard Bantoo → Pengaturan → Telegram Alerts, lalu klik "Hubungkan Telegram".
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
          const tgLine = profile.telegramUsername
            ? `\n📱 Telegram: @${profile.telegramUsername}`
            : ''
          await sendTelegramMessage(
            chatId,
            `
✅ *Akun Terhubung*

👤 Nama: ${profile.user.name}
📧 Email: ${profile.user.email}${tgLine}

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
