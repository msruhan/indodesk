/** Biaya platform rekber: 1% dari nominal transaksi (min Rp 5.000) */
export const REKBER_FEE_RATE = 0.01
export const REKBER_FEE_MIN = 5000

export function calculateRekberFee(amount: number): number {
  const fee = Math.round(amount * REKBER_FEE_RATE)
  return Math.max(fee, REKBER_FEE_MIN)
}

export function generateRekberOrderCode(): string {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `RKB-${year}-${seq}`
}
