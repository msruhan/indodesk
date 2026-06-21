import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const GOOGLE_REGISTER_COOKIE = 'google_register_intent'
export const TEKNISI_REGISTER_COMPLETE_COOKIE = 'teknisi_register_complete'

export type GoogleRegisterRole = 'USER' | 'TEKNISI'

const MAX_AGE_SECONDS = 600

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  return secret
}

function signPayload(payload: string): string {
  const sig = createHmac('sha256', authSecret()).update(payload).digest('hex')
  return `${payload}|${sig}`
}

export async function setGoogleRegisterIntentCookie(role: GoogleRegisterRole): Promise<void> {
  const expMs = Date.now() + MAX_AGE_SECONDS * 1000
  const store = await cookies()
  store.set(GOOGLE_REGISTER_COOKIE, signPayload(`${role}|${expMs}`), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function readGoogleRegisterIntent(): Promise<GoogleRegisterRole | null> {
  const store = await cookies()
  const raw = store.get(GOOGLE_REGISTER_COOKIE)?.value
  if (!raw) return null

  const parts = raw.split('|')
  if (parts.length !== 3) return null
  const [role, expRaw, sig] = parts
  const expMs = Number(expRaw)
  if ((role !== 'USER' && role !== 'TEKNISI') || !Number.isFinite(expMs) || !sig) return null
  if (Date.now() > expMs) return null

  const expected = createHmac('sha256', authSecret())
    .update(`${role}|${expMs}`)
    .digest('hex')

  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return role
}

export async function clearGoogleRegisterIntentCookie(): Promise<void> {
  const store = await cookies()
  store.delete(GOOGLE_REGISTER_COOKIE)
}

export async function setTeknisiRegisterCompleteCookie(userId: string): Promise<void> {
  const expMs = Date.now() + MAX_AGE_SECONDS * 1000
  const store = await cookies()
  store.set(TEKNISI_REGISTER_COMPLETE_COOKIE, signPayload(`${userId}|${expMs}`), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function readTeknisiRegisterCompleteUserId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(TEKNISI_REGISTER_COMPLETE_COOKIE)?.value
  if (!raw) return null

  const parts = raw.split('|')
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

export async function clearTeknisiRegisterCompleteCookie(): Promise<void> {
  const store = await cookies()
  store.delete(TEKNISI_REGISTER_COMPLETE_COOKIE)
}

export function registerErrorPath(role: GoogleRegisterRole | null): string {
  return role === 'TEKNISI' ? '/register/teknisi' : '/register'
}
