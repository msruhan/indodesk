import { prisma } from '@/lib/db'
import {
  calculateBinderbyteShippingCost,
  isBinderbyteShippingConfigured,
  type ShippingCostOption,
} from '@/lib/binderbyte-shipping'
import { DEFAULT_SHIPPING_WEIGHT_KG, filterCheckoutShippingOptions } from '@/lib/shipping-config'
import { loadTeknisiShipOrigin } from '@/lib/teknisi-ship-origin'
import {
  loadTeknisiShippingCouriers,
  loadTeknisiShippingCouriersBySeller,
} from '@/lib/teknisi-shipping-couriers'

export type SellerShippingQuote = {
  sellerId: string
  sellerName: string
  originId: string | null
  originLabel: string | null
  weightKg: number
  options: ShippingCostOption[]
  error: string | null
}

export type ShippingRatesQuoteResult = {
  destinationId: string
  bySeller: SellerShippingQuote[]
  totalOptions: number
}

export async function quoteShippingRatesBySeller(
  destinationLocationId: string,
  sellerIds: string[],
  weightBySeller: Record<string, number> = {},
  defaultWeightKg = DEFAULT_SHIPPING_WEIGHT_KG,
): Promise<ShippingRatesQuoteResult> {
  if (!isBinderbyteShippingConfigured()) {
    throw new Error('SHIPPING_API_UNAVAILABLE')
  }

  const uniqueSellerIds = [...new Set(sellerIds.filter(Boolean))]
  if (uniqueSellerIds.length === 0) {
    return { destinationId: destinationLocationId, bySeller: [], totalOptions: 0 }
  }

  const stores = await prisma.teknisiStore.findMany({
    where: { userId: { in: uniqueSellerIds } },
    select: { userId: true, name: true },
  })
  const storeNameBySeller = new Map(stores.map((s) => [s.userId, s.name]))

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueSellerIds } },
    select: { id: true, name: true },
  })
  const userNameBySeller = new Map(users.map((u) => [u.id, u.name]))

  const couriersBySeller = await loadTeknisiShippingCouriersBySeller(uniqueSellerIds)

  const bySeller: SellerShippingQuote[] = []

  for (const sellerId of uniqueSellerIds) {
    const sellerName =
      storeNameBySeller.get(sellerId) ?? userNameBySeller.get(sellerId) ?? 'Penjual'
    const origin = await loadTeknisiShipOrigin(sellerId)
    const originId = origin.originId
    const originLabel = origin.originLabel

    const sellerCouriers = couriersBySeller.get(sellerId) ?? []

    if (!originId) {
      bySeller.push({
        sellerId,
        sellerName,
        originId: null,
        originLabel: null,
        weightKg: weightBySeller[sellerId] ?? defaultWeightKg,
        options: [],
        error: 'Teknisi belum mengatur alamat pengiriman di profil',
      })
      continue
    }

    if (sellerCouriers.length === 0) {
      bySeller.push({
        sellerId,
        sellerName,
        originId,
        originLabel,
        weightKg: weightBySeller[sellerId] ?? defaultWeightKg,
        options: [],
        error: 'Penjual belum mengatur kurir pengiriman di profil',
      })
      continue
    }

    const sellerWeightKg = Math.max(
      1,
      Math.ceil(weightBySeller[sellerId] ?? defaultWeightKg),
    )

    try {
      const quote = await calculateBinderbyteShippingCost(
        originId,
        destinationLocationId,
        sellerWeightKg,
        undefined,
        sellerCouriers,
      )
      const options = filterCheckoutShippingOptions(quote.options, sellerCouriers)
      bySeller.push({
        sellerId,
        sellerName,
        originId,
        originLabel: quote.origin.label || originLabel,
        weightKg: quote.weight,
        options,
        error: options.length === 0 ? 'Tidak ada layanan kurir tersedia' : null,
      })
    } catch (e) {
      bySeller.push({
        sellerId,
        sellerName,
        originId,
        originLabel,
        weightKg: sellerWeightKg,
        options: [],
        error: e instanceof Error ? e.message : 'Gagal menghitung ongkir',
      })
    }
  }

  return {
    destinationId: destinationLocationId,
    bySeller,
    totalOptions: bySeller.reduce((sum, row) => sum + row.options.length, 0),
  }
}

export async function resolveShippingSelectionCost(
  sellerId: string,
  destinationLocationId: string,
  courier: string,
  service: string,
  weightKg = DEFAULT_SHIPPING_WEIGHT_KG,
): Promise<{ cost: number; option: ShippingCostOption } | null> {
  const origin = await loadTeknisiShipOrigin(sellerId)
  if (!origin.originId) return null

  const sellerCouriers = await loadTeknisiShippingCouriers(sellerId)
  if (!sellerCouriers.includes(courier.toLowerCase())) return null

  const quote = await calculateBinderbyteShippingCost(
    origin.originId,
    destinationLocationId,
    weightKg,
    courier,
    sellerCouriers,
  )

  const option = quote.options.find(
    (o) => o.courier === courier && o.service === service,
  )
  if (!option) return null
  return { cost: option.price, option }
}
