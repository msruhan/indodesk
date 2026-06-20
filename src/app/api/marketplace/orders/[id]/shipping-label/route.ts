import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, requireApiAuth } from '@/lib/api-auth'
import {
  SHIPPING_LABEL_ORDER_SELECT,
  buildLabelQrBuffer,
  buildShippingLabelData,
  canAccessShippingLabel,
  ensureShippingLabelToken,
  loadBrandWordmarkBuffer,
  orderEligibleForShippingLabel,
} from '@/lib/shipping-label'
import { renderShippingLabelPng } from '@/lib/shipping-label-png'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    select: SHIPPING_LABEL_ORDER_SELECT,
  })

  if (!order) return apiError('Pesanan tidak ditemukan', 404)

  if (!canAccessShippingLabel(session.user.id, session.user.role, order)) {
    return apiError('Akses ditolak', 403)
  }

  if (!orderEligibleForShippingLabel(order)) {
    return apiError('Label pengiriman belum tersedia untuk pesanan ini', 400)
  }

  try {
    const token = await ensureShippingLabelToken(order.id)
    const [labelData, qrBuffer, wordmarkBuffer] = await Promise.all([
      buildShippingLabelData(order, token),
      buildLabelQrBuffer(token),
      loadBrandWordmarkBuffer(),
    ])

    const png = await renderShippingLabelPng(labelData, qrBuffer, wordmarkBuffer)
    const filename = `label-${order.orderCode}.png`

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[SHIPPING_LABEL_GET]', e)
    return apiError('Gagal membuat label pengiriman', 500)
  }
}
