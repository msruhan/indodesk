import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    account: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/auth/google-link-cookie', () => ({
  readGoogleLinkIntentUserId: vi.fn(),
}))

vi.mock('@/lib/auth/google-register-cookie', () => ({
  readGoogleRegisterIntent: vi.fn(),
}))

vi.mock('@/lib/auth/google-oauth-registration', () => ({
  isEligibleForGoogleRegister: vi.fn(),
}))

vi.mock('@/lib/coming-soon-server', () => ({
  isComingSoonEnabled: vi.fn().mockResolvedValue(false),
}))

import { prisma } from '@/lib/db'
import { readGoogleLinkIntentUserId } from '@/lib/auth/google-link-cookie'
import { readGoogleRegisterIntent } from '@/lib/auth/google-register-cookie'
import { isEligibleForGoogleRegister } from '@/lib/auth/google-oauth-registration'
import { evaluateGoogleSignIn } from '@/lib/auth/google-oauth-policy'

const dbUser = {
  id: 'user-1',
  email: 'test@example.com',
  isActive: true,
  role: 'USER' as const,
  twoFactorEnabled: false,
  password: 'hashed',
  createdAt: new Date(),
  teknisiProfile: null,
}

describe('evaluateGoogleSignIn', () => {
  beforeEach(() => {
    vi.mocked(readGoogleLinkIntentUserId).mockResolvedValue(null)
    vi.mocked(readGoogleRegisterIntent).mockResolvedValue(null)
    vi.mocked(isEligibleForGoogleRegister).mockResolvedValue(true)
    vi.mocked(prisma.user.findUnique).mockReset()
    vi.mocked(prisma.account.findFirst).mockReset()
  })

  it('menolak email yang belum terdaftar', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await evaluateGoogleSignIn({
      userId: 'temp-id',
      email: 'baru@gmail.com',
    })
    expect(result).toEqual({ ok: false, error: 'not_registered' })
  })

  it('mengizinkan pendaftaran user saat intent register', async () => {
    vi.mocked(readGoogleRegisterIntent).mockResolvedValue('USER')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await evaluateGoogleSignIn({
      email: 'baru@gmail.com',
    })
    expect(result).toEqual({ ok: true, mode: 'register', role: 'USER' })
  })

  it('menolak pendaftaran jika email sudah terdaftar', async () => {
    vi.mocked(readGoogleRegisterIntent).mockResolvedValue('USER')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser)
    vi.mocked(isEligibleForGoogleRegister).mockResolvedValue(false)
    const result = await evaluateGoogleSignIn({
      email: dbUser.email,
    })
    expect(result).toEqual({ ok: false, error: 'email_already_registered' })
  })

  it('menolak login google jika belum dihubungkan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser)
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)
    const result = await evaluateGoogleSignIn({
      userId: dbUser.id,
      email: dbUser.email,
      providerAccountId: 'google-sub',
    })
    expect(result).toEqual({ ok: false, error: 'google_not_linked' })
  })

  it('mengizinkan login jika google sudah terhubung', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser)
    vi.mocked(prisma.account.findFirst).mockResolvedValue({
      id: 'acc-1',
      userId: dbUser.id,
      provider: 'google',
      providerAccountId: 'google-sub',
    } as never)
    const result = await evaluateGoogleSignIn({
      userId: dbUser.id,
      email: dbUser.email,
      providerAccountId: 'google-sub',
    })
    expect(result).toEqual({ ok: true, mode: 'login' })
  })

  it('mengizinkan proses link saat intent cookie cocok', async () => {
    vi.mocked(readGoogleLinkIntentUserId).mockResolvedValue(dbUser.id)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...dbUser, password: 'hashed' })
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)
    const result = await evaluateGoogleSignIn({
      userId: 'temp-id',
      email: dbUser.email,
    })
    expect(result).toEqual({ ok: true, mode: 'link' })
  })
})
