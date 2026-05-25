import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import { findConsultationService } from '@/lib/konsultasi-services'
import { debitUserForKonsultasi } from '@/lib/konsultasi-wallet'
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

  const { teknisiId, service, price, note } = parsed.data

  if (teknisiId === session.user.id) {
    return apiError('Tidak dapat memesan konsultasi ke diri sendiri')
  }

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: teknisiId },
      include: { user: { select: TEKNISI_SELECT } },
    })

    if (!profile || !profile.isVerified) {
      return apiError('Teknisi tidak tersedia untuk konsultasi', 404)
    }

    const matched = findConsultationService(profile, service, price)
    if (!matched) {
      return apiError('Layanan atau harga tidak valid')
    }

    const pendingDuplicate = await prisma.konsultasiSession.findFirst({
      where: {
        userId: session.user.id,
        teknisiId,
        status: 'PENDING',
      },
    })
    if (pendingDuplicate) {
      return apiError('Anda masih memiliki konsultasi menunggu dengan teknisi ini')
    }

    const serviceLabel = note?.trim()
      ? `${matched.name} — ${note.trim()}`
      : matched.name

    const amount = new Prisma.Decimal(price)

    const created = await prisma.$transaction(async (tx) => {
      const sessionRow = await tx.konsultasiSession.create({
        data: {
          userId: session.user.id,
          teknisiId,
          service: serviceLabel,
          price: amount,
          status: 'PENDING',
        },
        include: { teknisi: { select: TEKNISI_SELECT } },
      })

      await debitUserForKonsultasi(
        tx,
        session.user.id,
        amount,
        sessionRow.id,
        `Konsultasi: ${serviceLabel}`,
      )

      return sessionRow
    })

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'USER' as const,
    }
    const teknisiLabel = profile.user.name ?? 'Teknisi'

    void logPaymentEvent({
      action: 'konsultasi.payment',
      severity: 'SUCCESS',
      summary: `Pembayaran konsultasi ${serviceLabel} — ${teknisiLabel}`,
      actor,
      target: { type: 'konsultasi', id: created.id, label: serviceLabel },
    })

    void logCommunicationEvent({
      action: 'konsultasi.created',
      severity: 'INFO',
      summary: `Konsultasi baru: ${serviceLabel} — ${teknisiLabel}`,
      actor,
      target: { type: 'konsultasi', id: created.id, label: serviceLabel },
    })

    return apiSuccess(serializeUserKonsultasi(created), 201)
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup. Top-up dulu ya.', 402)
    }
    if (e instanceof Error && e.message === 'WALLET_NOT_FOUND') {
      return apiError('Wallet tidak ditemukan', 400)
    }
    console.error('[USER_KONSULTASI_POST]', e)
    return apiError('Gagal membuat konsultasi', 500)
  }
}
