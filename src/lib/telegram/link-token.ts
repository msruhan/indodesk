import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

const TOKEN_TTL_MS = 10 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/**
 * Issue a one-time Telegram deep-link token (plaintext returned once to client).
 */
export async function issueTelegramLinkToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  await prisma.telegramLinkToken.deleteMany({
    where: { userId, usedAt: null },
  })

  await prisma.telegramLinkToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  return token
}

/**
 * Atomically consume a link token; returns userId or null if invalid/expired/used.
 */
export async function consumeTelegramLinkToken(token: string): Promise<string | null> {
  const trimmed = token.trim()
  if (!trimmed) return null

  const tokenHash = hashToken(trimmed)
  const now = new Date()

  const row = await prisma.telegramLinkToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  })

  if (!row || row.usedAt || row.expiresAt < now) {
    return null
  }

  const updated = await prisma.telegramLinkToken.updateMany({
    where: {
      id: row.id,
      usedAt: null,
      expiresAt: { gte: now },
    },
    data: { usedAt: now },
  })

  if (updated.count === 0) return null
  return row.userId
}
