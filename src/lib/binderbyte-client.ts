import { toBinderbyteCourier } from '@/lib/shipping-courier'
import { isStressTestMode, mockDelay } from './stress-mode'
import type { ShippingCourier } from '@prisma/client'

const TRACK_URL = 'https://api.binderbyte.com/v1/track'

export type BinderbyteHistoryItem = {
  date: string
  desc: string
  location: string
}

export type BinderbyteTrackResult = {
  awb: string
  courier: string
  status: string
  date: string | null
  desc: string
  origin: string
  destination: string
  shipper: string
  receiver: string
  history: BinderbyteHistoryItem[]
}

type BinderbyteApiResponse = {
  status: number
  message?: string
  data?: {
    summary?: {
      awb?: string
      courier?: string
      status?: string
      date?: string
      desc?: string
    }
    detail?: {
      origin?: string
      destination?: string
      shipper?: string
      receiver?: string
    }
    history?: Array<{ date?: string; desc?: string; location?: string }>
  }
}

export class BinderbyteError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'INVALID_AWB' | 'API_ERROR',
  ) {
    super(message)
    this.name = 'BinderbyteError'
  }
}

export function isBinderbyteConfigured(): boolean {
  if (isStressTestMode()) return true
  return Boolean(process.env.BINDERBYTE_API_KEY?.trim())
}

export async function trackShipment(
  courier: ShippingCourier,
  awb: string,
): Promise<BinderbyteTrackResult> {
  if (isStressTestMode()) {
    await mockDelay(150)
    const normalizedAwb = awb.trim().replace(/\s+/g, '') || 'STRESS-TEST-AWB'
    const now = new Date().toISOString()
    return {
      awb: normalizedAwb,
      courier: String(courier),
      status: 'ON PROCESS',
      date: now,
      desc: 'Stress test mock — paket dipickup kurir',
      origin: 'JKT',
      destination: 'JKT',
      shipper: 'Stress Test Shipper',
      receiver: 'Stress Test Receiver',
      history: [
        { date: now, desc: 'Mock event - picked up', location: 'JKT' },
      ],
    }
  }

  const apiKey = process.env.BINDERBYTE_API_KEY?.trim()
  if (!apiKey) {
    throw new BinderbyteError(
      'BINDERBYTE_API_KEY belum dikonfigurasi di server',
      'NOT_CONFIGURED',
    )
  }

  const normalizedAwb = awb.trim().replace(/\s+/g, '')
  if (!normalizedAwb || normalizedAwb.length < 6) {
    throw new BinderbyteError('Nomor resi tidak valid', 'INVALID_AWB')
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    courier: toBinderbyteCourier(courier),
    awb: normalizedAwb,
  })

  // JNE memerlukan param `number` tambahan (Postman BinderByte).
  if (toBinderbyteCourier(courier) === 'jne') {
    params.set('number', normalizedAwb)
  }

  const res = await fetch(`${TRACK_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  let json: BinderbyteApiResponse
  try {
    json = (await res.json()) as BinderbyteApiResponse
  } catch {
    throw new BinderbyteError('Respons BinderByte tidak valid', 'API_ERROR')
  }

  if (!res.ok || json.status !== 200 || !json.data?.summary) {
    const msg =
      json.message ??
      (res.status === 404
        ? 'Resi tidak ditemukan. Periksa kurir dan nomor resi.'
        : 'Gagal melacak resi')
    throw new BinderbyteError(msg, res.status === 404 ? 'INVALID_AWB' : 'API_ERROR')
  }

  const summary = json.data.summary
  const detail = json.data.detail ?? {}
  const history = (json.data.history ?? []).map((h) => ({
    date: h.date ?? '',
    desc: h.desc ?? '',
    location: h.location ?? '',
  }))

  return {
    awb: summary.awb ?? normalizedAwb,
    courier: summary.courier ?? courier,
    status: summary.status ?? 'UNKNOWN',
    date: summary.date ?? null,
    desc: summary.desc ?? '',
    origin: detail.origin ?? '',
    destination: detail.destination ?? '',
    shipper: detail.shipper ?? '',
    receiver: detail.receiver ?? '',
    history,
  }
}
