import { prisma } from '@/lib/db'
import {
  categoryRequiresShippingWeight,
  resolveProductWeightKg,
  type ShippingWeightLine,
} from '@/lib/product-weight'

/** Total berat (kg) per penjual dari baris checkout/keranjang — dihitung di server. */
export async function loadWeightBySellerFromLines(
  lines: ShippingWeightLine[],
): Promise<Record<string, number>> {
  if (lines.length === 0) return {}

  const productIds = [...new Set(lines.map((l) => l.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sellerId: true, category: true, weightKg: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  const bySeller: Record<string, number> = {}
  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product || !categoryRequiresShippingWeight(product.category)) continue
    const unitWeight = resolveProductWeightKg(Number(product.weightKg), product.category)
    bySeller[product.sellerId] =
      (bySeller[product.sellerId] ?? 0) + unitWeight * Math.max(1, line.quantity)
  }

  return bySeller
}
