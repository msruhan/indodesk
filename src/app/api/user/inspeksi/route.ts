import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  calculateInspectionFees,
  generateInspectionOrderCode,
  getInspectionBasePrice,
} from '@/lib/inspection-pricing'
import { debitUserForInspection } from '@/lib/inspection-wallet'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import { notifyInspeksiNew } from '@/lib/telegram/notify'
import { createInspectionSchema } from '@/lib/validations/inspection'
import { getPublicFeatureFlags } from '@/lib/platform-settings'

export const dynamic = 'force-dynamic'

const TEKNISI_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

const includeOrder = {
  teknisi: { select: TEKNISI_SELECT },
  report: true,
  rekber: true,
} as const

export async function GET() {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  try {
    const rows = await prisma.inspectionOrder.findMany({
      where: { userId: session.user.id },
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(rows.map((r) => serializeInspectionOrder(r, 'USER')))
  } catch (e) {
    console.error('[USER_INSPEKSI_GET]', e)
    return apiError('Gagal memuat inspeksi', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const flags = await getPublicFeatureFlags()
  if (!flags.inspectionServiceEnabled) {
    return apiError('Layanan inspeksi sedang tidak tersedia', 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = createInspectionSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const data = parsed.data
  if (data.teknisiId === session.user.id) {
    return apiError('Tidak dapat memesan inspeksi ke diri sendiri')
  }

  try {
    const profile = await prisma.teknisiProfile.findUnique({
      where: { userId: data.teknisiId },
      include: { user: { select: TEKNISI_SELECT } },
    })
    if (!profile?.isVerified || profile.verificationStatus !== 'APPROVED') {
      return apiError('Teknisi tidak tersedia untuk inspeksi', 404)
    }

    const basePrice = getInspectionBasePrice(data.mode, data.category)
    const fees = calculateInspectionFees(basePrice)
    const amount = new Prisma.Decimal(fees.price)

    const orderCode = generateInspectionOrderCode()
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.inspectionOrder.create({
        data: {
          orderCode,
          userId: session.user.id,
          teknisiId: data.teknisiId,
          mode: data.mode,
          category: data.category,
          status: 'PAID',
          productId: data.productId?.trim() || null,
          productName: data.productName.trim(),
          productBrand: '',
          productModel: '',
          productSource: data.productSource,
          productSourceUrl: data.productSourceUrl?.trim() || null,
          sellerContact: null,
          notes: data.notes?.trim() || null,
          location: data.location?.trim() || null,
          city: data.city?.trim() || null,
          scheduledAt,
          price: amount,
          platformFee: new Prisma.Decimal(fees.platformFee),
          teknisiEarning: new Prisma.Decimal(fees.teknisiEarning),
        },
        include: includeOrder,
      })

      await debitUserForInspection(
        tx,
        session.user.id,
        amount,
        row.id,
        `Inspeksi: ${row.productName}`,
      )

      return row
    })

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: 'USER' as const,
    }

    void logPaymentEvent({
      action: 'inspection.payment',
      severity: 'SUCCESS',
      summary: `Pembayaran inspeksi ${orderCode}`,
      actor,
      target: { type: 'inspection', id: created.id, label: created.productName },
    })

    void logCommunicationEvent({
      action: 'inspection.created',
      severity: 'INFO',
      summary: `Permintaan inspeksi baru: ${created.productName}`,
      actor,
      target: { type: 'inspection', id: created.id, label: orderCode },
    })

    void notifyInspeksiNew(created.id)

    return apiSuccess(serializeInspectionOrder(created, 'USER'), 201)
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup. Top-up dulu ya.', 402)
    }
    if (e instanceof Error && e.message === 'WALLET_NOT_FOUND') {
      return apiError('Wallet tidak ditemukan', 400)
    }
    console.error('[USER_INSPEKSI_POST]', e)
    return apiError('Gagal membuat permintaan inspeksi', 500)
  }
}
