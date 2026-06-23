import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IndodeskClientRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { normalizeRustdeskIdForMatch } from '@/lib/indodesk-device'
import { hashIndodeskDeviceToken } from '@/lib/indodesk-device-token'
import { INODESK_UNLOCK_STATUSES } from '@/lib/indodesk-session-policy'

const PAIRING_TTL_MS = 5 * 60 * 1000
const GRANT_TTL_SEC = 2 * 60 * 60

type SessionGrantPayload = {
  sid: string
  uid: string
  tid: string
  rid: string
  otp: string
  exp: number
}

function indodeskSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  return secret
}

function signGrantPayload(encoded: string): string {
  return createHmac('sha256', indodeskSecret()).update(encoded).digest('base64url')
}

export function createIndodeskSessionGrant(input: {
  sessionId: string
  userId: string
  teknisiId: string
  remoteId: string
  remoteOtp: string
}): string {
  const payload: SessionGrantPayload = {
    sid: input.sessionId,
    uid: input.userId,
    tid: input.teknisiId,
    rid: normalizeRustdeskIdForMatch(input.remoteId),
    otp: input.remoteOtp,
    exp: Math.floor(Date.now() / 1000) + GRANT_TTL_SEC,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = signGrantPayload(encoded)
  return `${encoded}.${sig}`
}

export function verifyIndodeskSessionGrant(token: string): SessionGrantPayload | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const expected = signGrantPayload(encoded)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionGrantPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function resolveIndodeskDevice(deviceToken: string) {
  const tokenHash = hashIndodeskDeviceToken(deviceToken)
  return prisma.indodeskDevice.findUnique({ where: { tokenHash } })
}

export type AuthorizeDirection = 'incoming' | 'outgoing'

async function resolveAuthorizeSession(input: {
  deviceUserId: string
  direction: AuthorizeDirection
  grant?: string
}) {
  let session = await prisma.konsultasiSession.findFirst({
    where: {
      status: { in: [...INODESK_UNLOCK_STATUSES] },
      requiresRemote: true,
      remoteId: { not: null },
      remoteOtp: { not: null },
      ...(input.direction === 'outgoing'
        ? { teknisiId: input.deviceUserId }
        : { userId: input.deviceUserId }),
    },
    orderBy: { startedAt: 'desc' },
  })

  if (!session && input.grant) {
    const grant = verifyIndodeskSessionGrant(input.grant)
    if (grant) {
      session = await prisma.konsultasiSession.findFirst({
        where: {
          id: grant.sid,
          status: { in: [...INODESK_UNLOCK_STATUSES] },
          requiresRemote: true,
          remoteOtp: { not: null },
        },
      })
    }
  }

  return session
}

export async function authorizeIndodeskConnection(input: {
  deviceToken: string
  direction: AuthorizeDirection
  peerId: string
  password?: string
  grant?: string
}): Promise<{ allowed: boolean; reason?: string }> {
  const device = await resolveIndodeskDevice(input.deviceToken)
  if (!device) {
    return { allowed: false, reason: 'Perangkat belum terhubung ke akun Bantoo' }
  }

  const peerNorm = normalizeRustdeskIdForMatch(input.peerId)
  const expectedRole: IndodeskClientRole = input.direction === 'outgoing' ? 'TEKNISI' : 'USER'
  if (device.role !== expectedRole) {
    return { allowed: false, reason: 'Peran perangkat tidak sesuai' }
  }

  const session = await resolveAuthorizeSession({
    deviceUserId: device.userId,
    direction: input.direction,
    grant: input.grant,
  })

  if (!session?.remoteId) {
    return { allowed: false, reason: 'Tidak ada sesi konsultasi remote yang aktif' }
  }

  if (input.direction === 'outgoing') {
    const sessionPeer = normalizeRustdeskIdForMatch(session.remoteId)
    if (peerNorm !== sessionPeer) {
      return { allowed: false, reason: 'ID tujuan tidak cocok dengan sesi aktif' }
    }
  }

  if (!session.remoteOtp) {
    return { allowed: false, reason: 'OTP sesi belum tersedia' }
  }

  if (input.direction === 'outgoing') {
    if (device.userId !== session.teknisiId) {
      return { allowed: false, reason: 'Teknisi tidak terdaftar pada sesi ini' }
    }
    if (!input.password) {
      return { allowed: false, reason: 'OTP wajib untuk koneksi keluar' }
    }
    if (input.password !== session.remoteOtp) {
      return { allowed: false, reason: 'OTP tidak valid' }
    }
  }

  if (input.direction === 'incoming') {
    if (device.userId !== session.userId) {
      return { allowed: false, reason: 'User tidak terdaftar pada sesi ini' }
    }
    const teknisiDevice = await prisma.indodeskDevice.findFirst({
      where: {
        userId: session.teknisiId,
        role: 'TEKNISI',
        rustdeskId: peerNorm,
      },
    })
    if (!teknisiDevice) {
      return { allowed: false, reason: 'Teknisi tidak terdaftar pada sesi ini' }
    }
  }

  return { allowed: true }
}

export async function createIndodeskPairingCode(userId: string, role: IndodeskClientRole, code: string) {
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS)
  return prisma.indodeskPairingCode.create({
    data: { userId, role, code, expiresAt },
  })
}

export async function consumeIndodeskPairingCode(code: string) {
  const row = await prisma.indodeskPairingCode.findUnique({ where: { code } })
  if (!row || row.expiresAt < new Date()) return null
  await prisma.indodeskPairingCode.delete({ where: { id: row.id } })
  return row
}

export { generateIndodeskPairingCode } from '@/lib/indodesk-device-token'
