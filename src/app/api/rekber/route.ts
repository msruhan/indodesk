import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth, requireApiRole } from '@/lib/api-auth'
import { logPaymentEvent, logOrderEvent } from '@/lib/activity-log'
import { calculateRekberFee, generateRekberOrderCode } from '@/lib/rekber-config'
import { holdRekberFunds } from '@/lib/rekber-wallet'
import {
  buildRekberStats,
  serializeRekber,
} from '@/lib/rekber-serializer'
import { REKBER_INCLUDE } from '@/lib/rekber-includes'
import { requireEmailVerifiedUser } from '@/lib/require-email-verified'

export const dynamic = 'force-dynamic'

const createSchema = z
  .object({
    sellerId: z.string().min(1).optional(),
    sellerEmail: z.string().email().optional(),
    amount: z.number().int().positive(),
    description: z.string().min(5).max(2000),
  })
  .refine((d) => Boolean(d.sellerId?.trim() || d.sellerEmail?.trim()), {
    message: 'Penjual wajib dipilih (sellerId atau sellerEmail)',
  })

export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const rows = await prisma.rekberTransaction.findMany({
      where: {
        OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
      },
      include: REKBER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    const items = rows.map((r) =>
      serializeRekber(r, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
      }),
    )

    return apiSuccess({ items, stats: buildRekberStats(items) })
  } catch (e) {
    console.error('[REKBER_GET]', e)
    return apiError('Gagal memuat rekber', 500)
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI'])
  if (error) return error

  const emailGate = await requireEmailVerifiedUser(session.user.id)
  if (!emailGate.ok) return emailGate.error

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

  const { amount, description } = parsed.data
  let sellerId = parsed.data.sellerId?.trim() ?? ''

  if (parsed.data.sellerEmail) {
    const byEmail = await prisma.user.findUnique({
      where: { email: parsed.data.sellerEmail.trim().toLowerCase() },
      select: { id: true },
    })
    if (!byEmail) return apiError('Seller tidak ditemukan', 404)
    sellerId = byEmail.id
  }

  if (!sellerId) {
    return apiError('Penjual tidak ditemukan', 404)
  }

  if (sellerId === session.user.id) {
    return apiError('Tidak dapat membuat rekber dengan diri sendiri sebagai penjual')
  }

  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, role: true },
    })
    if (!seller) return apiError('Seller tidak ditemukan', 404)

    const fee = calculateRekberFee(amount)
    const orderCode = generateRekberOrderCode()

    const row = await prisma.rekberTransaction.create({
      data: {
        orderCode,
        buyerId: session.user.id,
        sellerId,
        amount: new Prisma.Decimal(amount),
        fee: new Prisma.Decimal(fee),
        description: description.trim(),
        status: 'PENDING',
      },
      include: REKBER_INCLUDE,
    })

    void logOrderEvent({
      action: 'rekber.created',
      severity: 'INFO',
      summary: `Rekber baru ${orderCode}: ${session.user.name} → ${seller.name}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      target: { type: 'rekber', id: row.id, label: orderCode },
    })

    return apiSuccess(
      serializeRekber(row, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
      }),
      201,
    )
  } catch (e) {
    console.error('[REKBER_POST]', e)
    return apiError('Gagal membuat rekber', 500)
  }
}
