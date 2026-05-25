import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import { creditTeknisiForInspection, refundUserForInspection } from '@/lib/inspection-wallet'

export const dynamic = 'force-dynamic'

const includeOrder = {
  user: { select: { id: true, name: true, email: true, image: true } },
  teknisi: { select: { id: true, name: true, email: true, image: true } },
  report: true,
} as const

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const rows = await prisma.inspectionOrder.findMany({
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const stats = {
      total: rows.length,
      paid: rows.filter((r) => r.status === 'PAID').length,
      inProgress: rows.filter((r) =>
        ['ACCEPTED', 'IN_PROGRESS', 'REPORT_SUBMITTED'].includes(r.status),
      ).length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
      disputed: rows.filter((r) => r.status === 'DISPUTED').length,
    }

    return apiSuccess({
      stats,
      items: rows.map((r) => serializeInspectionOrder(r, 'ADMIN')),
    })
  } catch (e) {
    console.error('[ADMIN_INSPEKSI_GET]', e)
    return apiError('Gagal memuat data inspeksi', 500)
  }
}

export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Body tidak valid')
  }

  const action = (body as { action?: string }).action
  const id = String((body as { id?: string }).id ?? '')

  if (!id || !['resolve_refund', 'resolve_complete'].includes(action ?? '')) {
    return apiError('Data tidak valid')
  }

  try {
    const existing = await prisma.inspectionOrder.findUnique({ where: { id } })
    if (!existing) return apiError('Order tidak ditemukan', 404)
    if (existing.status !== 'DISPUTED') {
      return apiError('Hanya order sengketa yang bisa diselesaikan admin')
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === 'resolve_refund') {
        const row = await tx.inspectionOrder.update({
          where: { id },
          data: { status: 'CANCELLED', completedAt: new Date() },
          include: includeOrder,
        })
        const alreadyRefunded = await tx.walletLedger.findFirst({
          where: { type: 'REFUND', referenceId: id, wallet: { userId: existing.userId } },
        })
        if (!alreadyRefunded) {
          await refundUserForInspection(
            tx,
            existing.userId,
            existing.price,
            id,
            `Refund inspeksi (sengketa): ${existing.productName}`,
          )
        }
        return row
      }

      const row = await tx.inspectionOrder.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: includeOrder,
      })
      const alreadyCredited = await tx.walletLedger.findFirst({
        where: { type: 'EARNING', referenceId: id, wallet: { userId: existing.teknisiId } },
      })
      if (!alreadyCredited) {
        await creditTeknisiForInspection(
          tx,
          existing.teknisiId,
          existing.teknisiEarning,
          id,
          `Payout inspeksi (admin): ${existing.productName}`,
        )
      }
      return row
    })

    return apiSuccess(serializeInspectionOrder(updated, 'ADMIN'))
  } catch (e) {
    console.error('[ADMIN_INSPEKSI_POST]', e)
    return apiError('Gagal menyelesaikan sengketa', 500)
  }
}
