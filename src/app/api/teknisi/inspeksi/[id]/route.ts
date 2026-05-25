import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logCommunicationEvent } from '@/lib/activity-log'
import { generateCertificateNumber } from '@/lib/inspection-pricing'
import { refundUserForInspection } from '@/lib/inspection-wallet'
import { serializeInspectionOrder } from '@/lib/inspection-serializer'
import { submitInspectionReportSchema } from '@/lib/validations/inspection'

export const dynamic = 'force-dynamic'

const includeOrder = {
  user: { select: { id: true, name: true, email: true, image: true } },
  teknisi: { select: { id: true, name: true, email: true, image: true } },
  report: true,
} as const

const patchSchema = z.object({
  action: z.enum(['accept', 'reject', 'start', 'submit_report']),
  scheduledAt: z.string().datetime().optional(),
  report: submitInspectionReportSchema.optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
  if (error) return error

  const { id } = await params
  try {
    const row = await prisma.inspectionOrder.findFirst({
      where: { id, teknisiId: session.user.id },
      include: includeOrder,
    })
    if (!row) return apiError('Inspeksi tidak ditemukan', 404)
    return apiSuccess(serializeInspectionOrder(row, 'TEKNISI'))
  } catch (e) {
    console.error('[TEKNISI_INSPEKSI_ID_GET]', e)
    return apiError('Gagal memuat detail', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['TEKNISI'])
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
    const existing = await prisma.inspectionOrder.findFirst({
      where: { id, teknisiId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    })
    if (!existing) return apiError('Inspeksi tidak ditemukan', 404)

    const now = new Date()
    const { action } = parsed.data

    if (action === 'accept') {
      if (existing.status !== 'PAID') return apiError('Hanya permintaan baru yang bisa diterima')
      const updated = await prisma.inspectionOrder.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: now,
          scheduledAt: parsed.data.scheduledAt
            ? new Date(parsed.data.scheduledAt)
            : existing.scheduledAt,
        },
        include: includeOrder,
      })
      return apiSuccess(serializeInspectionOrder(updated, 'TEKNISI'))
    }

    if (action === 'reject') {
      if (existing.status !== 'PAID') return apiError('Hanya permintaan baru yang bisa ditolak')
      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.inspectionOrder.update({
          where: { id },
          data: { status: 'REJECTED', cancelReason: 'Ditolak teknisi' },
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
            `Refund inspeksi ditolak: ${existing.productName}`,
          )
        }
        return row
      })
      return apiSuccess(serializeInspectionOrder(updated, 'TEKNISI'))
    }

    if (action === 'start') {
      if (existing.status !== 'ACCEPTED') return apiError('Terima permintaan dulu')
      const updated = await prisma.inspectionOrder.update({
        where: { id },
        data: { status: 'IN_PROGRESS', startedAt: now },
        include: includeOrder,
      })
      return apiSuccess(serializeInspectionOrder(updated, 'TEKNISI'))
    }

    if (action === 'submit_report') {
      if (existing.status !== 'IN_PROGRESS') {
        return apiError('Mulai inspeksi terlebih dahulu')
      }
      if (!parsed.data.report) return apiError('Data laporan wajib diisi')

      const reportData = parsed.data.report
      const cert = generateCertificateNumber()

      const updated = await prisma.$transaction(async (tx) => {
        await tx.inspectionReport.create({
          data: {
            inspectionOrderId: id,
            overallCondition: reportData.overallCondition,
            recommendation: reportData.recommendation,
            checklistData: reportData.checklist,
            findings: reportData.findings.trim(),
            suggestions: reportData.suggestions?.trim() || null,
            photoUrls: reportData.photoUrls ?? [],
            certificateNumber: cert,
          },
        })

        return tx.inspectionOrder.update({
          where: { id },
          data: { status: 'REPORT_SUBMITTED' },
          include: includeOrder,
        })
      })

      void logCommunicationEvent({
        action: 'inspection.report_submitted',
        severity: 'INFO',
        summary: `Laporan inspeksi ${existing.orderCode} dikirim`,
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'TEKNISI',
        },
        target: { type: 'inspection', id, label: existing.orderCode },
      })

      return apiSuccess(serializeInspectionOrder(updated, 'TEKNISI'))
    }

    return apiError('Aksi tidak dikenali')
  } catch (e) {
    console.error('[TEKNISI_INSPEKSI_PATCH]', e)
    return apiError('Gagal memperbarui inspeksi', 500)
  }
}
