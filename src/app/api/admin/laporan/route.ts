/**
 * GET /api/admin/laporan
 *
 * Comprehensive analytics data for the admin Laporan page.
 * Aggregates real data from all platform models.
 */

import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOf7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      // Counts
      totalUsers,
      totalTeknisi,
      totalProducts,
      publishedProducts,
      totalImeiOrders,
      totalServerOrders,
      totalTopupOrders,
      totalMarketplaceOrders,
      totalRekber,
      totalKonsultasi,
      totalRemote,
      totalChat,
      totalChatMessages,
      totalDeposits,
      // Status counts
      imeiSuccess,
      imeiPending,
      serverSuccess,
      serverPending,
      // Revenue
      imeiRevenue,
      serverRevenue,
      marketplaceRevenue,
      // Today
      ordersToday,
      chatMessagesToday,
      depositsToday,
      // 7 days
      orders7d,
      konsultasi7d,
      remote7d,
      // 30 days
      orders30d,
      deposits30d,
      // Product views
      totalProductViews,
      totalProductSold,
      // Wallet
      totalWalletBalance,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'TEKNISI' } }),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true, listingStatus: 'APPROVED' } }),
      prisma.imeiOrder.count(),
      prisma.serverOrder.count(),
      prisma.topupOrder.count(),
      prisma.order.count(),
      prisma.rekberTransaction.count(),
      prisma.konsultasiSession.count(),
      prisma.remoteSession.count(),
      prisma.chatConversation.count(),
      prisma.chatMessage.count(),
      prisma.walletLedger.count({ where: { type: 'TOPUP' } }),
      // Status
      prisma.imeiOrder.count({ where: { status: 'SUCCESS' } }),
      prisma.imeiOrder.count({ where: { status: 'PENDING' } }),
      prisma.serverOrder.count({ where: { status: 'SUCCESS' } }),
      prisma.serverOrder.count({ where: { status: 'PENDING' } }),
      // Revenue
      prisma.imeiOrder.aggregate({ _sum: { price: true }, where: { status: 'SUCCESS' } }),
      prisma.serverOrder.aggregate({ _sum: { price: true }, where: { status: 'SUCCESS' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: 'COMPLETED' } }),
      // Today
      prisma.imeiOrder.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.chatMessage.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.walletLedger.count({ where: { type: 'TOPUP', createdAt: { gte: startOfToday } } }),
      // 7 days
      prisma.imeiOrder.count({ where: { createdAt: { gte: startOf7d } } }),
      prisma.konsultasiSession.count({ where: { createdAt: { gte: startOf7d } } }),
      prisma.remoteSession.count({ where: { createdAt: { gte: startOf7d } } }),
      // 30 days
      prisma.imeiOrder.count({ where: { createdAt: { gte: startOf30d } } }),
      prisma.walletLedger.count({ where: { type: 'TOPUP', createdAt: { gte: startOf30d } } }),
      // Product metrics
      prisma.product.aggregate({ _sum: { views: true } }),
      prisma.product.aggregate({ _sum: { soldCount: true } }),
      // Wallet
      prisma.wallet.aggregate({ _sum: { balance: true } }),
    ])

    // Transaction mix for donut chart
    const totalTransactions = totalImeiOrders + totalServerOrders + totalTopupOrders + totalMarketplaceOrders + totalRekber
    const transactionMix = [
      { name: 'Digital Service', value: totalTransactions > 0 ? Math.round((totalImeiOrders / totalTransactions) * 100) : 0, count: totalImeiOrders, color: '#10b981' },
      { name: 'Server Service', value: totalTransactions > 0 ? Math.round((totalServerOrders / totalTransactions) * 100) : 0, count: totalServerOrders, color: '#06b6d4' },
      { name: 'Marketplace', value: totalTransactions > 0 ? Math.round((totalMarketplaceOrders / totalTransactions) * 100) : 0, count: totalMarketplaceOrders, color: '#8b5cf6' },
      { name: 'Top Up', value: totalTransactions > 0 ? Math.round((totalTopupOrders / totalTransactions) * 100) : 0, count: totalTopupOrders, color: '#f59e0b' },
      { name: 'Transaksi Aman', value: totalTransactions > 0 ? Math.round((totalRekber / totalTransactions) * 100) : 0, count: totalRekber, color: '#ec4899' },
    ]

    // Communication mix for donut
    const totalComm = totalKonsultasi + totalRemote + totalChat
    const communicationMix = [
      { name: 'Chat', value: totalComm > 0 ? Math.round((totalChat / totalComm) * 100) : 0, count: totalChat, color: '#10b981' },
      { name: 'Konsultasi', value: totalComm > 0 ? Math.round((totalKonsultasi / totalComm) * 100) : 0, count: totalKonsultasi, color: '#06b6d4' },
      { name: 'Remote', value: totalComm > 0 ? Math.round((totalRemote / totalComm) * 100) : 0, count: totalRemote, color: '#f59e0b' },
    ]

    // Success rate
    const totalOrdersWithStatus = totalImeiOrders + totalServerOrders
    const totalSuccessOrders = imeiSuccess + serverSuccess
    const successRate = totalOrdersWithStatus > 0 ? Math.round((totalSuccessOrders / totalOrdersWithStatus) * 100) : 0

    // --- Time-series data (last 7 days) for line/bar/area charts ---
    // Flattened into a single Promise.all (56 queries in parallel, not sequential)
    const days7: string[] = []
    const dayRanges: Array<{ gte: Date; lt: Date }> = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      days7.push(dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
      dayRanges.push({ gte: dayStart, lt: dayEnd })
    }

    const dailyQueries = dayRanges.flatMap((range) => [
      prisma.imeiOrder.count({ where: { createdAt: range } }),
      prisma.serverOrder.count({ where: { createdAt: range } }),
      prisma.chatMessage.count({ where: { createdAt: range } }),
      prisma.konsultasiSession.count({ where: { createdAt: range } }),
      prisma.remoteSession.count({ where: { createdAt: range } }),
      prisma.walletLedger.count({ where: { type: 'TOPUP', createdAt: range } }),
      prisma.imeiOrder.aggregate({ _sum: { price: true }, where: { createdAt: range, status: 'SUCCESS' } }),
      prisma.serverOrder.aggregate({ _sum: { price: true }, where: { createdAt: range, status: 'SUCCESS' } }),
    ])

    const dailyResults = await Promise.all(dailyQueries)

    const dailyImei: number[] = []
    const dailyServer: number[] = []
    const dailyChat: number[] = []
    const dailyKonsultasi: number[] = []
    const dailyRemote: number[] = []
    const dailyDeposit: number[] = []
    const dailyRevenue: number[] = []

    for (let day = 0; day < 7; day++) {
      const offset = day * 8
      dailyImei.push(dailyResults[offset] as number)
      dailyServer.push(dailyResults[offset + 1] as number)
      dailyChat.push(dailyResults[offset + 2] as number)
      dailyKonsultasi.push(dailyResults[offset + 3] as number)
      dailyRemote.push(dailyResults[offset + 4] as number)
      dailyDeposit.push(dailyResults[offset + 5] as number)
      const imeiRev = dailyResults[offset + 6] as { _sum: { price: unknown } }
      const serverRev = dailyResults[offset + 7] as { _sum: { price: unknown } }
      dailyRevenue.push(Number(imeiRev._sum.price ?? 0) + Number(serverRev._sum.price ?? 0))
    }

    // Order status breakdown for stacked bar
    const imeiRejected = await prisma.imeiOrder.count({ where: { status: 'REJECTED' } })
    const imeiCancelled = await prisma.imeiOrder.count({ where: { status: 'CANCELLED' } })
    const imeiInProcess = await prisma.imeiOrder.count({ where: { status: 'IN_PROCESS' } })
    const serverRejected = await prisma.serverOrder.count({ where: { status: 'REJECTED' } })
    const serverCancelled = await prisma.serverOrder.count({ where: { status: 'CANCELLED' } })
    const serverInProcess = await prisma.serverOrder.count({ where: { status: 'IN_PROCESS' } })

    const orderStatusBreakdown = {
      categories: ['Digital Service', 'Server Service'],
      series: [
        { name: 'Sukses', data: [imeiSuccess, serverSuccess] },
        { name: 'Pending', data: [imeiPending, serverPending] },
        { name: 'In Process', data: [imeiInProcess, serverInProcess] },
        { name: 'Rejected', data: [imeiRejected, serverRejected] },
        { name: 'Cancelled', data: [imeiCancelled, serverCancelled] },
      ],
    }

    // Top products by sold count (bar chart)
    const topProductsBySold = await prisma.product.findMany({
      where: { soldCount: { gt: 0 } },
      orderBy: { soldCount: 'desc' },
      take: 8,
      select: { name: true, soldCount: true, views: true, price: true },
    })

    const data = {
      overview: {
        totalUsers,
        totalTeknisi,
        totalTransactions,
        totalRevenue: (
          Number(imeiRevenue._sum.price ?? 0) +
          Number(serverRevenue._sum.price ?? 0) +
          Number(marketplaceRevenue._sum.total ?? 0)
        ).toString(),
        totalWalletBalance: (totalWalletBalance._sum.balance ?? 0).toString(),
        successRate,
        ordersToday,
        chatMessagesToday,
        depositsToday,
      },
      orders: {
        imei: { total: totalImeiOrders, success: imeiSuccess, pending: imeiPending, revenue: (imeiRevenue._sum.price ?? 0).toString() },
        server: { total: totalServerOrders, success: serverSuccess, pending: serverPending, revenue: (serverRevenue._sum.price ?? 0).toString() },
        marketplace: { total: totalMarketplaceOrders, revenue: (marketplaceRevenue._sum.total ?? 0).toString() },
        topup: { total: totalTopupOrders },
        rekber: { total: totalRekber },
      },
      communication: {
        chat: { total: totalChat, messages: totalChatMessages, messagesToday: chatMessagesToday },
        konsultasi: { total: totalKonsultasi, last7d: konsultasi7d },
        remote: { total: totalRemote, last7d: remote7d },
      },
      products: {
        total: totalProducts,
        published: publishedProducts,
        totalViews: totalProductViews._sum.views ?? 0,
        totalSold: totalProductSold._sum.soldCount ?? 0,
      },
      deposits: {
        total: totalDeposits,
        today: depositsToday,
        last30d: deposits30d,
      },
      charts: {
        transactionMix,
        communicationMix,
        daily: {
          labels: days7,
          imei: dailyImei,
          server: dailyServer,
          chat: dailyChat,
          konsultasi: dailyKonsultasi,
          remote: dailyRemote,
          deposit: dailyDeposit,
          revenue: dailyRevenue,
        },
        orderStatusBreakdown,
        topProducts: topProductsBySold.map((p) => ({
          name: p.name.length > 25 ? p.name.slice(0, 25) + '…' : p.name,
          sold: p.soldCount,
          views: p.views,
          price: Number(p.price),
        })),
      },
      period: {
        orders7d,
        orders30d,
      },
    }

    return apiSuccess(data)
  } catch (e) {
    console.error('[ADMIN_LAPORAN_GET]', e)
    return apiError('Gagal memuat data laporan', 500)
  }
}
