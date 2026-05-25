import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  holdRekberFunds,
  refundRekberToBuyer,
  releaseRekberToSeller,
} from '@/lib/rekber-wallet'
import { serializeRekber, type RekberParty } from '@/lib/rekber-serializer'

export const dynamic = 'force-dynamic'

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Record<keyof RekberParty, true>

const patchSchema = z.object({
  action: z.enum(['fund', 'release', 'dispute', 'cancel']),
  note: z.string().max(500).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.rekberTransaction.findFirst({
      where: {
        id,
        OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
      },
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
      },
    })
    if (!row) return apiError('Rekber tidak ditemukan', 404)

    return apiSuccess(
      serializeRekber(row, {
        viewerId: session.user.id,
        viewerRole: session.user.role,
      }),
    )
  } catch (e) {
    console.error('[REKBER_DETAIL_GET]', e)
    return apiError('Gagal memuat detail rekber', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Aksi tidak valid')
  }

  try {
    const existing = await prisma.rekberTransaction.findUnique({
      where: { id },
      include: {
        buyer: { select: PARTY_SELECT },
        seller: { select: PARTY_SELECT },
      },
    })
    if (!existing) return apiError('Rekber tidak ditemukan', 404)

    const isBuyer = session.user.id === existing.buyerId
    const isSeller = session.user.id === existing.sellerId
    if (!isBuyer && !isSeller) {
      return apiError('Akses ditolak', 403)
    }

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    }

    const amount = existing.amount
    const fee = existing.fee
    const totalHold = amount.add(fee)

    if (parsed.data.action === 'fund') {
      if (!isBuyer) return apiError('Hanya pembeli yang dapat membayar')
      if (existing.status !== 'PENDING') {
        return apiError('Rekber sudah dibayar atau tidak dapat dibayar')
      }

      const updated = await prisma.$transaction(async (tx) => {
        await holdRekberFunds(tx, existing.buyerId, totalHold, id, existing.orderCode)
        return tx.rekberTransaction.update({
          where: { id },
          data: { status: 'HELD', heldAt: new Date() },
          include: {
            buyer: { select: PARTY_SELECT },
            seller: { select: PARTY_SELECT },
          },
        })
      })

      void logPaymentEvent({
        action: 'rekber.funded',
        severity: 'SUCCESS',
        summary: `Rekber ${existing.orderCode} didanai — ${Number(totalHold).toLocaleString('id-ID')} IDR`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeRekber(updated, {
          viewerId: session.user.id,
          viewerRole: session.user.role,
        }),
      )
    }

    if (parsed.data.action === 'release') {
      if (!isBuyer) return apiError('Hanya pembeli yang dapat melepas dana')
      if (existing.status !== 'HELD') {
        return apiError('Dana belum ditahan atau sudah diproses')
      }

      const updated = await prisma.$transaction(async (tx) => {
        await releaseRekberToSeller(
          tx,
          existing.sellerId,
          amount,
          id,
          existing.orderCode,
        )
        return tx.rekberTransaction.update({
          where: { id },
          data: { status: 'RELEASED', releasedAt: new Date() },
          include: {
            buyer: { select: PARTY_SELECT },
            seller: { select: PARTY_SELECT },
          },
        })
      })

      void logPaymentEvent({
        action: 'rekber.released',
        severity: 'SUCCESS',
        summary: `Rekber ${existing.orderCode} selesai — dana ke ${existing.seller.name}`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeRekber(updated, {
          viewerId: session.user.id,
          viewerRole: session.user.role,
        }),
      )
    }

    if (parsed.data.action === 'dispute') {
      if (!isBuyer && !isSeller) return apiError('Akses ditolak', 403)
      if (existing.status !== 'HELD') {
        return apiError('Dispute hanya untuk transaksi dengan dana ditahan')
      }

      const updated = await prisma.rekberTransaction.update({
        where: { id },
        data: {
          status: 'DISPUTED',
          disputedAt: new Date(),
          note: parsed.data.note?.trim() || existing.note,
        },
        include: {
          buyer: { select: PARTY_SELECT },
          seller: { select: PARTY_SELECT },
        },
      })

      void logOrderEvent({
        action: 'rekber.disputed',
        severity: 'WARNING',
        summary: `Dispute rekber ${existing.orderCode}`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeRekber(updated, {
          viewerId: session.user.id,
          viewerRole: session.user.role,
        }),
      )
    }

    if (parsed.data.action === 'cancel') {
      if (!isBuyer) return apiError('Hanya pembeli yang dapat membatalkan')
      if (existing.status !== 'PENDING') {
        return apiError('Hanya rekber menunggu pembayaran yang bisa dibatalkan')
      }

      const updated = await prisma.rekberTransaction.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          note: 'Dibatalkan sebelum pembayaran',
        },
        include: {
          buyer: { select: PARTY_SELECT },
          seller: { select: PARTY_SELECT },
        },
      })

      void logOrderEvent({
        action: 'rekber.cancelled',
        severity: 'INFO',
        summary: `Rekber ${existing.orderCode} dibatalkan`,
        actor,
        target: { type: 'rekber', id, label: existing.orderCode },
      })

      return apiSuccess(
        serializeRekber(updated, {
          viewerId: session.user.id,
          viewerRole: session.user.role,
        }),
      )
    }

    return apiError('Aksi tidak dikenali')
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup. Top-up dulu ya.', 402)
    }
    if (e instanceof Error && e.message === 'WALLET_NOT_FOUND') {
      return apiError('Wallet tidak ditemukan', 400)
    }
    console.error('[REKBER_PATCH]', e)
    return apiError('Gagal memperbarui rekber', 500)
  }
}
