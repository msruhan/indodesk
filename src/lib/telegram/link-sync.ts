import 'server-only'

import { createHash } from 'node:crypto'
import { prisma } from '@/lib/db'
import { linkTeknisiTelegramAccount } from '@/lib/telegram/link-account'
import type { TelegramUpdate } from '@/lib/telegram'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

function hashToken(token: string): string {
  return createHash('sha256').update(token.trim(), 'utf8').digest('hex')
}

async function fetchPendingUpdates(): Promise<TelegramUpdate[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!botToken) return []

  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/getUpdates?timeout=0&allowed_updates=${encodeURIComponent(JSON.stringify(['message']))}`,
      { cache: 'no-store' },
    )
    const data = (await res.json()) as { ok?: boolean; result?: TelegramUpdate[] }
    if (!res.ok || !data.ok || !Array.isArray(data.result)) return []
    return data.result
  } catch (e) {
    console.error('[Telegram] getUpdates failed:', e)
    return []
  }
}

/**
 * Fallback linking saat webhook belum menerima update — poll getUpdates untuk /start TOKEN.
 */
export async function syncTelegramLinkFromUpdates(
  userId: string,
  token: string,
): Promise<{ linked: boolean; username?: string | null; error?: string }> {
  const trimmed = token.trim()
  if (!trimmed) {
    return { linked: false, error: 'Token kosong' }
  }

  const tokenHash = hashToken(trimmed)
  const row = await prisma.telegramLinkToken.findUnique({
    where: { tokenHash },
    select: { userId: true, usedAt: true, expiresAt: true },
  })

  if (!row || row.userId !== userId) {
    return { linked: false, error: 'Token tidak valid untuk akun ini' }
  }
  if (row.usedAt) {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId },
      select: { telegramUsername: true, telegramChatId: true },
    })
    if (profile?.telegramChatId) {
      return { linked: true, username: profile.telegramUsername }
    }
  }
  if (row.expiresAt < new Date()) {
    return { linked: false, error: 'Token kedaluwarsa — buat link baru' }
  }

  const updates = await fetchPendingUpdates()
  const prefix = `/start ${trimmed}`

  for (const update of updates) {
    const text = update.message?.text?.trim()
    if (!text || !text.startsWith('/start')) continue
    if (text !== prefix && text !== `/start ${trimmed}`) continue

    const chatId = update.message?.chat.id
    const from = update.message?.from
    if (!chatId || !from) continue

    const result = await linkTeknisiTelegramAccount({
      token: trimmed,
      chatId,
      username: from.username ?? null,
    })

    if (result.ok) {
      return { linked: true, username: result.username }
    }
    if (result.reason === 'invalid_token') {
      const profile = await prisma.teknisiProfile.findUnique({
        where: { userId },
        select: { telegramUsername: true, telegramChatId: true },
      })
      if (profile?.telegramChatId) {
        return { linked: true, username: profile.telegramUsername }
      }
      return { linked: false, error: 'Token sudah dipakai atau kedaluwarsa' }
    }
    if (result.reason === 'no_profile') {
      return { linked: false, error: 'Profil teknisi tidak ditemukan' }
    }
  }

  return { linked: false }
}
