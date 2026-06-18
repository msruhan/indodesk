import { z } from 'zod'
import { ShippingCourier } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { logOrderEvent, logPaymentEvent } from '@/lib/activity-log'
import {
  holdRekberFunds,
  releaseRekberToSeller,
} from '@/lib/rekber-wallet'
import { REKBER_INCLUDE } from '@/lib/rekber-includes'
import { serializeRekber } from '@/lib/rekber-serializer'
import { syncRekberTrackingFromBinderbyte } from '@/lib/rekber-tracking-sync'
import { walletTransaction } from '@/lib/wallet/transaction'
import { BinderbyteError, isBinderbyteConfigured } from '@/lib/binderbyte-client'

export const dynamic = 'force-dynamic'

const courierEnum = z.nativeEnum(ShippingCourier)

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('fund'), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('release'), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('cancel'), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('advance') }),
  z.object({
    action: z.literal('set_shipment'),
    courier: courierEnum,
    trackingNumber: z.string().min(5).max(64),
  }),
])

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
      include: REKBER_INCLUDE,
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
      include: REKBER_INCLUDE,
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

      const updated = await walletTransaction(async (tx) => {
        await holdRekberFunds(tx, existing.buyerId, totalHold, id, existing.orderCode)
        return tx.rekberTransaction.update({
          where: { id },
          data: { status: 'HELD', heldAt: new Date() },
          include: REKBER_INCLUDE,
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
      if (existing.status === 'RELEASED' || existing.status === 'REFUNDED') {
        return apiError('State tidak valid', 409, { code: 'INVALID_STATE' })
      }
      if (existing.status !== 'SHIPPED') {
        return apiError('Konfirmasi terima hanya setelah barang dikirim')
      }

      const updated = await walletTransaction(async (tx) => {
        await releaseRekberToSeller(
          tx,
          existing.sellerId,
          amount,
          id,
          existing.orderCode,
        )
        return tx.rekberTransaction.update({
          where: { id },
          data: { status: 'RELEASED', releasedAt: new Date(), trackingActive: false },
          include: REKBER_INCLUDE,
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
        include: REKBER_INCLUDE,
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

    if (parsed.data.action === 'advance') {
      if (!isSeller) return apiError('Hanya penjual yang dapat memproses')
      if (existing.status !== 'HELD') {
        return apiError('Rekber harus dalam status dana ditahan')
      }
      const proof = existing.packagingProof
      if (!proof || proof.status !== 'APPROVED') {
        return apiError('Upload dan tunggu persetujuan bukti packaging terlebih dahulu', 400)
      }

      const updated = await prisma.rekberTransaction.update({
        where: { id },
        data: { status: 'PROCESSING', processedAt: new Date() },
        include: REKBER_INCLUDE,
      })

      void logOrderEvent({
        action: 'rekber.processing',
        severity: 'INFO',
        summary: `Rekber ${existing.orderCode} diproses penjual`,
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

    if (parsed.data.action === 'set_shipment') {
      if (!isSeller) return apiError('Hanya penjual yang dapat input resi')
      if (existing.status !== 'PROCESSING') {
        return apiError('Resi hanya dapat diinput saat rekber sedang diproses')
      }
      if (!isBinderbyteConfigured()) {
        return apiError('Layanan pelacakan resi belum dikonfigurasi di server', 503)
      }

      const { courier, trackingNumber } = parsed.data

      try {
        await syncRekberTrackingFromBinderbyte({
          rekberId: id,
          courier,
          trackingNumber,
          markShipped: true,
        })
      } catch (e) {
        if (e instanceof BinderbyteError) {
          return apiError(e.message, e.code === 'INVALID_AWB' ? 400 : 502)
        }
        throw e
      }

      const updated = await prisma.rekberTransaction.findUnique({
        where: { id },
        include: REKBER_INCLUDE,
      })
      if (!updated) return apiError('Rekber tidak ditemukan', 404)

      void logOrderEvent({
        action: 'rekber.shipment_registered',
        severity: 'INFO',
        summary: `Resi ${trackingNumber} (${courier}) — rekber ${existing.orderCode}`,
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
