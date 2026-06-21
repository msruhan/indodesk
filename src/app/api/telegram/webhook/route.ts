import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { linkTelegramAccount } from '@/lib/telegram/link-account'
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
            '👋 Halo! Untuk menghubungkan akun Bantoo:\n\n• *Teknisi:* dashboard → Pengaturan → Telegram Alerts\n• *Admin:* dashboard admin → Profil → Telegram Alerts\n\nKlik *Hubungkan Telegram* di web — jangan ketik /start manual.',
            { parse_mode: 'Markdown' },
          )
          return NextResponse.json({ success: true })
        }

        const result = await linkTelegramAccount({
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
          } else if (result.reason === 'unsupported_role') {
            await sendTelegramMessage(
              chatId,
              '❌ Role akun tidak mendukung notifikasi Telegram ini.',
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

Bot ini mengirim notifikasi operasional ke teknisi dan admin.

*Perintah:*
/start <token> - Hubungkan akun dengan token dari dashboard
/status - Cek status koneksi
/help - Tampilkan bantuan ini

Hubungkan dari dashboard Bantoo (teknisi atau admin) lalu klik "Hubungkan Telegram".
          `.trim(),
          { parse_mode: 'Markdown' },
        )
        return NextResponse.json({ success: true })
      }

      if (text === '/status') {
        const teknisiProfile = await prisma.teknisiProfile.findFirst({
          where: { telegramChatId: String(chatId) },
          include: { user: true },
        })

        const adminUser = teknisiProfile
          ? null
          : await prisma.user.findFirst({
              where: {
                telegramChatId: String(chatId),
                role: { in: ['ADMIN', 'USER'] },
              },
            })

        const linkedUser = teknisiProfile?.user ?? adminUser

        if (!linkedUser) {
          await sendTelegramMessage(
            chatId,
            '❌ Akun Telegram Anda belum terhubung dengan Bantoo.\n\nSilakan hubungkan dari dashboard.',
          )
        } else {
          const tgUsername =
            teknisiProfile?.telegramUsername ?? adminUser?.telegramUsername ?? null
          const tgLine = tgUsername ? `\n📱 Telegram: @${tgUsername}` : ''
          const roleLabel =
            linkedUser.role === 'ADMIN'
              ? 'Admin'
              : linkedUser.role === 'TEKNISI'
                ? 'Teknisi'
                : 'User'

          await sendTelegramMessage(
            chatId,
            `
✅ *Akun Terhubung*

👤 Nama: ${linkedUser.name}
📧 Email: ${linkedUser.email}
🏷 Role: ${roleLabel}${tgLine}

Anda akan menerima notifikasi untuk event penting di platform.
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
