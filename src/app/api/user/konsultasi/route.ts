import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import { findConsultationService } from '@/lib/konsultasi-services'
import { holdUserForKonsultasi } from '@/lib/konsultasi-wallet'
import { getPublicFeatureFlags } from '@/lib/platform-settings'
import { getPaymentGatewayProvider, KONSULTASI_PAYMENT_TTL_MS } from '@/lib/payment-gateway'
import { walletTransaction } from '@/lib/wallet/transaction'
import { serializeUserKonsultasi } from '@/lib/user-konsultasi-serializer'
import { notifyKonsultasiNew } from '@/lib/telegram/notify'

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

function appBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) return env
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

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
      const flags = await getPublicFeatureFlags()
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
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    const balance = wallet?.balance ?? new Prisma.Decimal(0)
    const canHold = wallet != null && balance.greaterThanOrEqualTo(amount)

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'USER' as const,
    }
    const teknisiLabel = profile.user.name ?? 'Teknisi'

    if (canHold) {
      const created = await walletTransaction(async (tx) => {
        const sessionRow = await tx.konsultasiSession.create({
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
            status: 'PENDING',
            paymentMethod: 'WALLET_HOLD',
            paymentStatus: 'SECURED',
            paidAt: new Date(),
          },
          include: { teknisi: { select: TEKNISI_SELECT } },
        })

        await holdUserForKonsultasi(
          tx,
          session.user.id,
          amount,
          sessionRow.id,
          `Hold konsultasi: ${matched.name}`,
        )

        return sessionRow
      })

      void logPaymentEvent({
        action: 'konsultasi.payment',
        severity: 'SUCCESS',
        summary: `Hold saldo konsultasi ${matched.name} — ${teknisiLabel}`,
        actor,
        target: { type: 'konsultasi', id: created.id, label: matched.name },
      })

      void logCommunicationEvent({
        action: 'konsultasi.created',
        severity: 'INFO',
        summary: `Konsultasi baru: ${matched.name} — ${teknisiLabel}`,
        actor,
        target: { type: 'konsultasi', id: created.id, label: matched.name },
      })

      void notifyKonsultasiNew(created.id)

      return apiSuccess(
        {
          ...serializeUserKonsultasi(created),
          needsPayment: false,
        },
        201,
      )
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
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'PAYMENT_GATEWAY',
        paymentStatus: 'UNPAID',
        paymentExpiresAt,
      },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })

    const pg = getPaymentGatewayProvider()
    const payment = await pg.createPayment({
      sessionId: pendingSession.id,
      amount: price,
      userId: session.user.id,
      description: `Konsultasi: ${matched.name}`,
      returnUrl: `${appBaseUrl(req)}/user/konsultasi?paySession=${pendingSession.id}`,
    })

    await prisma.konsultasiSession.update({
      where: { id: pendingSession.id },
      data: {
        pgProvider: payment.provider,
        pgExternalRef: payment.externalRef,
        paymentExpiresAt: payment.expiresAt,
      },
    })

    const refreshed = await prisma.konsultasiSession.findUniqueOrThrow({
      where: { id: pendingSession.id },
      include: { teknisi: { select: TEKNISI_SELECT } },
    })

    return apiSuccess(
      {
        ...serializeUserKonsultasi(refreshed),
        needsPayment: true,
        redirectUrl: payment.redirectUrl,
        pgExternalRef: payment.externalRef,
      },
      201,
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup')
    }
    console.error('[USER_KONSULTASI_POST]', e)
    return apiError('Gagal memesan konsultasi', 500)
  }
}
