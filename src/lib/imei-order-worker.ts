/**
 * Submit IMEI orders to Dhru Fusion supplier & poll status updates.
 * Aligned with NexusServer: Classic API only for submit/poll, submit lock, stale reject.
 */
import { prisma } from '@/lib/db'
import { decryptImeiApiKey } from '@/lib/crypto/imei-api-secret'
import { DhruFusionClient } from '@/lib/dhru-fusion'
import { normalizeSupplierCode, stripSupplierHtml } from '@/lib/imei-public'
import { snDeliverViaImeiTag } from '@/lib/imei-supplier-fields'
import { logSystemEvent } from '@/lib/activity-log'
import {
  isImeiStressCredit,
  isImeiStressTimeout,
} from '@/lib/imei-stress-mock'
import {
  getOrderSubmitWindowMs,
  isOrderSubmitWindowExpired,
  STALE_SUBMIT_REJECT_MESSAGE,
} from '@/lib/order-submit-policy'
import { isStressTestMode } from '@/lib/stress-mode'
import type { ImeiOrder, ImeiOrderStatus, Prisma } from '@prisma/client'

function extractSupplierCode(remote: { code?: string; comments?: string }): string | null {
  return (
    normalizeSupplierCode(remote.code) ||
    normalizeSupplierCode(stripSupplierHtml(remote.comments || ''))
  )
}

export function formatSupplierRejectReason(raw: string, phase: 'submit' | 'poll'): string {
  const clean = stripSupplierHtml(raw)
  const lower = clean.toLowerCase()
  const prefix =
    phase === 'submit'
      ? '[Ditolak saat kirim — order tidak masuk antrian supplier]'
      : '[Ditolak setelah diproses supplier]'

  if (lower.includes('creditprocess') || lower.includes('credit process')) {
    return phase === 'submit'
      ? '[Ditolak saat kirim] Saldo/kredit akun reseller API di supplier tidak cukup (CreditprocessError). Top-up di panel supplier — ini bukan saldo wallet user di Bantoo.'
      : `${prefix} ${clean}`
  }

  if (lower.includes('invalid imei') || lower.includes('validationerror')) {
    return `[Ditolak saat kirim] IMEI tidak valid menurut supplier. ${clean}`
  }

  if (lower.includes('imei') && lower.includes('required')) {
    return phase === 'submit'
      ? `[Ditolak saat kirim] Supplier menolak format order. Periksa field layanan dan minimum quantity di panel supplier. ${clean}`
      : `${prefix} ${clean}`
  }

  if (lower.includes('duplicate')) {
    return phase === 'submit'
      ? `[Ditolak supplier — duplikat] ${clean}`
      : `${prefix} ${clean}`
  }

  return `${prefix} ${clean}`
}

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

type DhruOrderFieldSource = Pick<
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
> & {
  service?: Pick<{ requiresImei: boolean; requiresSn: boolean }, 'requiresImei' | 'requiresSn'>
}

export function buildDhruOrderFields(
  order: DhruOrderFieldSource,
  options?: { snDeliverViaImei?: boolean },
): Record<string, string> {
  const fields: Record<string, string> = {}
  const imei = order.imei?.trim() ?? ''
  const snStored = order.serialNumber?.trim()
  const sn = snStored || (imei && options?.snDeliverViaImei ? imei : '')
  const viaImei = options?.snDeliverViaImei ?? false

  if (viaImei && sn) {
    fields.IMEI = sn
  } else if (sn && !viaImei) {
    fields.SN = sn
  } else if (imei) {
    fields.IMEI = imei
  }

  if (order.network?.trim()) fields.NETWORK = order.network.trim()
  if (order.model?.trim()) fields.MODEL = order.model.trim()
  if (order.provider?.trim()) fields.PROVIDER = order.provider.trim()
  if (order.pin?.trim()) fields.PIN = order.pin.trim()
  if (order.kbh?.trim()) fields.KBH = order.kbh.trim()
  if (order.mep?.trim()) fields.MEP = order.mep.trim()
  if (order.prd?.trim()) fields.PRD = order.prd.trim()

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
      description: `Refund order Digital #${order.orderCode}`,
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
    apiKey: decryptImeiApiKey(api.apiKey),
  })
}

