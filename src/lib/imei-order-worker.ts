/**
 * Submit IMEI orders to Dhru Fusion supplier & poll status updates.
 */
import { prisma } from '@/lib/db'
import { DhruFusionClient } from '@/lib/dhru-fusion'
import { normalizeSupplierCode, stripSupplierHtml } from '@/lib/imei-public'
import type { ImeiOrder, ImeiOrderStatus, Prisma } from '@prisma/client'

function extractSupplierCode(remote: { code?: string; comments?: string }): string | null {
  return (
    normalizeSupplierCode(remote.code) ||
    normalizeSupplierCode(stripSupplierHtml(remote.comments || ''))
  )
}

/**
 * Terjemahkan error supplier ke pesan yang jelas untuk user/admin.
 * @param phase submit = placeimeiorder gagal (instan, referenceId kosong);
 *              poll = getimeiorder status reject setelah antrian.
 */
export function formatSupplierRejectReason(raw: string, phase: 'submit' | 'poll'): string {
  const clean = stripSupplierHtml(raw)
  const lower = clean.toLowerCase()
  const prefix =
    phase === 'submit'
      ? '[Ditolak saat kirim — order tidak masuk antrian supplier]'
      : '[Ditolak setelah diproses supplier]'

  if (lower.includes('creditprocess') || lower.includes('credit process')) {
    return phase === 'submit'
      ? '[Ditolak saat kirim ke supplier] Saldo/kredit akun reseller API di luteam tidak cukup (CreditprocessError). Top-up saldo di panel luteam.store — ini bukan saldo wallet user di IndoTeknizi.'
      : `[Ditolak setelah diproses supplier] ${clean}`
  }

  if (lower.includes('invalid imei') || lower.includes('validationerror')) {
    return `[Ditolak saat kirim ke supplier] IMEI tidak valid menurut supplier. Pastikan 15 digit benar (cek *#06# di HP). ${clean}`
  }

  if (lower.includes('imei') && lower.includes('required')) {
    return phase === 'submit'
      ? `[Ditolak saat kirim] Supplier menolak format order server (meminta IMEI). Periksa field layanan (username/qty) dan minimum quantity di panel supplier. ${clean}`
      : `${prefix} ${clean}`
  }

  return `${prefix} ${clean}`
}

/** Dhru Classic getimeiorder STATUS: 0=New, 1=InProcess, 3=Reject, 4=Success */
export function mapDhruStatusToOrderStatus(dhruStatus: number): ImeiOrderStatus | null {
  switch (dhruStatus) {
    case 4:
      return 'SUCCESS'
    case 3:
      return 'REJECTED'
    case 1:
      return 'IN_PROCESS'
    case 0:
      return 'IN_PROCESS'
    default:
      return null
  }
}

export function buildDhruOrderFields(order: Pick<
  ImeiOrder,
  | 'imei'
  | 'network'
  | 'model'
  | 'provider'
  | 'pin'
  | 'kbh'
  | 'mep'
  | 'prd'
  | 'serialNumber'
>): Record<string, string> {
  const fields: Record<string, string> = { IMEI: order.imei }
  if (order.network?.trim()) fields.NETWORK = order.network.trim()
  if (order.model?.trim()) fields.MODEL = order.model.trim()
  if (order.provider?.trim()) fields.PROVIDER = order.provider.trim()
  if (order.pin?.trim()) fields.PIN = order.pin.trim()
  if (order.kbh?.trim()) fields.KBH = order.kbh.trim()
  if (order.mep?.trim()) fields.MEP = order.mep.trim()
  if (order.prd?.trim()) fields.PRD = order.prd.trim()
  if (order.serialNumber?.trim()) fields.SN = order.serialNumber.trim()
  return fields
}

async function refundImeiOrder(
  tx: Prisma.TransactionClient,
  order: Pick<ImeiOrder, 'id' | 'orderCode' | 'userId' | 'price'>,
  reason: string,
  supplierCode?: string | null,
) {
  const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } })
  if (!wallet) return

  const newBalance = wallet.balance.add(order.price)
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  })
  await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: 'REFUND',
      amount: order.price,
      balance: newBalance,
      description: `Refund order IMEI #${order.orderCode}`,
      referenceId: order.id,
    },
  })

  await tx.imeiOrder.update({
    where: { id: order.id },
    data: {
      status: 'REJECTED',
      comments: reason,
      code: supplierCode ?? undefined,
      completedAt: new Date(),
    },
  })
}

