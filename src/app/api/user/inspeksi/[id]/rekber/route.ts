import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logOrderEvent } from '@/lib/activity-log'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import {
  INSPECTION_REKBER_LINK_SELECT,
  INSPECTION_USER_ORDER_INCLUDE,
} from '@/lib/inspection-includes'
import { calculateRekberFee, generateRekberOrderCode } from '@/lib/rekber-config'
import { serializeRekber, type RekberParty } from '@/lib/rekber-serializer'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
} satisfies Record<keyof RekberParty, true>

const includeOrder = INSPECTION_USER_ORDER_INCLUDE

const createSchema = z.object({
  amount: z.number().int().min(10000),
  description: z.string().min(5).max(2000).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const { id } = await params

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

  try {
    const inspection = await prisma.inspectionOrder.findFirst({
      where: { id, userId: session.user.id },
      include: { report: true, rekber: { select: INSPECTION_REKBER_LINK_SELECT } },
    })

    if (!inspection) return apiError('Inspeksi tidak ditemukan', 404)
    if (!inspection.report) {
      return apiError('Rekber bundle hanya bisa dibuat setelah laporan inspeksi tersedia', 400)
    }
    if (inspection.rekber) {
      return apiError('Rekber untuk inspeksi ini sudah dibuat', 400)
    }
    if (
      inspection.status !== 'REPORT_SUBMITTED' &&
      inspection.status !== 'COMPLETED'
    ) {
      return apiError('Status inspeksi belum siap untuk rekber', 400)
    }
    if (inspection.report.recommendation === 'NOT_RECOMMENDED') {
      return apiError(
        'Rekber tidak disarankan untuk barang dengan rekomendasi tidak layak beli',
        400,
      )
    }

    const { amount } = parsed.data
    const description =
      parsed.data.description?.trim() ||
      `Rekber pembelian: ${inspection.productName} (pasca inspeksi ${inspection.orderCode})`

    const fee = calculateRekberFee(amount)
    const orderCode = generateRekberOrderCode()

    const rekber = await prisma.rekberTransaction.create({
      data: {
        orderCode,
        buyerId: session.user.id,
        sellerId: inspection.teknisiId,
        amount: new Prisma.Decimal(amount),
        fee: new Prisma.Decimal(fee),
        description,
        status: 'PENDING',
        inspectionOrderId: inspection.id,
      },
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
      },
    })

    const updated = await prisma.inspectionOrder.findUnique({
      where: { id },
      include: includeOrder,
    })

    void logOrderEvent({
      action: 'rekber.bundle_from_inspection',
      severity: 'INFO',
      summary: `Rekber bundle ${orderCode} dari inspeksi ${inspection.orderCode}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'USER',
      },
      target: { type: 'rekber', id: rekber.id, label: orderCode },
    })

    return apiSuccess(
      {
        inspection: updated ? serializeInspectionOrder(updated, 'USER') : null,
        rekber: serializeRekber(rekber, {
          viewerId: session.user.id,
          viewerRole: 'USER',
        }),
      },
      201,
    )
  } catch (e) {
    console.error('[USER_INSPEKSI_REKBER_POST]', e)
    return apiError('Gagal membuat rekber bundle', 500)
  }
}
