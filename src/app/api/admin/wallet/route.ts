import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiRole } from '@/lib/api-auth'
import { z } from 'zod'
import { walletTransaction } from '@/lib/wallet/transaction'

export const dynamic = 'force-dynamic'

const adjustBalanceSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int('Jumlah harus bilangan bulat').positive('Jumlah harus lebih dari 0'),
  type: z.enum(['ADD', 'DEDUCT']),
  reason: z.string().min(1, 'Alasan wajib diisi'),
})

/** GET /api/admin/wallet — list all wallets */
export async function GET(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get specific user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          ledger: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      })

      if (!wallet) {
        return apiError('Wallet tidak ditemukan', 404)
      }

      return apiSuccess({
        ...wallet,
        balance: wallet.balance.toString(),
        ledger: wallet.ledger.map((l) => ({
          ...l,
          amount: l.amount.toString(),
          balance: l.balance.toString(),
        })),
      })
    }

    // List all wallets
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: { select: { ledger: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return apiSuccess(
      wallets.map((w) => ({
        ...w,
        balance: w.balance.toString(),
      })),
    )
  } catch (e) {
    console.error('[ADMIN_WALLET_GET]', e)
    return apiError('Gagal mengambil data wallet', 500)
  }
}

/** POST /api/admin/wallet — adjust user balance */
export async function POST(req: Request) {
  const { error } = await requireApiRole(['ADMIN'])
  if (error) return error

  try {
    const body = await req.json()
    const parsed = adjustBalanceSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message)
    }

    const { userId, amount, type, reason } = parsed.data

    const result = await walletTransaction(async (tx) => {
      // Get or create wallet inside transaction
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0 },
        })
      }

      // Calculate new balance
      const currentBalance = Number(wallet.balance)
      const adjustment = type === 'ADD' ? amount : -amount
      const newBalance = currentBalance + adjustment

      if (newBalance < 0) {
        throw new Error('INSUFFICIENT_BALANCE')
      }

      // Update wallet
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })

      // Create ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: type === 'ADD' ? 'EARNING' : 'PAYMENT',
          amount: adjustment,
          balance: newBalance,
          description: reason,
        },
      })

      return updated
    })

    return apiSuccess(
      {
        id: result.id,
        userId: result.userId,
        balance: result.balance.toString(),
        updatedAt: result.updatedAt,
      },
      201,
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return apiError('Saldo tidak cukup', 400)
    }
    console.error('[ADMIN_WALLET_POST]', e)
    return apiError('Gagal menyesuaikan saldo', 500)
  }
}