async function claimImeiOrderForSupplierSubmit(
  orderId: string,
): Promise<OrderWithService | null> {
  const claimed = await prisma.imeiOrder.updateMany({
    where: {
      id: orderId,
      status: 'PENDING',
      referenceId: null,
      processedAt: null,
    },
    data: { processedAt: new Date() },
  })

  if (claimed.count === 0) return null

  return prisma.imeiOrder.findUnique({
    where: { id: orderId },
    include: { service: { include: { api: true } } },
  })
}

async function rejectExpiredPendingImeiOrder(
  order: Pick<ImeiOrder, 'id' | 'orderCode' | 'userId' | 'price' | 'createdAt' | 'status' | 'referenceId'>,
): Promise<boolean> {
  if (order.status !== 'PENDING' || order.referenceId) return false
  if (!isOrderSubmitWindowExpired(order.createdAt)) return false

  await prisma.$transaction(async (tx) => {
    await refundImeiOrder(tx, order, STALE_SUBMIT_REJECT_MESSAGE)
  })
  return true
}

/** Send a PENDING order to the supplier API (Classic only, at most once per order). */
export async function submitImeiOrderToSupplier(orderId: string): Promise<{
  ok: boolean
  error?: string
  referenceId?: string
}> {
  const snapshot = await prisma.imeiOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      userId: true,
      price: true,
      createdAt: true,
      referenceId: true,
      status: true,
      processedAt: true,
    },
  })

  if (!snapshot) return { ok: false, error: 'Order tidak ditemukan' }
  if (snapshot.referenceId) return { ok: true, referenceId: snapshot.referenceId }
  if (snapshot.status === 'REJECTED' || snapshot.status === 'CANCELLED' || snapshot.status === 'SUCCESS') {
    return { ok: false, error: `Status order: ${snapshot.status}` }
  }
  if (snapshot.status !== 'PENDING') {
    return { ok: false, error: `Status order: ${snapshot.status}` }
  }

  if (await rejectExpiredPendingImeiOrder(snapshot)) {
    return { ok: false, error: STALE_SUBMIT_REJECT_MESSAGE }
  }

  if (snapshot.processedAt) {
    return { ok: false, error: 'Submit sudah pernah dicoba untuk order ini' }
  }

  const order = await claimImeiOrderForSupplierSubmit(orderId)
  if (!order) {
    const again = await prisma.imeiOrder.findUnique({
      where: { id: orderId },
      select: { referenceId: true },
    })
    if (again?.referenceId) return { ok: true, referenceId: again.referenceId }
    return { ok: false, error: 'Submit sedang berjalan atau sudah selesai' }
  }

  const toolId = order.service.toolId
  if (!toolId) {
    if (isStressTestMode()) {
      if (isImeiStressCredit(order.imei)) {
        const raw = 'CreditprocessError: INSUFFICIENT_CREDIT on reseller account'
        const userMsg = formatSupplierRejectReason(raw, 'submit')
        await prisma.$transaction(async (tx) => {
          await refundImeiOrder(tx, order, userMsg, normalizeSupplierCode(stripSupplierHtml(raw)))
        })
        return { ok: false, error: raw }
      }
      if (isImeiStressTimeout(order.imei)) {
        const raw = 'Request timeout while contacting supplier'
        const userMsg = formatSupplierRejectReason(raw, 'submit')
        await prisma.$transaction(async (tx) => {
          await refundImeiOrder(tx, order, userMsg)
        })
        return { ok: false, error: raw }
      }
      const refId = `stress-local-${orderId}`
      await prisma.imeiOrder.update({
        where: { id: orderId },
        data: {
          referenceId: refId,
          status: 'IN_PROCESS',
        },
      })
      return { ok: true, referenceId: refId }
    }
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(tx, order, 'Layanan belum terhubung ke supplier (toolId kosong).')
    })
    return { ok: false, error: 'toolId kosong' }
  }

  const client = getDhruClient(order)
  if (!client) {
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(
        tx,
        order,
        'API supplier tidak aktif atau bukan DhruFusion.',
      )
    })
    return { ok: false, error: 'Supplier API tidak tersedia' }
  }

  const fields = buildDhruOrderFields(order, {
    snDeliverViaImei: snDeliverViaImeiTag({
      requiresSn: order.service.requiresSn,
      requiresImei: order.service.requiresImei,
      api: order.service.api,
    }),
  })
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
    const msg = `[Duplikat referensi supplier] Nomor digital sudah terdaftar sebagai order #${collision.orderCode} (${collision.service.title}, ref ${refId}).`
    await prisma.$transaction(async (tx) => {
      await refundImeiOrder(tx, order, msg)
    })
    return { ok: false, error: 'Nomor digital masih aktif untuk layanan lain di supplier' }
  }

  await prisma.imeiOrder.update({
    where: { id: orderId },
    data: {
      referenceId: refId,
      status: 'IN_PROCESS',
      comments: null,
    },
  })

  return { ok: true, referenceId: refId }
}

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
    if (order.status === 'PENDING' && !order.processedAt) {
      return submitImeiOrderToSupplier(orderId).then((r) => ({
        ok: r.ok,
        updated: r.ok || r.error === STALE_SUBMIT_REJECT_MESSAGE,
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
    void logSystemEvent({
      action: 'order.imei.success',
      severity: 'SUCCESS',
      summary: `Order Digital ${order.orderCode} berhasil`,
      target: { type: 'imei_order', id: order.id, label: order.orderCode },
      metadata: { orderCode: order.orderCode, code: supplierCode ?? null },
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

      const supplierReply =
        stripSupplierHtml(remote.comments || '') ||
        stripSupplierHtml(remote.code || '') ||
        stripSupplierHtml(remote.error || '') ||
        'Ditolak supplier'
      const rejectCode = supplierCode || normalizeSupplierCode(supplierReply)
      const rejectComments = formatSupplierRejectReason(supplierReply, 'poll')

      await tx.imeiOrder.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          code: rejectCode,
          comments: rejectComments,
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
            description: `Refund order Digital #${fresh.orderCode}`,
            referenceId: fresh.id,
          },
        })
      }
    })
    void logSystemEvent({
      action: 'order.imei.rejected',
      severity: 'WARNING',
      summary: `Order Digital ${order.orderCode} ditolak supplier`,
      detail: remote.error ?? null,
      target: { type: 'imei_order', id: order.id, label: order.orderCode },
      metadata: { orderCode: order.orderCode, supplierError: remote.error ?? null },
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

async function rejectStalePendingImeiOrders(limit = 50): Promise<number> {
  const cutoff = new Date(Date.now() - getOrderSubmitWindowMs())
  const stale = await prisma.imeiOrder.findMany({
    where: {
      status: 'PENDING',
      referenceId: null,
      createdAt: { lt: cutoff },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      orderCode: true,
      userId: true,
      price: true,
      createdAt: true,
      status: true,
      referenceId: true,
    },
  })

  let rejected = 0
  for (const row of stale) {
    if (await rejectExpiredPendingImeiOrder(row)) rejected += 1
  }
  return rejected
}

export async function processImeiOrderQueue(options?: { submitLimit?: number; pollLimit?: number }) {
  const submitLimit = options?.submitLimit ?? 20
  const pollLimit = options?.pollLimit ?? 50

  await rejectStalePendingImeiOrders(submitLimit)

  const toSubmit = await prisma.imeiOrder.findMany({
    where: { status: 'PENDING', referenceId: null, processedAt: null },
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
