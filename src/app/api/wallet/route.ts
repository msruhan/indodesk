import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { SESSION_STALE_CODE } from '@/lib/api-constants'
import { getBuyerEscrowSummary, getSellerPendingEarnings } from '@/lib/marketplace-wallet'
import { ensureUserWallet } from '@/lib/wallet/ensure-wallet'

export const dynamic = 'force-dynamic'

/** GET /api/wallet — get current user's wallet */
export async function GET() {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const wallet = await ensureUserWallet(session.user.id)

    const balance = Number(wallet.balance)
    const escrow = await getBuyerEscrowSummary(session.user.id)
    const pendingEarnings = await getSellerPendingEarnings(session.user.id)

    return apiSuccess({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance.toString(),
      heldBalance: String(escrow.heldBalance),
      totalBalance: String(balance + escrow.heldBalance),
      pendingHolds: escrow.pendingHolds,
      pendingEarnings: String(pendingEarnings),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    })
  } catch (e) {
    console.error('[WALLET_GET]', e)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Sesi login sudah tidak valid (database di-reset). Silakan logout lalu login kembali.',
          code: SESSION_STALE_CODE,
        },
        { status: 401 },
      )
    }
    return apiError('Gagal mengambil data wallet', 500)
  }
}
