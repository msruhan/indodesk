import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { normalizeSupplierCode } from '@/lib/imei-public'
import { scheduleServerOrderFollowUp } from '@/lib/server-order-scheduler'
import {
  pollServerOrderFromSupplier,
  submitServerOrderToSupplier,
} from '@/lib/server-order-worker'
import { parseServerFieldDefs, validateServerOrderFields } from '@/lib/server-fields'
import { createServerOrderSchema } from '@/lib/validations/server'
import { extractRequestContext, logOrderEvent } from '@/lib/activity-log'
import { ServerOrderStatus, type Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

function generateOrderCode() {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `SRV-${year}-${rand}`
}

/** GET /api/imei/server-orders — user's server orders */
export async function GET(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()

    const where: Prisma.ServerOrderWhereInput = { userId: session.user.id }
    if (status && (Object.values(ServerOrderStatus) as string[]).includes(status)) {
      where.status = status as ServerOrderStatus
    }
    if (q) {
      where.OR = [
        { orderCode: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { service: { title: { contains: q, mode: 'insensitive' } } },
      ]
    }

    let orders = await prisma.serverOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            requiredFields: true,
            box: { select: { title: true } },
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
        missingSupplierCode.slice(0, 8).map((o) => pollServerOrderFromSupplier(o.id)),
      )
      const ids = missingSupplierCode.map((o) => o.id)
      const refreshed = await prisma.serverOrder.findMany({
        where: { id: { in: ids } },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              requiredFields: true,
              box: { select: { title: true } },
            },
          },
        },
      })
      const byId = new Map(refreshed.map((o) => [o.id, o]))
      orders = orders.map((o) => byId.get(o.id) ?? o)
    }

    return apiSuccess(orders)
  } catch (e) {
    console.error('[SERVER_ORDERS_GET]', e)
    return apiError('Gagal mengambil order', 500)
  }
}

/** POST /api/imei/server-orders — place a server order */
export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createServerOrderSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message)

    const userId = session.user.id
    const service = await prisma.serverService.findFirst({ where: { id: parsed.data.serviceId, status: 'ACTIVE' } })
    if (!service) return apiError('Layanan tidak ditemukan atau tidak aktif', 404)

    const fieldDefs = parseServerFieldDefs(service.requiredFields)
    const validation = validateServerOrderFields(fieldDefs, parsed.data.requiredFields)
    if (!validation.ok) return apiError(validation.error ?? 'Data order tidak valid', 400)

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return apiError('Wallet tidak ditemukan', 400)
    if (wallet.balance.lessThan(service.price)) return apiError('Saldo tidak cukup', 402)

    const order = await prisma.$transaction(async (tx) => {
      // Re-read wallet inside transaction to prevent race condition
      const freshWallet = await tx.wallet.findUniqueOrThrow({ where: { userId } })
      if (freshWallet.balance.lessThan(service.price)) {
        throw new Error('INSUFFICIENT_BALANCE')
      }

      const newBalance = freshWallet.balance.sub(service.price)
      await tx.wallet.update({ where: { id: freshWallet.id }, data: { balance: newBalance } })

      const created = await tx.serverOrder.create({
        data: {
          orderCode: generateOrderCode(),
          userId,
          serviceId: service.id,
          price: service.price,
          status: 'PENDING',
          email: validation.email,
          notes: validation.notes,
          requiredFields:
            Object.keys(validation.fields).length > 0
              ? JSON.stringify(validation.fields)
              : null,
        },
        include: { service: { select: { id: true, title: true } } },
      })

      await tx.walletLedger.create({
        data: {
          walletId: freshWallet.id,
          type: 'PAYMENT',
          amount: service.price.neg(),
          balance: newBalance,
          description: `Server order: ${service.title}`,
          referenceId: created.id,
        },
      })
      return created
    })

    try {
      const submitted = await submitServerOrderToSupplier(order.id)
      if (submitted.ok && submitted.referenceId) {
        void pollServerOrderFromSupplier(order.id).catch((e) =>
          console.error('[SERVER_ORDERS_POLL_AFTER_SUBMIT]', e),
        )
      }
      scheduleServerOrderFollowUp(order.id)
    } catch (submitErr) {
      console.error('[SERVER_ORDERS_SUBMIT_SUPPLIER]', submitErr)
    }

    const ctx = extractRequestContext(req)
    void logOrderEvent({
      action: 'order.server.created',
      severity: 'SUCCESS',
      summary: `Order Server baru: ${order.orderCode} — ${service.title}`,
      actor: {
        id: userId,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      },
      target: { type: 'server_order', id: order.id, label: order.orderCode },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: {
        orderCode: order.orderCode,
        serviceTitle: service.title,
        amount: service.price.toString(),
      },
    })

    const refreshed = await prisma.serverOrder.findUnique({
      where: { id: order.id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            requiredFields: true,
            box: { select: { title: true } },
          },
        },
      },
    })

    return apiSuccess(refreshed ?? order, 201)
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup', 402)
    }
    console.error('[SERVER_ORDERS_POST]', e)
    return apiError('Gagal membuat order', 500)
  }
}
