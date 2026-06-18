import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logPaymentEvent } from '@/lib/activity-log'
import { creditTeknisiForInspection } from '@/lib/inspection-wallet'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import { INSPECTION_USER_ORDER_INCLUDE } from '@/lib/inspection-includes'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER'])
  if (error) return error

  const { id } = await params
  try {
    const existing = await prisma.inspectionOrder.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return apiError('Inspeksi tidak ditemukan', 404)
    if (existing.status !== 'REPORT_SUBMITTED') {
      return apiError('Laporan belum siap dikonfirmasi')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.inspectionOrder.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: INSPECTION_USER_ORDER_INCLUDE,
      })

      const alreadyCredited = await tx.walletLedger.findFirst({
        where: {
          type: 'EARNING',
          referenceId: id,
          wallet: { userId: existing.teknisiId },
        },
      })
      if (!alreadyCredited) {
        await creditTeknisiForInspection(
          tx,
          existing.teknisiId,
          existing.teknisiEarning,
          id,
          `Pendapatan inspeksi: ${existing.productName}`,
        )
      }

      return row
    })

    void logPaymentEvent({
      action: 'inspection.payout',
      severity: 'SUCCESS',
      summary: `Payout inspeksi ${existing.orderCode}`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'USER',
      },
      target: { type: 'inspection', id, label: existing.orderCode },
    })

    return apiSuccess(serializeInspectionOrder(updated, 'USER'))
  } catch (e) {
    console.error('[USER_INSPEKSI_CONFIRM]', e)
    return apiError('Gagal mengonfirmasi laporan', 500)
  }
}
