import sharp from 'sharp'
import type { ShippingLabelData } from '@/lib/shipping-label'

const WIDTH = 800
const HEIGHT = 1120

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length >= maxLines) return lines
  }
  if (current && lines.length < maxLines) lines.push(truncate(current, maxChars))
  return lines
}

function textBlock(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  attrs: string,
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" ${attrs}>${escapeXml(line)}</text>`,
    )
    .join('')
}

function buildLabelSvg(data: ShippingLabelData): string {
  const senderLines = wrapText(data.senderAddress, 32, 3)
  const recipientLines = wrapText(data.recipientAddress, 32, 3)
  const itemLines = data.items
    .slice(0, 4)
    .map((i) => `${truncate(i.name, 42)} ×${i.quantity}`)
  if (data.items.length > 4) {
    itemLines.push(`+${data.items.length - 4} item lainnya`)
  }

  const serviceLine = data.serviceLabel
    ? `<text x="48" y="668" font-size="12" fill="#6b7280">${escapeXml(data.serviceLabel)}</text>`
    : ''

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="32" y="176" font-size="14" font-weight="600" fill="#6b7280">Label Pengiriman</text>

  <rect x="32" y="200" width="736" height="88" rx="12" fill="none" stroke="#111827" stroke-width="2"/>
  <text x="400" y="228" text-anchor="middle" font-size="12" font-weight="600" letter-spacing="2" fill="#6b7280">KODE PESANAN</text>
  <text x="400" y="268" text-anchor="middle" font-size="34" font-weight="800" font-family="DejaVu Sans Mono, monospace" fill="#111827">${escapeXml(data.orderCode)}</text>

  <rect x="32" y="304" width="360" height="132" rx="12" fill="none" stroke="#e5e7eb"/>
  <text x="48" y="328" font-size="11" font-weight="700" letter-spacing="1" fill="#0f766e">PENGIRIM</text>
  <text x="48" y="354" font-size="16" font-weight="700" fill="#111827">${escapeXml(truncate(data.senderName, 40))}</text>
  <text x="48" y="378" font-size="13" fill="#374151">${escapeXml(data.senderPhone)}</text>
  ${textBlock(senderLines, 48, 402, 18, 'font-size="13" fill="#374151"')}

  <rect x="408" y="304" width="360" height="132" rx="12" fill="none" stroke="#e5e7eb"/>
  <text x="424" y="328" font-size="11" font-weight="700" letter-spacing="1" fill="#0f766e">PENERIMA</text>
  <text x="424" y="354" font-size="16" font-weight="700" fill="#111827">${escapeXml(truncate(data.recipientName, 40))}</text>
  <text x="424" y="378" font-size="13" fill="#374151">${escapeXml(data.recipientPhone)}</text>
  ${textBlock(recipientLines, 424, 402, 18, 'font-size="13" fill="#374151"')}

  <rect x="32" y="452" width="736" height="88" rx="12" fill="none" stroke="#e5e7eb"/>
  <text x="48" y="476" font-size="11" font-weight="700" fill="#6b7280">KURIR</text>
  <text x="48" y="500" font-size="15" font-weight="700" fill="#111827">${escapeXml(data.courierLabel)}</text>
  ${serviceLine}
  <text x="420" y="476" font-size="11" font-weight="700" fill="#6b7280">BERAT</text>
  <text x="420" y="500" font-size="15" font-weight="700" fill="#111827">${escapeXml(String(data.totalWeightKg))} kg</text>

  <rect x="32" y="556" width="736" height="${Math.max(120, 56 + itemLines.length * 22)}" rx="12" fill="none" stroke="#e5e7eb"/>
  <text x="48" y="580" font-size="11" font-weight="700" fill="#6b7280">ISI PAKET</text>
  ${textBlock(itemLines, 48, 604, 22, 'font-size="13" fill="#374151"')}

  <text x="400" y="${HEIGHT - 32}" text-anchor="middle" font-size="11" fill="#9ca3af">Scan QR untuk detail pesanan (login diperlukan) · ${escapeXml(data.generatedAt)} WIB</text>
</svg>`
}

export async function renderShippingLabelPng(
  data: ShippingLabelData,
  qrPng: Buffer,
  wordmarkPng: Buffer,
): Promise<Buffer> {
  const svg = buildLabelSvg(data)
  const [textLayer, wordmark, qr] = await Promise.all([
    sharp(Buffer.from(svg)).png().toBuffer(),
    sharp(wordmarkPng).resize(220, 124, { fit: 'inside' }).png().toBuffer(),
    sharp(qrPng).resize(120, 120).png().toBuffer(),
  ])

  return sharp(textLayer)
    .composite([
      { input: wordmark, top: 32, left: 32 },
      { input: qr, top: 32, left: 648 },
    ])
    .png()
    .toBuffer()
}
