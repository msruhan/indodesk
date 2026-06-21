import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import PDFDocument from 'pdfkit'
import {
  formatInvoiceDate,
  formatInvoicePrice,
  type MarketplaceOrderInvoiceData,
} from '@/lib/marketplace-order-invoice'

const require = createRequire(import.meta.url)
const resolvedPdfkitPkg = require.resolve('pdfkit/package.json') as unknown
const pdfkitPkgPath = typeof resolvedPdfkitPkg === 'string' ? resolvedPdfkitPkg : String(resolvedPdfkitPkg)
const pdfkitDataDir = path.join(path.dirname(pdfkitPkgPath), 'js', 'data')
process.env.PDFKIT_FONT_PATH = pdfkitDataDir

const BRAND_WORDMARK_PATH = path.join(process.cwd(), 'public/icon/iconbantootext.png')

const GREEN = '#059669'
const INK = '#18181b'
const MUTED = '#52525b'
const LIGHT = '#a1a1aa'
const BORDER = '#e4e4e7'

function drawWatermark(doc: InstanceType<typeof PDFDocument>, label: string, color: string) {
  doc.save()
  doc.opacity(0.08)
  doc.rotate(-35, { origin: [297, 420] })
  doc
    .font('Helvetica-Bold')
    .fontSize(52)
    .fillColor(color)
    .text(label, 80, 380, { width: 500, align: 'center' })
  doc.restore()
}

function drawSummaryLine(
  doc: InstanceType<typeof PDFDocument>,
  line: MarketplaceOrderInvoiceData['summaryLines'][number],
  xLabel: number,
  xAmount: number,
) {
  const prefix = line.negative ? '−' : ''
  const amountText = `${prefix}${formatInvoicePrice(line.amount)}`
  doc
    .font(line.emphasis ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(line.emphasis ? 10.5 : 9.5)
    .fillColor(line.emphasis ? INK : MUTED)
    .text(line.label, xLabel, doc.y, { width: 280 })
  const y = doc.y - (line.emphasis ? 12 : 11)
  doc.text(amountText, xAmount, y, { width: 120, align: 'right' })
  doc.moveDown(line.emphasis ? 0.55 : 0.35)
}

export function generateMarketplaceOrderInvoicePdf(
  data: MarketplaceOrderInvoiceData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const watermarkColor =
      data.paymentStatus === 'paid'
        ? GREEN
        : data.paymentStatus === 'cancelled'
          ? '#e11d48'
          : '#d97706'

    drawWatermark(doc, data.paymentStatusLabel, watermarkColor)

    const headerTop = 48
    const logoWidth = 176
    let subtitleY = headerTop + 28

    if (fs.existsSync(BRAND_WORDMARK_PATH)) {
      doc.image(BRAND_WORDMARK_PATH, 48, headerTop, { width: logoWidth })
      subtitleY = headerTop + Math.round(logoWidth * (941 / 1672)) + 6
    } else {
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(24).text(data.platformName, 48, headerTop)
      subtitleY = headerTop + 28
    }

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Invoice pembelian marketplace', 48, subtitleY)

    doc.y = subtitleY + 16

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('INVOICE', 400, 48, { width: 147, align: 'right' })
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GREEN)
      .text(`No. ${data.invoiceNumber}`, 400, 68, { width: 147, align: 'right' })
    doc
      .fillColor(MUTED)
      .text(`Order ${data.orderCode}`, 400, 82, { width: 147, align: 'right' })

    doc.moveDown(1.2)
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(BORDER).stroke()
    doc.moveDown(0.8)

    const colLeft = 48
    const colRight = 300
    let y = doc.y

    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('DITERBITKAN ATAS NAMA', colLeft, y)
    doc.text('UNTUK', colRight, y)
    y += 14

    doc.font('Helvetica').fontSize(10).fillColor(INK)
    doc.text(`Penjual: ${data.seller.name}`, colLeft, y, { width: 230 })
    doc.text(`Pembeli: ${data.buyer.name}`, colRight, y, { width: 247 })
    y += 14
    doc.fontSize(9).fillColor(MUTED)
    doc.text(`Platform: ${data.platformName}`, colLeft, y)
    doc.text(`Tanggal pembelian: ${formatInvoiceDate(data.purchaseDate)}`, colRight, y)
    y += 14
    if (data.buyer.email) {
      doc.text(`Email: ${data.buyer.email}`, colRight, y)
      y += 14
    }
    if (data.shippingAddress) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('ALAMAT PENGIRIMAN', colRight, y)
      y += 12
      doc.font('Helvetica').fontSize(9).fillColor(INK)
      const address = data.shippingPhone
        ? `${data.shippingAddress} · ${data.shippingPhone}`
        : data.shippingAddress
      doc.text(address, colRight, y, { width: 247 })
      y += doc.heightOfString(address, { width: 247 }) + 6
    }
    if (data.shippingCourierLabel) {
      const courierLine = data.shippingService
        ? `Kurir: ${data.shippingCourierLabel} · ${data.shippingService}`
        : `Kurir: ${data.shippingCourierLabel}`
      doc.fontSize(9).fillColor(MUTED).text(courierLine, colRight, y, { width: 247 })
      y += 14
    }

    doc.y = Math.max(doc.y, y) + 12
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(BORDER).stroke()
    doc.moveDown(0.6)

    const tableTop = doc.y
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
    doc.text('INFO PRODUK', 48, tableTop, { width: 240 })
    doc.text('JUMLAH', 300, tableTop, { width: 50, align: 'center' })
    doc.text('HARGA SATUAN', 360, tableTop, { width: 90, align: 'right' })
    doc.text('TOTAL', 460, tableTop, { width: 87, align: 'right' })
    doc.moveDown(0.4)
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(BORDER).stroke()
    doc.moveDown(0.5)

    for (const item of data.items) {
      const rowY = doc.y
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GREEN).text(item.name, 48, rowY, { width: 240 })
      doc.font('Helvetica').fontSize(9).fillColor(INK)
      doc.text(String(item.quantity), 300, rowY, { width: 50, align: 'center' })
      doc.text(formatInvoicePrice(item.unitPrice), 360, rowY, { width: 90, align: 'right' })
      doc.text(formatInvoicePrice(item.lineTotal), 460, rowY, { width: 87, align: 'right' })
      doc.moveDown(0.9)
    }

    doc.moveDown(0.6)
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(BORDER).stroke()
    doc.moveDown(0.8)

    const summaryXLabel = 280
    const summaryXAmount = 427
    for (const line of data.summaryLines) {
      drawSummaryLine(doc, line, summaryXLabel, summaryXAmount)
    }

    doc.moveDown(0.8)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Metode pembayaran: ${data.paymentMethodLabel}`)
    doc.text(`Status pesanan: ${data.orderStatusLabel}`)
    doc.moveDown(1)

    doc
      .fontSize(8)
      .fillColor(LIGHT)
      .text(
        'Invoice ini diterbitkan secara elektronik oleh platform Bantoo dan sah tanpa tanda tangan basah. ' +
          'Untuk bantuan, hubungi Pusat Bantuan di aplikasi.',
        { align: 'center', lineGap: 2 },
      )

    doc.end()
  })
}
