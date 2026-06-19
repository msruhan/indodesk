/**
 * Smoke test koneksi Tripay sandbox (tanpa UI).
 *
 * Prasyarat: isi TRIPAY_* di .env dari dashboard Tripay:
 *   API & Integrasi → Simulator → Merchant → Detail
 *
 * Usage:
 *   npm run test:tripay
 *   npx tsx scripts/tripay-sandbox-smoke.ts --fee 50000 --channel QRIS
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

function mask(s: string | undefined) {
  if (!s) return '(kosong)'
  if (s.length <= 8) return '****'
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

async function main() {
  const { getTripayConfig } = await import('../src/lib/tripay/config')
  const { tripayGetPaymentChannels, tripayFeeCalculator } = await import('../src/lib/tripay/client')

  const cfg = getTripayConfig()
  console.log('Tripay config:')
  console.log('  mode:', cfg.mode)
  console.log('  baseUrl:', cfg.baseUrl)
  console.log('  merchantCode:', cfg.merchantCode || '(kosong)')
  console.log('  apiKey:', mask(cfg.apiKey))
  console.log('  privateKey:', mask(cfg.privateKey))
  console.log('  callbackUrl:', cfg.callbackUrl)

  if (!cfg.isConfigured) {
    console.error('\nFAIL: TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, dan TRIPAY_MERCHANT_CODE wajib diisi di .env')
    process.exit(1)
  }

  if (cfg.mode !== 'sandbox') {
    console.warn('\nWARN: TRIPAY_MODE bukan sandbox — pastikan ini sengaja untuk uji live.')
  }

  console.log('\nMengambil channel pembayaran…')
  const channels = await tripayGetPaymentChannels()
  const active = channels.filter((c) => c.active)
  if (active.length === 0) {
    console.error('FAIL: tidak ada channel aktif. Aktifkan di Simulator → Merchant → Channel Pembayaran')
    process.exit(1)
  }

  console.log(`OK — ${active.length} channel aktif:`)
  for (const c of active.slice(0, 12)) {
    console.log(`  - ${c.code} (${c.name}, ${c.group})`)
  }
  if (active.length > 12) console.log(`  … +${active.length - 12} lainnya`)

  const feeIdx = process.argv.indexOf('--fee')
  const channelIdx = process.argv.indexOf('--channel')
  const feeAmount = feeIdx >= 0 ? Number(process.argv[feeIdx + 1]) : 50_000
  const channelCode =
    channelIdx >= 0 ? process.argv[channelIdx + 1] : (active.find((c) => c.code === 'QRIS') ?? active[0]).code

  console.log(`\nFee calculator: Rp${feeAmount.toLocaleString('id-ID')} via ${channelCode}`)
  const fee = await tripayFeeCalculator(feeAmount, channelCode)
  const customerFee = fee.total_fee.customer
  const total = feeAmount + customerFee
  console.log('OK —', fee.name)
  console.log('  subtotal:', feeAmount)
  console.log('  fee pelanggan:', customerFee)
  console.log('  total dibayar:', total)

  const doCreate = process.argv.includes('--create')
  if (doCreate) {
    const { tripayCreateTransaction } = await import('../src/lib/tripay/client')
    const merchantRef = `SMOKE-${Date.now()}`
    const payAmount = feeAmount + customerFee
    console.log(`\nCreate transaction: Rp${payAmount.toLocaleString('id-ID')} via ${channelCode} …`)
    const tx = await tripayCreateTransaction({
      method: channelCode,
      merchantRef,
      amount: payAmount,
      customerName: 'Smoke Test',
      customerEmail: 'smoke-test@bantoo.in',
      orderItems: [{ name: 'Topup Saldo Bantoo', price: feeAmount, quantity: 1 }],
      returnUrl: 'https://bantoo.in/payments/smoke-test?status=return',
      expiredTimeSeconds: 3600,
    })
    console.log('OK — reference:', tx.reference, '| status:', tx.status)
    if (tx.qr_url) console.log('  qr_url:', tx.qr_url.slice(0, 72) + '…')
  }

  console.log('\nLangkah uji di browser (setelah npm run dev):')
  console.log('  1. Login → Dompet → Top up saldo → pilih Tripay')
  console.log('  2. Atau checkout marketplace/konsultasi/topup saat saldo tidak cukup')
  console.log('  3. Bayar via instruksi VA/QRIS di halaman /payments/[merchantRef]')
  console.log('  4. Simulasikan PAID di Tripay: API & Integrasi → Simulator')
  console.log('\nCallback lokal: jalankan ngrok http 3000 lalu set')
  console.log('  TRIPAY_CALLBACK_URL=https://<subdomain>.ngrok-free.app/api/payments/tripay/callback')
  console.log('  (atau uji di server bantoo.in dengan TRIPAY_MODE=sandbox)')
}

main().catch((e) => {
  console.error('\nFAIL:', e instanceof Error ? e.message : e)
  process.exit(1)
})
