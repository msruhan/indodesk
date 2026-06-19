import { assertTripayConfigured } from '@/lib/tripay/config'
import { tripayApiSignature } from '@/lib/tripay/signature'
import type {
  TripayApiResponse,
  TripayChannel,
  TripayCreateTransactionResult,
  TripayFeeCalculatorResult,
} from '@/lib/tripay/types'

async function tripayFetch<T>(
  path: string,
  init?: RequestInit & { formBody?: Record<string, string> },
): Promise<TripayApiResponse<T>> {
  const cfg = assertTripayConfigured()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    ...(init?.headers as Record<string, string> | undefined),
  }

  let body: BodyInit | undefined
  if (init?.formBody) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(init.formBody).toString()
  } else if (init?.body) {
    body = init.body
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method: init?.method ?? 'GET',
    headers,
    body,
    cache: 'no-store',
  })

  const json = (await res.json()) as TripayApiResponse<T>
  if (!res.ok || !json.success) {
    const msg = json.message || `Tripay HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

export async function tripayGetPaymentChannels(): Promise<TripayChannel[]> {
  const json = await tripayFetch<TripayChannel[]>('/merchant/payment-channel')
  return json.data ?? []
}

export async function tripayFeeCalculator(
  amount: number,
  channelCode: string,
): Promise<TripayFeeCalculatorResult> {
  const qs = new URLSearchParams({
    code: channelCode,
    amount: String(amount),
  })
  const json = await tripayFetch<TripayFeeCalculatorResult>(
    `/merchant/fee-calculator?${qs.toString()}`,
  )
  if (!json.data) throw new Error('Tripay fee calculator returned empty data')
  return json.data
}

export type CreateTripayTransactionInput = {
  method: string
  merchantRef: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  orderItems: { name: string; price: number; quantity: number }[]
  returnUrl?: string
  expiredTimeSeconds?: number
}

export async function tripayCreateTransaction(
  input: CreateTripayTransactionInput,
): Promise<TripayCreateTransactionResult> {
  const cfg = assertTripayConfigured()
  const signature = tripayApiSignature(cfg.merchantCode!, input.merchantRef, input.amount)

  const formBody: Record<string, string> = {
    method: input.method,
    merchant_ref: input.merchantRef,
    amount: String(input.amount),
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    signature,
    callback_url: cfg.callbackUrl,
  }

  input.orderItems.forEach((item, i) => {
    formBody[`order_items[${i}][name]`] = item.name
    formBody[`order_items[${i}][price]`] = String(item.price)
    formBody[`order_items[${i}][quantity]`] = String(item.quantity)
  })

  if (input.customerPhone) formBody.customer_phone = input.customerPhone
  if (input.returnUrl) formBody.return_url = input.returnUrl
  if (input.expiredTimeSeconds) formBody.expired_time = String(input.expiredTimeSeconds)

  const json = await tripayFetch<TripayCreateTransactionResult>('/transaction/create', {
    method: 'POST',
    formBody,
  })
  if (!json.data) throw new Error('Tripay create transaction returned empty data')
  return json.data
}

export async function tripayGetTransactionDetail(reference: string) {
  const json = await tripayFetch<TripayCreateTransactionResult>(
    `/transaction/detail?reference=${encodeURIComponent(reference)}`,
  )
  return json.data ?? null
}
