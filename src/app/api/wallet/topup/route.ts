import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, requireApiAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const topupSchema = z.object({
  amount: z.number().min(10000, 'Minimal topup Rp 10.000'),
  paymentMethod: z.enum(['GATEWAY', 'PAYPAL', 'TRANSFER']),
  bankName: z.string().optional(), // for TRANSFER method
  accountName: z.string().optional(), // for TRANSFER method
  notes: z.string().optional(),
})

export interface TopupRequest {
  amount: number
  paymentMethod: 'GATEWAY' | 'PAYPAL' | 'TRANSFER'
  bankName?: string
  accountName?: string
  notes?: string
}

export interface TopupResponse {
  id: string
  userId: string
  amount: string
  paymentMethod: string
  status: string
  referenceId: string
  bankName?: string
  accountName?: string
  notes?: string
  createdAt: string
  expiresAt: string
}

/** POST /api/wallet/topup — create topup request */
export async function POST(req: Request) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = topupSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message)
    }

    const { amount, paymentMethod, bankName, accountName, notes } = parsed.data

    // Ensure wallet exists
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0 },
      })
    }

    // Create topup request
    const referenceId = `TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // For now, we'll store topup requests in a simple way
    // In production, you'd use a separate TopupRequest model
    const topupData: Record<string, unknown> = {
      userId: session.user.id,
      amount,
      paymentMethod,
      status: 'PENDING',
      referenceId,
      expiresAt,
      createdAt: new Date(),
    }

    if (bankName) topupData.bankName = bankName
    if (accountName) topupData.accountName = accountName
    if (notes) topupData.notes = notes

    // TODO: Store in database (need TopupRequest model)
    // For now, return success response
    return apiSuccess(
      {
        id: referenceId,
        userId: session.user.id,
        amount: amount.toString(),
        paymentMethod,
        status: 'PENDING',
        referenceId,
        bankName,
        accountName,
        notes,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      201,
    )
  } catch (e) {
    console.error('[WALLET_TOPUP_POST]', e)
    return apiError('Gagal membuat topup request', 500)
  }
}
