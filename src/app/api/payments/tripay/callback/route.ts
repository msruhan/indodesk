import { NextResponse } from 'next/server'
import { processTripayCallback } from '@/lib/payments/tripay-callback'
import { verifyTripayCallbackSignature } from '@/lib/tripay/signature'
import type { TripayCallbackPayload } from '@/lib/tripay/types'

export const dynamic = 'force-dynamic'

/** POST /api/payments/tripay/callback — Tripay payment status webhook */
export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('X-Callback-Signature')
  const event = req.headers.get('X-Callback-Event')

  if (!verifyTripayCallbackSignature(rawBody, signature)) {
    console.warn('[TRIPAY_CALLBACK] Invalid signature')
    return NextResponse.json({ success: false }, { status: 400 })
  }

  if (event !== 'payment_status') {
    return NextResponse.json({ success: true })
  }

  let payload: TripayCallbackPayload
  try {
    payload = JSON.parse(rawBody) as TripayCallbackPayload
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  try {
    const result = await processTripayCallback(payload)
    if (!result.ok) {
      return NextResponse.json({ success: false }, { status: 422 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[TRIPAY_CALLBACK]', e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
