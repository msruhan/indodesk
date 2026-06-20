import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { findConsultationService } from '@/lib/konsultasi-services'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { calculateKonsultasiFees } from '@/lib/service-platform-fees-server'
import { KONSULTASI_PAYMENT_TTL_MS } from '@/lib/payment-gateway'
import { getTripayConfig } from '@/lib/tripay/config'
import { serializeUserKonsultasi } from '@/lib/user-konsultasi-serializer'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const createSchema = z.object({
  teknisiId: z.string().min(1),
  service: z.string().min(2).max(200),
  price: z.number().int().positive(),
  note: z.string().max(500).optional(),
  device: z.string().min(1, 'Perangkat wajib diisi').max(120),
  clientOs: z.enum(['WINDOWS', 'MACOS']),
  remoteId: z.string().min(6).max(32).optional(),
  remoteOtp: z.string().min(4).max(32).optional(),
})

export async function GET() {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  try {
    const rows = await prisma.konsultasiSession.findMany({
      where: { userId: session.user.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(rows.map(serializeUserKonsultasi))
  } catch (e) {
    console.error('[USER_KONSULTASI_GET]', e)
    return apiError('Gagal memuat konsultasi', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const { teknisiId, service, price, note, device, clientOs, remoteId, remoteOtp } = parsed.data

  if (teknisiId === session.user.id) {
    return apiError('Tidak dapat memesan konsultasi ke diri sendiri')
  }

  const flags = await getPublicFeatureFlags()
  if (!flags.konsultasiServiceEnabled) {
    return apiError('Layanan konsultasi sedang dinonaktifkan', 403)
  }

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      include: { user: { select: TEKNISI_SELECT } },
    })

    if (!profile) {
      return apiError('Teknisi tidak ditemukan', 404)
    }
    if (!profile.isVerified) {
      return apiError('Teknisi tidak tersedia untuk konsultasi', 404)
    }

    const matched = findConsultationService(profile, service, price)
    if (!matched) {
      return apiError('Layanan atau harga tidak valid')
    }

    if (matched.requiresRemote) {
      if (!flags.remoteServiceEnabled) {
        return apiError('Konsultasi remote (IndoDesk) sedang tidak tersedia', 403)
      }
      if (!remoteId?.trim()) {
        return apiError('IndoDesk ID wajib untuk layanan remote')
      }
      if (!remoteOtp?.trim()) {
        return apiError('OTP IndoDesk wajib untuk layanan remote')
      }
    }

    const openDuplicate = await prisma.konsultasiSession.findFirst({
      where: {
        userId: session.user.id,
        teknisiId,
        status: { in: ['PENDING', 'ACTIVE', 'AWAITING_PAYMENT'] },
      },
    })
    if (openDuplicate) {
      return apiError('Anda masih memiliki konsultasi aktif dengan teknisi ini')
    }

    const amount = new Prisma.Decimal(price)
    const fees = await calculateKonsultasiFees(price)

    if (!getTripayConfig().isConfigured) {
      return apiError('Metode pembayaran belum tersedia. Hubungi admin.', 503)
    }

    const paymentExpiresAt = new Date(Date.now() + KONSULTASI_PAYMENT_TTL_MS)
    const pendingSession = await prisma.konsultasiSession.create({
      data: {
        userId: session.user.id,
        teknisiId,
        service: matched.name,
        note: note?.trim() || null,
        device: device.trim(),
        clientOs,
        requiresRemote: matched.requiresRemote,
        remoteId: matched.requiresRemote ? remoteId!.trim() : null,
        remoteOtp: matched.requiresRemote ? remoteOtp!.trim() : null,
        price: amount,
        platformFee: new Prisma.Decimal(fees.platformFee),
        teknisiEarning: new Prisma.Decimal(fees.teknisiEarning),
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'PAYMENT_GATEWAY',
        paymentStatus: 'UNPAID',
        paymentExpiresAt,
      },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })

    return apiSuccess(
      {
        ...serializeUserKonsultasi(pendingSession),
        needsPayment: true,
        paymentGateway: 'tripay',
        sessionId: pendingSession.id,
      },
      201,
    )
  } catch (e) {
    console.error('[USER_KONSULTASI_POST]', e)
    return apiError('Gagal memesan konsultasi', 500)
  }
}