type OrderWithService = Prisma.ImeiOrderGetPayload<{
  include: {
    service: { include: { api: true } }
  }
}>

function getDhruClient(order: OrderWithService): DhruFusionClient | null {
  const api = order.service.api
  if (!api || api.status !== 'ACTIVE' || api.apiType !== 'DhruFusion') return null
  return new DhruFusionClient({
    host: api.host,
    username: api.username,
    apiKey: api.apiKey,
  })
}

/** Send a PENDING order to the supplier API. */
export async function submitImeiOrderToSupplier(orderId: string): Promise<{
  ok: boolean
  error?: string
  referenceId?: string
}> {
  const order = await prisma.imeiOrder.findUnique({
    where: { id: orderId },
    include: { service: { include: { api: true } } },
  })

  if (!order) return { ok: false, error: 'Order tidak ditemukan' }
  if (order.referenceId) return { ok: true, referenceId: order.referenceId }
  if (order.status !== 'PENDING' && order.status !== 'IN_PROCESS') {
    return { ok: false, error: `Status order: ${order.status}` }
  }

  const toolId = order.service.toolId
  if (!toolId) {
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(tx, order, 'Layanan belum terhubung ke supplier (toolId kosong).')
    })
    return { ok: false, error: 'toolId kosong' }
  }

  const client = getDhruClient(order)
  if (!client) {
    await prisma.imeiOrder.update({
      where: { id: orderId },
      data: {
        comments:
          'API supplier tidak aktif atau bukan DhruFusion — perlu proses manual oleh admin.',
      },
    })
    return { ok: false, error: 'Supplier API tidak tersedia' }
  }

  const fields = buildDhruOrderFields(order)
  const placed = await client.placeImeiOrderFields(toolId, fields)

  if (!placed.success || !placed.referenceId) {
    const raw = placed.error || 'Gagal submit ke supplier'
    const userMsg = formatSupplierRejectReason(raw, 'submit')
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(tx, order, userMsg, normalizeSupplierCode(stripSupplierHtml(raw)))
    })
    return { ok: false, error: raw }
  }

  const refId = placed.referenceId
  const collision = await prisma.imeiOrder.findFirst({
    where: {
      referenceId: refId,
      id: { not: orderId },
      service: { apiId: order.service.apiId },
    },
    include: { service: { select: { title: true, toolId: true } } },
  })

  if (collision && collision.serviceId !== order.serviceId) {
    const msg = `[Duplikat referensi supplier] IMEI ini sudah terdaftar sebagai order #${collision.orderCode} (${collision.service.title}, ref ${refId}). Di luteam hanya terlihat layanan itu — batalkan/tunggu selesai, lalu order ulang.`
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(tx, order, msg)
    })
    return { ok: false, error: 'IMEI masih aktif untuk layanan lain di supplier' }
  }

  await prisma.imeiOrder.update({
    where: { id: orderId },
    data: {
      referenceId: refId,
      status: 'IN_PROCESS',
      processedAt: new Date(),
      comments: null,
    },
  })

  return { ok: true, referenceId: refId }
}

