/**
 * Verifikasi kesiapan uji Tripay sandbox di bantoo.in (tanpa login).
 *
 * Usage:
 *   npx tsx scripts/tripay-bantoo-verify.ts
 *   npx tsx scripts/tripay-bantoo-verify.ts --base https://bantoo.in
 */
const BASE = (() => {
  const idx = process.argv.indexOf('--base')
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'https://bantoo.in'
})()

const CALLBACK = `${BASE}/api/payments/tripay/callback`

async function main() {
  console.log(`Verifikasi Tripay staging: ${BASE}\n`)

  // 1. Health
  const health = await fetch(`${BASE}/api/health`)
  console.log(health.ok ? '✓' : '✗', `/api/health → HTTP ${health.status}`)

  // 2. Callback route harus ada (bukan 404 HTML)
  const cb = await fetch(CALLBACK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const cbText = await cb.text()
  const isHtml404 = cb.status === 404 && cbText.includes('<!DOCTYPE html')
  const isJson =
    cb.headers.get('content-type')?.includes('application/json') ?? cbText.trim().startsWith('{')

  if (isHtml404) {
    console.log('✗', `/api/payments/tripay/callback → 404 (kode Tripay belum di-deploy)`)
  } else if (isJson) {
    console.log('✓', `/api/payments/tripay/callback → HTTP ${cb.status} (route aktif)`)
    if (cb.status === 400) console.log('  (400 tanpa signature = normal)')
  } else {
    console.log('?', `/api/payments/tripay/callback → HTTP ${cb.status}`)
  }

  // 3. Channels butuh auth — cek route ada (401/503, bukan 404 HTML)
  const ch = await fetch(`${BASE}/api/payments/tripay/channels`)
  const chText = await ch.text()
  const chHtml404 = ch.status === 404 && chText.includes('<!DOCTYPE html')
  if (chHtml404) {
    console.log('✗', `/api/payments/tripay/channels → 404 (belum di-deploy)`)
  } else {
    console.log('✓', `/api/payments/tripay/channels → HTTP ${ch.status}`)
    if (ch.status === 401) console.log('  (401 = route ada, perlu login)')
    if (ch.status === 503) console.log('  (503 = TRIPAY_* belum di-set di server)')
  }

  console.log('\nLangkah berikutnya jika ada ✗:')
  console.log('  1. Deploy kode Tripay ke VPS (commit + release)')
  console.log('  2. Tambah TRIPAY_* sandbox ke /opt/indoteknizi/.env.production')
  console.log('  3. docker compose up -d app && prisma migrate deploy')
  console.log('  4. npm run test:tripay (API key valid)')
  console.log('  5. Uji topup di', BASE)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
