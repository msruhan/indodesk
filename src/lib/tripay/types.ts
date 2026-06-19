export type TripayChannel = {
  group: string
  code: string
  name: string
  type: string
  fee_merchant: { flat: number; percent: number }
  fee_customer: { flat: number; percent: number }
  total_fee: { flat: number; percent: number }
  minimum_fee: number
  maximum_fee: number
  icon_url: string
  active: boolean
}

export type TripayFeeCalculatorResult = {
  code: string
  name: string
  fee: {
    flat: number
    percent: number
    min: number
    max: number
  }
  total_fee: {
    merchant: number
    customer: number
  }
}

export type TripayCreateTransactionResult = {
  reference: string
  merchant_ref: string
  payment_method: string
  payment_method_code: string
  total_amount: number
  fee_merchant: number
  fee_customer: number
  total_fee: number
  amount_received: number
  pay_code: string | null
  pay_url: string | null
  checkout_url: string | null
  status: string
  expired_time: number
  qr_string: string | null
  qr_url: string | null
}

export type TripayCallbackPayload = {
  reference: string
  merchant_ref: string
  payment_method: string
  payment_method_code: string
  total_amount: number
  fee_merchant: number
  fee_customer: number
  amount_received: number
  is_closed_payment: number
  status: 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUND'
  paid_at: number | null
  note: string | null
}

export type TripayApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}
