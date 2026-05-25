export function generateMarketplaceOrderCode(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ORD-${year}-${rand}`
}
