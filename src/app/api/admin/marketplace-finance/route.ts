import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { logAdminGovernance } from '@/lib/admin-audit'
import { getPlatformSettings, savePlatformSettings } from '@/lib/platform-settings'
import { verifyAdminStepUp, StepUpAuthError } from '@/lib/wallet/admin-step-up'
import { adminStepUpFields } from '@/lib/wallet/admin-step-up-schema'

export const dynamic = 'force-dynamic'

const feeSchema = z.object({
  buyerFeePercent: z.number().min(0).max(100),
  buyerFlatFeePerItem: z.number().int().min(0).max(1_000_000),
  sellerFeePercent: z.number().min(0).max(100),
  konsultasiFeePercent: z.number().min(0).max(100),
  inspeksiFeePercent: z.number().min(0).max(100),
  ...adminStepUpFields,
})

function sumFees(buyer: unknown, seller: unknown) {
  return Number(buyer ?? 0) + Number(seller ?? 0)
}

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const completedWhere = { status: 'COMPLETED' as const }

    const settings = await getPlatformSettings()

    const [
      totalBuyer,
      totalSeller,
      todayBuyer,
      todaySeller,
      last30Buyer,
      last30Seller,
      completedOrderCount,
      recentOrders,
      totalKonsultasiFee,
      totalInspeksiFee,
      todayKonsultasiFee,
      todayInspeksiFee,
      last30KonsultasiFee,
      last30InspeksiFee,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { buyerFeeAmount: true }, where: completedWhere }),
      prisma.order.aggregate({ _sum: { sellerFeeAmount: true }, where: completedWhere }),
      prisma.order.aggregate({
        _sum: { buyerFeeAmount: true },
        where: { ...completedWhere, completedAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        _sum: { sellerFeeAmount: true },
        where: { ...completedWhere, completedAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        _sum: { buyerFeeAmount: true },
        where: { ...completedWhere, completedAt: { gte: startOf30d } },
      }),
      prisma.order.aggregate({
        _sum: { sellerFeeAmount: true },
        where: { ...completedWhere, completedAt: { gte: startOf30d } },
      }),
      prisma.order.count({ where: completedWhere }),
      prisma.order.findMany({
        where: {
          ...completedWhere,
          OR: [{ buyerFeeAmount: { gt: 0 } }, { sellerFeeAmount: { gt: 0 } }],
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderCode: true,
          buyerFeeAmount: true,
          sellerFeeAmount: true,
          completedAt: true,
        },
      }),
      prisma.konsultasiSession.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.inspectionOrder.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.konsultasiSession.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED', endedAt: { gte: startOfToday } },
      }),
      prisma.inspectionOrder.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED', completedAt: { gte: startOfToday } },
      }),
      prisma.konsultasiSession.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED', endedAt: { gte: startOf30d } },
      }),
      prisma.inspectionOrder.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED', completedAt: { gte: startOf30d } },
      }),
    ])

    const totalBuyerFee = Number(totalBuyer._sum.buyerFeeAmount ?? 0)
    const totalSellerFee = Number(totalSeller._sum.sellerFeeAmount ?? 0)
    const totalKonsFee = Number(totalKonsultasiFee._sum.platformFee ?? 0)
    const totalInspFee = Number(totalInspeksiFee._sum.platformFee ?? 0)

    return apiSuccess({
      settings: {
        buyerFeePercent: settings.buyerFeePercent,
        buyerFlatFeePerItem: settings.buyerFlatFeePerItem,
        sellerFeePercent: settings.sellerFeePercent,
        konsultasiFeePercent: settings.konsultasiFeePercent,
        inspeksiFeePercent: settings.inspeksiFeePercent,
      },
      stats: {
        totalBuyerFee: String(totalBuyerFee),
        totalSellerFee: String(totalSellerFee),
        totalPlatformFee: String(totalBuyerFee + totalSellerFee),
        todayPlatformFee: String(
          sumFees(todayBuyer._sum.buyerFeeAmount, todaySeller._sum.sellerFeeAmount),
        ),
        last30dPlatformFee: String(
          sumFees(last30Buyer._sum.buyerFeeAmount, last30Seller._sum.sellerFeeAmount),
        ),
        completedOrderCount,
        totalKonsultasiFee: String(totalKonsFee),
        totalInspeksiFee: String(totalInspFee),
        totalServiceFee: String(totalKonsFee + totalInspFee),
        todayServiceFee: String(
          Number(todayKonsultasiFee._sum.platformFee ?? 0) +
            Number(todayInspeksiFee._sum.platformFee ?? 0),
        ),
        last30dServiceFee: String(
          Number(last30KonsultasiFee._sum.platformFee ?? 0) +
            Number(last30InspeksiFee._sum.platformFee ?? 0),
        ),
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        buyerFee: o.buyerFeeAmount.toString(),
        sellerFee: o.sellerFeeAmount.toString(),
        totalFee: o.buyerFeeAmount.add(o.sellerFeeAmount).toString(),
        completedAt: o.completedAt?.toISOString() ?? null,
      })),
    })
  } catch (e) {
    console.error('[ADMIN_MARKETPLACE_FINANCE_GET]', e)
    return apiError('Gagal memuat data keuangan marketplace', 500)
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = feeSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Data tidak valid')
    }

    try {
      await verifyAdminStepUp(session.user.id, {
        confirmPassword: parsed.data.confirmPassword,
        totp: parsed.data.totp,
      })
    } catch (e) {
      if (e instanceof StepUpAuthError) {
        return apiError(e.message, 401, { code: e.code })
      }
      throw e
    }

    const current = await getPlatformSettings()
    const settings = await savePlatformSettings({
      ...current,
      buyerFeePercent: parsed.data.buyerFeePercent,
      buyerFlatFeePerItem: parsed.data.buyerFlatFeePerItem,
      sellerFeePercent: parsed.data.sellerFeePercent,
      konsultasiFeePercent: parsed.data.konsultasiFeePercent,
      inspeksiFeePercent: parsed.data.inspeksiFeePercent,
    })

    logAdminGovernance({
      req,
      actor: session.user,
      action: 'admin.marketplace.finance.update',
      summary: 'Pengaturan fee platform diperbarui',
      severity: 'CRITICAL',
      metadata: {
        buyerFeePercent: settings.buyerFeePercent,
        buyerFlatFeePerItem: settings.buyerFlatFeePerItem,
        sellerFeePercent: settings.sellerFeePercent,
        konsultasiFeePercent: settings.konsultasiFeePercent,
        inspeksiFeePercent: settings.inspeksiFeePercent,
      },
    })

    return apiSuccess({
      buyerFeePercent: settings.buyerFeePercent,
      buyerFlatFeePerItem: settings.buyerFlatFeePerItem,
      sellerFeePercent: settings.sellerFeePercent,
      konsultasiFeePercent: settings.konsultasiFeePercent,
      inspeksiFeePercent: settings.inspeksiFeePercent,
    })
  } catch (e) {
    console.error('[ADMIN_MARKETPLACE_FINANCE_PATCH]', e)
    return apiError('Gagal menyimpan pengaturan fee', 500)
  }
}
