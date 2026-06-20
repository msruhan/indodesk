import { isStressTestMode, mockDelay } from './stress-mode'
import { CHECKOUT_COURIER_CODES } from '@/lib/shipping-config'

const LOCATIONS_URL = 'https://api.binderbyte.com/v1/locations'
const COST_URL = 'https://api.binderbyte.com/v1/cost'
const LIST_COURIER_URL = 'https://api.binderbyte.com/v1/list_courier'

export type BinderbyteLocationType = 'city' | 'district' | 'village' | string

export type BinderbyteLocation = {
  id: string
  type: BinderbyteLocationType
  label: string
}

export type ShippingCostOption = {
  courier: string
  courierName: string
  service: string
  type: string
  price: number
  estimated: string
}

export type ShippingCostQuote = {
  origin: { id: string; label: string }
  destination: { id: string; label: string }
  weight: number
  options: ShippingCostOption[]
}

export class BinderbyteShippingError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'API_ERROR' | 'INVALID_LOCATION',
  ) {
    super(message)
    this.name = 'BinderbyteShippingError'
  }
}

function getApiKey(): string {
  const apiKey = process.env.BINDERBYTE_API_KEY?.trim()
  if (!apiKey) {
    throw new BinderbyteShippingError(
      'BINDERBYTE_API_KEY belum dikonfigurasi di server',
      'NOT_CONFIGURED',
    )
  }
  return apiKey
}

export function isBinderbyteShippingConfigured(): boolean {
  if (isStressTestMode()) return true
  return Boolean(process.env.BINDERBYTE_API_KEY?.trim())
}

type LocationsApiResponse = {
  code?: string
  message?: string
  data?: Array<{ id?: string; type?: string; label?: string }>
}

type CostApiResponse = {
  code?: string
  message?: string
  data?: {
    origin?: { id?: string; label?: string }
    destination?: { id?: string; label?: string }
    weight?: string | number
    results?: Array<{
      code?: string
      name?: string
      costs?: Array<{
        service?: string
        type?: string
        price?: string | number
        estimated?: string
      }>
    }>
  }
}