/** Poll supplier for order result and update DB. */
export async function pollImeiOrderFromSupplier(orderId: string): Promise<{
  ok: boolean
  updated: boolean
  error?: string
}> {
  const order = await prisma.imeiOrder.findUnique({
    where: { id: orderId },
    include: { service: { include: { api: true } } },
  })

  if (!order) return { ok: false, updated: false, error: 'Order tidak ditemukan' }
  if (!order.referenceId) {
    if (order.status === 'PENDING') {
      return submitImeiOrderToSupplier(orderId).then((r) => ({
        ok: r.ok,
        updated: r.ok,
        error: r.error,
      }))
    }
    return { ok: false, updated: false, error: 'Belum ada referenceId supplier' }
  }

  const isFinal =
    order.status === 'SUCCESS' || order.status === 'REJECTED' || order.status === 'CANCELLED'
  if (isFinal && order.code) {
    return { ok: true, updated: false }
  }

  const client = getDhruClient(order)
  if (!client) return { ok: false, updated: false, error: 'Supplier API tidak tersedia' }

  const remote = await client.getOrderStatus(order.referenceId)
  if (!remote.success) {
    return { ok: false, updated: false, error: remote.error }
  }

  const supplierCode = extractSupplierCode(remote)
  const mapped = mapDhruStatusToOrderStatus(remote.status ?? 0)

  if (isFinal) {
    if (supplierCode && supplierCode !== order.code) {
      await prisma.imeiOrder.update({
        where: { id: orderId },
        data: { code: supplierCode },
      })
      return { ok: true, updated: true }
    }
    return { ok: true, updated: false }
  }

  if (!mapped || mapped === order.status) {
    if (supplierCode && supplierCode !== order.code) {
      await prisma.imeiOrder.update({
        where: { id: orderId },
        data: { code: supplierCode },
      })
      return { ok: true, updated: true }
    }
    if (mapped === 'IN_PROCESS' && order.status === 'PENDING') {
      await prisma.imeiOrder.update({
        where: { id: orderId },
        data: {
          status: 'IN_PROCESS',
          processedAt: order.processedAt ?? new Date(),
          code: supplierCode ?? order.code,
        },
      })
      return { ok: true, updated: true }
    }
    return { ok: true, updated: false }
  }

  if (mapped === 'SUCCESS') {
    await prisma.imeiOrder.update({
      where: { id: orderId },
      data: {
        status: 'SUCCESS',
        code: supplierCode,
        comments: null,
        completedAt: new Date(),
      },
    })
    return { ok: true, updated: true }
  }

  if (mapped === 'REJECTED') {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.imeiOrder.findUnique({ where: { id: orderId } })
      if (!fresh) return
      const wasFinal =
        fresh.status === 'SUCCESS' || fresh.status === 'REJECTED' || fresh.status === 'CANCELLED'
      if (wasFinal) return

      const rejectCode =
        supplierCode ||
        normalizeSupplierCode(stripSupplierHtml(remote.error || 'Ditolak supplier'))

      await tx.imeiOrder.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          code: rejectCode,
          comments: null,
          completedAt: new Date(),
        },
      })

      const wallet = await tx.wallet.findUnique({ where: { userId: fresh.userId } })
      if (wallet) {
        const newBalance = wallet.balance.add(fresh.price)
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } })
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: fresh.price,
            balance: newBalance,
            description: `Refund order IMEI #${fresh.orderCode}`,
            referenceId: fresh.id,
          },
        })
      }
    })
    return { ok: true, updated: true }
  }

  await prisma.imeiOrder.update({
    where: { id: orderId },
    data: {
      status: mapped,
      processedAt: order.processedAt ?? new Date(),
    },
  })
  return { ok: true, updated: true }
}

/** Batch: submit pending orders & poll in-flight orders (for cron). */
export async function processImeiOrderQueue(options?: { submitLimit?: number; pollLimit?: number }) {
  const submitLimit = options?.submitLimit ?? 20
  const pollLimit = options?.pollLimit ?? 50

  const toSubmit = await prisma.imeiOrder.findMany({
    where: { status: 'PENDING', referenceId: null },
    orderBy: { createdAt: 'asc' },
    take: submitLimit,
    select: { id: true },
  })

  const submitResults = []
  for (const { id } of toSubmit) {
    submitResults.push({ id, ...(await submitImeiOrderToSupplier(id)) })
  }

  const toPoll = await prisma.imeiOrder.findMany({
    where: {
      referenceId: { not: null },
      OR: [
        { status: { in: ['PENDING', 'IN_PROCESS'] } },
        {
          status: { in: ['SUCCESS', 'REJECTED'] },
          OR: [{ code: null }, { code: '' }],
        },
      ],
    },
    orderBy: { updatedAt: 'asc' },
    take: pollLimit,
    select: { id: true },
  })

  const pollResults = []
  for (const { id } of toPoll) {
    pollResults.push({ id, ...(await pollImeiOrderFromSupplier(id)) })
  }

  return {
    submitted: submitResults.length,
    polled: pollResults.length,
    submitResults,
    pollResults,
  }
}
