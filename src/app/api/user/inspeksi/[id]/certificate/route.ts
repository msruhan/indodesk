import { prisma } from '@/lib/db'
import { apiError, requireApiRole } from '@/lib/api-auth'
import { generateInspectionCertificatePdf } from '@/lib/inspection-certificate-pdf'
import {
  inspectionCategoryLabel,
  inspectionModeLabel,
  overallConditionLabel,
  recommendationLabel,
} from '@/lib/inspection-labels'
import { parseChecklistData } from '@/lib/inspection-checklist'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole(['USER', 'TEKNISI', 'ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const row = await prisma.inspectionOrder.findUnique({
      where: { id },
      include: {
        report: true,
        teknisi: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    if (!row?.report) {
      return apiError('Laporan inspeksi belum tersedia', 404)
    }

    const isOwner = row.userId === session.user.id
    const isTeknisi = row.teknisiId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    if (!isOwner && !isTeknisi && !isAdmin) {
      return apiError('Akses ditolak', 403)
    }

    const pdf = await generateInspectionCertificatePdf({
      certificateNumber: row.report.certificateNumber,
      orderCode: row.orderCode,
      productName: row.productName,
      productBrand: row.productBrand,
      productModel: row.productModel,
      categoryLabel: inspectionCategoryLabel(row.category),
      modeLabel: inspectionModeLabel(row.mode),
      teknisiName: row.teknisi.name,
      buyerName: row.user.name,
      submittedAt: row.report.submittedAt.toISOString(),
      overallConditionLabel: overallConditionLabel(row.report.overallCondition),
      recommendationLabel: recommendationLabel(row.report.recommendation),
      findings: row.report.findings,
      suggestions: row.report.suggestions,
      checklist: parseChecklistData(row.report.checklistData),
    })

    const filename = `sertifikat-${row.report.certificateNumber}.pdf`
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (e) {
    console.error('[USER_INSPEKSI_CERTIFICATE_GET]', e)
    return apiError('Gagal membuat sertifikat PDF', 500)
  }
}
