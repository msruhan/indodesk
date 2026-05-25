import 'server-only'

import PDFDocument from 'pdfkit'
import type { ChecklistItemResult } from '@/lib/inspection-checklist'

export type InspectionCertificateInput = {
  certificateNumber: string
  orderCode: string
  productName: string
  productBrand: string
  productModel: string
  categoryLabel: string
  modeLabel: string
  teknisiName: string
  buyerName: string
  submittedAt: string
  overallConditionLabel: string
  recommendationLabel: string
  findings: string
  suggestions: string | null
  checklist: ChecklistItemResult[]
}

function resultLabel(result: string): string {
  if (result === 'pass') return 'Lulus'
  if (result === 'fail') return 'Tidak lulus'
  return 'Tidak diketahui'
}

export function generateInspectionCertificatePdf(data: InspectionCertificateInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const submitted = new Date(data.submittedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    doc
      .fillColor('#059669')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('IndoTeknizi', { align: 'center' })
    doc
      .fillColor('#18181b')
      .fontSize(14)
      .text('Sertifikat Inspeksi Pra-Beli', { align: 'center' })
    doc.moveDown(0.5)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#52525b')
      .text(`No. ${data.certificateNumber}`, { align: 'center' })
    doc.text(`Order: ${data.orderCode}`, { align: 'center' })
    doc.moveDown(1.2)

    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(11).text('Detail barang')
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(10).fillColor('#3f3f46')
    doc.text(`Produk: ${data.productName}`)
    if (data.productBrand || data.productModel) {
      doc.text(`Merek/Model: ${[data.productBrand, data.productModel].filter(Boolean).join(' ')}`)
    }
    doc.text(`Kategori: ${data.categoryLabel} · ${data.modeLabel}`)
    doc.moveDown(0.8)

    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(11).text('Pihak')
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(10).fillColor('#3f3f46')
    doc.text(`Pembeli: ${data.buyerName}`)
    doc.text(`Teknisi inspeksi: ${data.teknisiName}`)
    doc.text(`Tanggal laporan: ${submitted}`)
    doc.moveDown(0.8)

    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(11).text('Hasil inspeksi')
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(10).fillColor('#3f3f46')
    doc.text(`Kondisi keseluruhan: ${data.overallConditionLabel}`)
    doc.text(`Rekomendasi: ${data.recommendationLabel}`)
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').text('Temuan:')
    doc.font('Helvetica').text(data.findings, { align: 'justify' })
    if (data.suggestions?.trim()) {
      doc.moveDown(0.4)
      doc.font('Helvetica-Bold').text('Saran:')
      doc.font('Helvetica').text(data.suggestions, { align: 'justify' })
    }

    doc.moveDown(0.8)
    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(11).text('Checklist')
    doc.moveDown(0.4)

    const col1 = 48
    const col2 = 280
    const col3 = 400
    let y = doc.y
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#52525b')
    doc.text('Item', col1, y)
    doc.text('Hasil', col2, y)
    doc.text('Catatan', col3, y)
    y += 14
    doc.moveTo(48, y).lineTo(547, y).strokeColor('#e4e4e7').stroke()
    y += 8

    doc.font('Helvetica').fillColor('#3f3f46')
    for (const item of data.checklist.slice(0, 28)) {
      if (y > 720) {
        doc.addPage()
        y = 48
      }
      doc.text(item.label.slice(0, 42), col1, y, { width: 220 })
      doc.text(resultLabel(item.result), col2, y, { width: 100 })
      doc.text((item.note ?? '—').slice(0, 40), col3, y, { width: 140 })
      y += 16
    }

    doc.moveDown(2)
    doc
      .fontSize(8)
      .fillColor('#a1a1aa')
      .text(
        'Dokumen ini diterbitkan secara elektronik oleh platform IndoTeknizi berdasarkan laporan teknisi terverifikasi. ' +
          'Sertifikat bukan jaminan hukum atas kondisi barang di masa depan.',
        { align: 'center' },
      )

    doc.end()
  })
}
