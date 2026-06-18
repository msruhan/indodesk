import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const GOOGLE_LINK_COOKIE = 'google_link_intent'
const MAX_AGE_SECONDS = 600

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  return secret
}

function signPayload(userId: string, expMs: number): string {
  const payload = `${userId}|${expMs}`
  const sig = createHmac('sha256', authSecret()).update(payload).digest('hex')
  return `${payload}|${sig}`
}

function verifySigned(value: string): string | null {
  const parts = value.split('|')
  if (parts.length !== 3) return null
  const [userId, expRaw, sig] = parts
  const expMs = Number(expRaw)
  if (!userId || !Number.isFinite(expMs) || !sig) return null
  if (Date.now() > expMs) return null

  const expected = createHmac('sha256', authSecret())
    .update(`${userId}|${expMs}`)
    .digest('hex')

  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return userId
}

export async function setGoogleLinkIntentCookie(userId: string): Promise<void> {
  const expMs = Date.now() + MAX_AGE_SECONDS * 1000
  const store = await cookies()
  store.set(GOOGLE_LINK_COOKIE, signPayload(userId, expMs), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function readGoogleLinkIntentUserId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(GOOGLE_LINK_COOKIE)?.value
  if (!raw) return null
  return verifySigned(raw)
}

export async function clearGoogleLinkIntentCookie(): Promise<void> {
  const store = await cookies()
  store.delete(GOOGLE_LINK_COOKIE)
}
