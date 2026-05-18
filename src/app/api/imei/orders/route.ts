import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { scheduleImeiOrderFollowUp } from '@/lib/imei-order-scheduler'
import { normalizeSupplierCode } from '@/lib/imei-public'
import { pollImeiOrderFromSupplier, submitImeiOrderToSupplier } from '@/lib/imei-order-worker'
import { createImeiOrderSchema } from '@/lib/validations/imei'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

function generateOrderCode() {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `IMEI-${year}-${rand}`
}

/** GET /api/imei/orders — list current user's orders */
export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')

    const where: Prisma.ImeiOrderWhereInput = { userId: session.user.id }
    if (status && ['PENDING', 'IN_PROCESS', 'SUCCESS', 'REJECTED', 'CANCELLED'].includes(status)) {
      where.status = status as Prisma.ImeiOrderWhereInput['status']
    }
    if (q && q.trim()) {
      where.OR = [
        { imei: { contains: q } },
        { orderCode: { contains: q, mode: 'insensitive' } },
        { service: { title: { contains: q, mode: 'insensitive' } } },
      ]
    }

    let orders = await prisma.imeiOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            group: { select: { id: true, title: true } },
          },
        },
      },
    })

    const missingSupplierCode = orders.filter(
      (o) =>
        o.referenceId &&
        !normalizeSupplierCode(o.code) &&
        (o.status === 'SUCCESS' || o.status === 'REJECTED'),
    )
    if (missingSupplierCode.length > 0) {
      await Promise.all(
        missingSupplierCode.slice(0, 8).map((o) => pollImeiOrderFromSupplier(o.id)),
      )
      const ids = missingSupplierCode.map((o) => o.id)
      const refreshed = await prisma.imeiOrder.findMany({
        where: { id: { in: ids } },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              group: { select: { id: true, title: true } },
            },
          },
        },
      })
      const byId = new Map(refreshed.map((o) => [o.id, o]))
      orders = orders.map((o) => byId.get(o.id) ?? o)
    }

    return apiSuccess(orders)
  } catch (e) {
    console.error('[IMEI_ORDERS_GET]', e)
    return apiError('Gagal mengambil order', 500)
  }
}

/**
 * POST /api/imei/orders — place a new IMEI order.
 * Deducts price from user wallet (debit) and creates order with PENDING status.
 */
export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createImeiOrderSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const userId = session.user.id

    // Verify service exists and is active
    const service = await prisma.imeiService.findFirst({
      where: { id: parsed.data.serviceId, status: 'ACTIVE' },
      select: { id: true, apiId: true, price: true, title: true, requiresNetwork: true, requiresModel: true, requiresProvider: true, requiresPin: true, requiresKbh: true, requiresMep: true, requiresPrd: true, requiresSn: true },
    })
    if (!service) return apiError('Layanan tidak ditemukan atau tidak aktif', 404)

    const activeSameImei = await prisma.imeiOrder.findFirst({
      where: {
        imei: parsed.data.imei,
        status: { in: ['PENDING', 'IN_PROCESS'] },
        service: { apiId: service.apiId },
      },
      select: { orderCode: true, service: { select: { title: true } } },
    })
    if (activeSameImei) {
      return apiError(
        `IMEI ini masih diproses di order ${activeSameImei.orderCode} (${activeSameImei.service.title}). Tunggu selesai atau batalkan di supplier sebelum order layanan lain.`,
        409,
      )
    }

    // Validate required dynamic fields based on service requirements
    const required: { key: keyof typeof parsed.data; label: string; flag: boolean }[] = [
      { key: 'network', label: 'Network', flag: service.requiresNetwork },
      { key: 'model', label: 'Model', flag: service.requiresModel },
      { key: 'provider', label: 'Provider', flag: service.requiresProvider },
      { key: 'pin', label: 'PIN', flag: service.requiresPin },
      { key: 'kbh', label: 'KBH', flag: service.requiresKbh },
      { key: 'mep', label: 'MEP', flag: service.requiresMep },
      { key: 'prd', label: 'PRD', flag: service.requiresPrd },
      { key: 'serialNumber', label: 'Serial Number', flag: service.requiresSn },
    ]
    for (const r of required) {
      if (r.flag && (!parsed.data[r.key] || `${parsed.data[r.key]}`.trim() === '')) {
        return apiError(`Field ${r.label} wajib diisi`)
      }
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return apiError('Wallet tidak ditemukan', 400)
    if (wallet.balance.lessThan(service.price)) {
      return apiError('Saldo tidak cukup. Top-up dulu ya.', 402)
    }

    // Create order + debit wallet in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newBalance = wallet.balance.sub(service.price)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })

      const orderCode = generateOrderCode()
      const created = await tx.imeiOrder.create({
        data: {
          orderCode,
          userId,
          serviceId: service.id,
          imei: parsed.data.imei,
          price: service.price,
          status: 'PENDING',
          network: parsed.data.network ?? null,
          model: parsed.data.model ?? null,
          provider: parsed.data.provider ?? null,
          pin: parsed.data.pin ?? null,
          kbh: parsed.data.kbh ?? null,
          mep: parsed.data.mep ?? null,
          prd: parsed.data.prd ?? null,
          serialNumber: parsed.data.serialNumber ?? null,
          note: parsed.data.note ?? null,
        },
        include: {
          service: { select: { id: true, title: true } },
        },
      })

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: service.price.neg(),
          balance: newBalance,
          description: `Order IMEI ${service.title}`,
          referenceId: created.id,
        },
      })

      return created
    })

    // Langsung teruskan ke supplier Dhru, lalu jadwalkan cek status berkala
    try {
      const submitted = await submitImeiOrderToSupplier(order.id)
      if (submitted.ok && submitted.referenceId) {
        void pollImeiOrderFromSupplier(order.id).catch((e) =>
          console.error('[IMEI_ORDERS_POLL_AFTER_SUBMIT]', e),
        )
      }
      scheduleImeiOrderFollowUp(order.id)
    } catch (submitErr) {
      console.error('[IMEI_ORDERS_SUBMIT_SUPPLIER]', submitErr)
    }

    const refreshed = await prisma.imeiOrder.findUnique({
      where: { id: order.id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            group: { select: { id: true, title: true } },
          },
        },
      },
    })

    return apiSuccess(refreshed ?? order, 201)
  } catch (e) {
    console.error('[IMEI_ORDERS_POST]', e)
    return apiError('Gagal membuat order', 500)
  }
}