export async function searchBinderbyteLocations(search: string): Promise<BinderbyteLocation[]> {
  const q = search.trim()
  if (q.length < 2) return []

  if (isStressTestMode()) {
    await mockDelay(100)
    if (/cilegon/i.test(q)) {
      return [
        { id: 'city_36.72', type: 'city', label: 'Cilegon, Banten' },
        { id: 'district_36.72.08', type: 'district', label: 'Citangkil, Cilegon' },
      ]
    }
    if (/citangkil/i.test(q)) {
      return [
        {
          id: 'village_36.72.08.1007',
          type: 'village',
          label: 'Citangkil, Citangkil, Cilegon (42441)',
        },
      ]
    }
    return [{ id: 'city_31.71', type: 'city', label: 'Jakarta Pusat, DKI Jakarta' }]
  }

  const apiKey = getApiKey()
  const params = new URLSearchParams({ api_key: apiKey, search: q })
  const res = await fetch(`${LOCATIONS_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  let json: LocationsApiResponse
  try {
    json = (await res.json()) as LocationsApiResponse
  } catch {
    throw new BinderbyteShippingError('Respons lokasi BinderByte tidak valid', 'API_ERROR')
  }

  if (!res.ok || json.code !== '200' || !Array.isArray(json.data)) {
    throw new BinderbyteShippingError(json.message ?? 'Gagal mencari lokasi', 'API_ERROR')
  }

  return json.data
    .filter((row): row is { id: string; type: string; label: string } =>
      Boolean(row.id && row.label),
    )
    .map((row) => ({
      id: row.id,
      type: row.type ?? 'unknown',
      label: row.label,
    }))
}

function parseCostOptions(data: NonNullable<CostApiResponse['data']>): ShippingCostOption[] {
  const options: ShippingCostOption[] = []
  for (const result of data.results ?? []) {
    const code = result.code ?? ''
    const name = result.name ?? code
    for (const cost of result.costs ?? []) {
      const price = Number(cost.price ?? 0)
      if (!Number.isFinite(price) || price <= 0) continue
      options.push({
        courier: code,
        courierName: name,
        service: cost.service ?? cost.type ?? 'STD',
        type: cost.type ?? cost.service ?? 'STD',
        price: Math.round(price),
        estimated: cost.estimated ?? '',
      })
    }
  }
  return options
}

async function fetchBinderbyteCostForCourier(
  origin: string,
  destination: string,
  weight: number,
  courier: string,
): Promise<CostApiResponse> {
  const apiKey = getApiKey()
  const body = new URLSearchParams({
    api_key: apiKey,
    origin,
    destination,
    weight: String(weight),
    courier,
  })

  const res = await fetch(COST_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  let json: CostApiResponse
  try {
    json = (await res.json()) as CostApiResponse
  } catch {
    throw new BinderbyteShippingError('Respons ongkir BinderByte tidak valid', 'API_ERROR')
  }

  if (!res.ok || json.code !== '200' || !json.data) {
    throw new BinderbyteShippingError(
      json.message ?? 'Gagal menghitung ongkir',
      json.message?.includes('prefix') ? 'INVALID_LOCATION' : 'API_ERROR',
    )
  }

  return json
}

export async function calculateBinderbyteShippingCost(
  originId: string,
  destinationId: string,
  weightKg: number,
  courier?: string,
  courierCodes: readonly string[] = CHECKOUT_COURIER_CODES,
): Promise<ShippingCostQuote> {
  const origin = originId.trim()
  const destination = destinationId.trim()
  if (!origin || !destination) {
    throw new BinderbyteShippingError('Origin dan destination wajib diisi', 'INVALID_LOCATION')
  }

  const weight = Math.max(1, Math.ceil(weightKg))

  if (isStressTestMode()) {
    await mockDelay(120)
    return {
      origin: { id: origin, label: 'Mock Origin' },
      destination: { id: destination, label: 'Mock Destination' },
      weight,
      options: [
        {
          courier: 'wahana',
          courierName: 'Wahana Express',
          service: 'Express',
          type: 'Express',
          price: 5000,
          estimated: '2-3 hari',
        },
        {
          courier: 'jnt',
          courierName: 'J&T Express',
          service: 'EZ',
          type: 'EZ',
          price: 12000,
          estimated: '2-3 hari',
        },
        {
          courier: 'jne',
          courierName: 'JNE Express',
          service: 'REG',
          type: 'REG',
          price: 13000,
          estimated: '2-2 hari',
        },
        {
          courier: 'sicepat',
          courierName: 'SiCepat',
          service: 'REG',
          type: 'REG',
          price: 10000,
          estimated: '2-3 hari',
        },
        {
          courier: 'anteraja',
          courierName: 'Anter Aja',
          service: 'REG',
          type: 'REG',
          price: 9500,
          estimated: '2-4 hari',
        },
        {
          courier: 'pos',
          courierName: 'POS Indonesia',
          service: 'Pos Reguler',
          type: 'Pos Reguler',
          price: 11000,
          estimated: '2 hari',
        },
      ],
    }
  }

  const couriers = courier
    ? [{ code: courier, description: courier }]
    : courierCodes.map((code) => ({ code, description: code }))

  if (couriers.length === 0) {
    throw new BinderbyteShippingError('Tidak ada kurir tersedia', 'API_ERROR')
  }

  const responses = await Promise.allSettled(
    couriers.map((row) => fetchBinderbyteCostForCourier(origin, destination, weight, row.code)),
  )

  const fulfilled = responses.filter(
    (result): result is PromiseFulfilledResult<CostApiResponse> => result.status === 'fulfilled',
  )

  if (fulfilled.length === 0) {
    const firstError = responses.find((result) => result.status === 'rejected')
    if (firstError?.status === 'rejected') {
      throw firstError.reason
    }
    throw new BinderbyteShippingError('Gagal menghitung ongkir', 'API_ERROR')
  }

  const options = fulfilled
    .flatMap((result) => parseCostOptions(result.value.data!))
    .sort((a, b) => a.price - b.price)

  const firstData = fulfilled[0].value.data!

  return {
    origin: {
      id: firstData.origin?.id ?? origin,
      label: firstData.origin?.label ?? origin,
    },
    destination: {
      id: firstData.destination?.id ?? destination,
      label: firstData.destination?.label ?? destination,
    },
    weight,
    options,
  }
}

export async function listBinderbyteCouriers(): Promise<Array<{ code: string; description: string }>> {
  if (isStressTestMode()) {
    return [
      { code: 'jne', description: 'JNE Express' },
      { code: 'jnt', description: 'J&T Express' },
    ]
  }

  const apiKey = getApiKey()
  const res = await fetch(`${LIST_COURIER_URL}?api_key=${encodeURIComponent(apiKey)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const json = (await res.json()) as Array<{ code?: string; description?: string }>
  if (!res.ok || !Array.isArray(json)) {
    throw new BinderbyteShippingError('Gagal mengambil daftar kurir', 'API_ERROR')
  }

  return json
    .filter((row) => row.code)
    .map((row) => ({ code: row.code!, description: row.description ?? row.code! }))
}
