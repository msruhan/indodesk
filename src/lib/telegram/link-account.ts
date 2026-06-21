import 'server-only'

import { prisma } from '@/lib/db'
import { consumeTelegramLinkToken } from '@/lib/telegram/link-token'
import { sendTelegramMessage, TelegramNotificationTemplates } from '@/lib/telegram'

export type TelegramLinkResult =
  | { ok: true; username: string | null }
  | { ok: false; reason: 'invalid_token' | 'no_profile' | 'unsupported_role' | 'send_failed' }

export type TelegramLinkSnapshot = {
  isLinked: boolean
  username: string | null
  linkedAt: Date | null
}

function normalizeTelegramUsername(username?: string | null): string | null {
  return username?.replace(/^@/, '').trim() || null
}

/** Snapshot koneksi Telegram berdasarkan role user. */
export async function getTelegramLinkSnapshot(userId: string): Promise<TelegramLinkSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      teknisiProfile: {
        select: {
          telegramChatId: true,
          telegramUsername: true,
          telegramLinkedAt: true,
        },
      },
    },
  })

  if (!user) return null

  if (user.role === 'TEKNISI') {
    if (!user.teknisiProfile) return null
    const profile = user.teknisiProfile
    return {
      isLinked: Boolean(profile.telegramChatId),
      username: profile.telegramUsername,
      linkedAt: profile.telegramLinkedAt,
    }
  }

  if (user.role === 'ADMIN' || user.role === 'USER') {
    return {
      isLinked: Boolean(user.telegramChatId),
      username: user.telegramUsername,
      linkedAt: user.telegramLinkedAt,
    }
  }

  return null
}

/** Hubungkan chat Telegram ke akun (teknisi profil atau user langsung untuk admin/user). */
export async function linkTelegramAccount(opts: {
  token: string
  chatId: number | string
  username?: string | null
}): Promise<TelegramLinkResult> {
  const userId = await consumeTelegramLinkToken(opts.token)
  if (!userId) {
    return { ok: false, reason: 'invalid_token' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  })

  if (!user) {
    return { ok: false, reason: 'invalid_token' }
  }

  const chatId = String(opts.chatId)
  const telegramUsername = normalizeTelegramUsername(opts.username)
  const linkedAt = new Date()

  if (user.role === 'TEKNISI') {
    const profile = await prisma.teknisiProfile.findUnique({ where: { userId } })
    if (!profile) {
      return { ok: false, reason: 'no_profile' }
    }

    await prisma.teknisiProfile.update({
      where: { userId },
      data: {
        telegramChatId: chatId,
        telegramUsername,
        telegramLinkedAt: linkedAt,
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { telegramLinkedAt: linkedAt },
    })
  } else if (user.role === 'ADMIN' || user.role === 'USER') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: chatId,
        telegramUsername,
        telegramLinkedAt: linkedAt,
      },
    })
  } else {
    return { ok: false, reason: 'unsupported_role' }
  }

  const welcomeMessage = TelegramNotificationTemplates.accountLinked(user.name)
  const sent = await sendTelegramMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })
  if (!sent.success) {
    console.warn('[Telegram] Welcome message failed after link:', sent.error)
  }

  return { ok: true, username: telegramUsername }
}

/** @deprecated Alias untuk linkTelegramAccount — tetap dipakai webhook lama. */
export async function linkTeknisiTelegramAccount(opts: {
  token: string
  chatId: number | string
  username?: string | null
}): Promise<TelegramLinkResult> {
  return linkTelegramAccount(opts)
}

export async function unlinkTelegramAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.role === 'TEKNISI') {
    await prisma.teknisiProfile.updateMany({
      where: { userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
      },
    })
    await prisma.user.update({
      where: { id: userId },
      data: { telegramLinkedAt: null },
    })
    return
  }

  if (user.role === 'ADMIN' || user.role === 'USER') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
        telegramUserId: null,
      },
    })
  }
}
