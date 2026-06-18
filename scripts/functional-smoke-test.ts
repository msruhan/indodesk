/**
 * Functional Smoke Test (API-level)
 *
 * Mengeksekusi subset core P0 dari paket dokumentasi
 * `indoteknizi/docs/functional-tests/` lewat HTTP API langsung.
 *
 * Tujuan: validasi behavior aplikasi tanpa harus klik manual di browser.
 * Cakupan: subset, bukan semua 170 test case (core flow + RBAC samples).
 *
 * Prasyarat:
 *   - PostgreSQL berjalan, DB ter-seed default + stress seed
 *   - `STRESS_TEST_MODE=true` di .env (untuk endpoint /api/stress-internal/login)
 *   - `npm run dev` aktif di port 3000
 *
 * Usage:
 *   npx tsx scripts/functional-smoke-test.ts [--base http://localhost:3000]
 *
 * Output:
 *   - Console: pass/fail per test case
 *   - File: indoteknizi/docs/functional-tests/results/<date>-smoke-run.md
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// ------------------------------------------------------------------------------------
// Config
// ------------------------------------------------------------------------------------

const BASE_URL = (() => {
  const idx = process.argv.indexOf('--base')
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'http://localhost:3000'
})()

const RESULTS_DIR = join(process.cwd(), 'docs', 'functional-tests', 'results')

const STRESS_USER = 'stress-user-1@indoteknizi.test'
const STRESS_USER_2 = 'stress-user-2@indoteknizi.test'
const STRESS_TEKNISI = 'stress-teknisi-1@indoteknizi.test'
const STRESS_PASSWORD = 'StressTest123!'

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

type TestResult = {
  id: string
  title: string
  domain: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  durationMs: number
  message?: string
  details?: Record<string, unknown>
}

type CookieJar = {
  cookies: Map<string, string>
  toHeader(): string
  setFromResponse(res: Response): void
}

// ------------------------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------------------------

function makeJar(): CookieJar {
  const cookies = new Map<string, string>()
  return {
    cookies,
    toHeader() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    setFromResponse(res: Response) {
      // Read all Set-Cookie headers (Headers.getSetCookie() in modern Node)
      const setCookieHeader = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.()
      const list: string[] = setCookieHeader ?? []
      if (list.length === 0) {
        const single = res.headers.get('set-cookie')
        if (single) list.push(single)
      }
      for (const sc of list) {
        const [pair] = sc.split(';')
        const eq = pair.indexOf('=')
        if (eq < 0) continue
        const name = pair.slice(0, eq).trim()
        const value = pair.slice(eq + 1).trim()
        cookies.set(name, value)
      }
    },
  }
}

async function request(
  jar: CookieJar | null,
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; data: any; raw: Response }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...extraHeaders,
  }
  if (jar) {
    const cookieHeader = jar.toHeader()
    if (cookieHeader) headers.cookie = cookieHeader
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  if (jar) jar.setFromResponse(res)
  let data: any = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { status: res.status, data, raw: res }
}

async function login(jar: CookieJar, email: string, password = STRESS_PASSWORD): Promise<boolean> {
  const { status } = await request(jar, 'POST', '/api/stress-internal/login', { email, password })
  return status === 200
}

// ------------------------------------------------------------------------------------
// Test runner
// ------------------------------------------------------------------------------------

const results: TestResult[] = []

async function runTest(
  id: string,
  title: string,
  domain: string,
  fn: () => Promise<void>,
): Promise<void> {
  const started = Date.now()
  process.stdout.write(`  [${id}] ${title}... `)
  try {
    await fn()
    const durationMs = Date.now() - started
    results.push({ id, title, domain, status: 'PASS', durationMs })
    console.log(`✅ PASS (${durationMs}ms)`)
  } catch (error) {
    const durationMs = Date.now() - started
    const message = error instanceof Error ? error.message : String(error)
    results.push({ id, title, domain, status: 'FAIL', durationMs, message })
    console.log(`❌ FAIL (${durationMs}ms)`)
    console.log(`     → ${message}`)
  }
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// ------------------------------------------------------------------------------------
// Test suites
// ------------------------------------------------------------------------------------

async function suiteAuth(): Promise<void> {
  console.log('\n=== Domain: AUTH (Account / Auth / Profile) ===')

  await runTest(
    'FT-AUTH-002',
    'Login dengan credentials (USER) — stress account',
    'AUTH',
    async () => {
      const jar = makeJar()
      const ok = await login(jar, STRESS_USER)
      assert(ok, 'login failed')
      const session = await request(jar, 'GET', '/api/auth/session')
      assertEqual(session.status, 200, 'session GET status')
      assert(
        session.data?.user?.email === STRESS_USER,
        `session.user.email mismatch (got ${session.data?.user?.email})`,
      )
    },
  )

  await runTest(
    'FT-AUTH-101',
    'Login dengan kredensial salah ditolak',
    'AUTH',
    async () => {
      const jar = makeJar()
      const res = await request(jar, 'POST', '/api/stress-internal/login', {
        email: STRESS_USER,
        password: 'WrongPassword!@#',
      })
      assert(res.status === 401 || res.status === 400, `expected 4xx, got ${res.status}`)
    },
  )

  await runTest(
    'FT-AUTH-105',
    'Akses endpoint user/profile tanpa session ditolak',
    'AUTH',
    async () => {
      const res = await request(null, 'GET', '/api/user/profile')
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )
}

async function suiteMarketplace(): Promise<void> {
  console.log('\n=== Domain: MKT (Marketplace) ===')

  await runTest(
    'FT-MKT-001',
    'Browse listing publik (Guest, no auth)',
    'MKT',
    async () => {
      const res = await request(null, 'GET', '/api/marketplace/products?limit=5')
      assertEqual(res.status, 200, 'GET products status')
      assert(res.data?.success === true, 'response.success not true')
      assert(Array.isArray(res.data?.data), 'data not array')
      assert(res.data.data.length > 0, 'no products returned')
    },
  )

  await runTest(
    'FT-MKT-003',
    'Checkout marketplace via wallet (USER stress-1)',
    'MKT',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')

      // ambil produk stress (stock 9999) untuk checkout
      const products = await request(jar, 'GET', '/api/marketplace/products?limit=5&q=%5BSTRESS%5D')
      assertEqual(products.status, 200, 'list products')
      const product = (products.data?.data ?? []).find((p: any) => p?.name?.includes('[STRESS]'))
      assert(product, 'no stress product found')

      const checkout = await request(jar, 'POST', '/api/marketplace/checkout', {
        items: [{ productId: product.id, quantity: 1 }],
      })
      assert(
        checkout.status === 200 || checkout.status === 201,
        `checkout status ${checkout.status}, body=${JSON.stringify(checkout.data)}`,
      )
      assert(checkout.data?.success === true, `checkout failed: ${JSON.stringify(checkout.data)}`)
    },
  )

  await runTest(
    'FT-MKT-103',
    'Checkout payload tanpa items ditolak',
    'MKT',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')
      const res = await request(jar, 'POST', '/api/marketplace/checkout', { items: [] })
      assert(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status}`)
    },
  )

  await runTest(
    'FT-MKT-105',
    'Checkout tanpa autentikasi ditolak',
    'MKT',
    async () => {
      const res = await request(null, 'POST', '/api/marketplace/checkout', {
        items: [{ productId: 'fake', quantity: 1 }],
      })
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )
}

async function suiteWallet(): Promise<void> {
  console.log('\n=== Domain: WAL (Wallet) ===')

  await runTest(
    'FT-WAL-007',
    'USER lihat saldo wallet & ledger',
    'WAL',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')

      const wallet = await request(jar, 'GET', '/api/wallet')
      assertEqual(wallet.status, 200, 'GET wallet status')
      assert(wallet.data?.success === true, 'wallet response not success')
      // Balance can be string (Decimal serialized) or number
      const bal = wallet.data?.data?.balance
      assert(
        typeof bal === 'number' || typeof bal === 'string',
        `wallet balance not number/string (got ${typeof bal})`,
      )

      const tx = await request(jar, 'GET', '/api/wallet/transactions?limit=5')
      assertEqual(tx.status, 200, 'GET wallet transactions status')
      assert(tx.data?.success === true, 'tx response not success')
    },
  )

  await runTest(
    'FT-WAL-901',
    'USER non-admin akses /api/admin/wallet ditolak',
    'WAL',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')
      const res = await request(jar, 'GET', '/api/admin/wallet')
      assert(
        res.status === 401 || res.status === 403 || res.status === 404,
        `expected 401/403/404, got ${res.status}`,
      )
    },
  )
}

async function suiteRekber(): Promise<void> {
  console.log('\n=== Domain: RKB (Rekber) ===')

  await runTest(
    'FT-RKB-005',
    'USER lihat list rekber miliknya',
    'RKB',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')
      const res = await request(jar, 'GET', '/api/rekber?limit=5')
      assert(
        res.status === 200,
        `expected 200, got ${res.status} body=${JSON.stringify(res.data).slice(0, 200)}`,
      )
      assert(res.data?.success === true || Array.isArray(res.data?.data), 'unexpected response shape')
    },
  )
}

async function suiteImei(): Promise<void> {
  console.log('\n=== Domain: IMEI (IMEI Services) ===')

  await runTest(
    'FT-IMEI-001',
    'Browse katalog IMEI services',
    'IMEI',
    async () => {
      const res = await request(null, 'GET', '/api/imei/services?limit=10')
      assertEqual(res.status, 200, 'GET imei services status')
      assert(res.data?.success === true, 'response not success')
      // Response shape: data.services (array) atau data (array)
      const arr = Array.isArray(res.data?.data?.services)
        ? res.data.data.services
        : Array.isArray(res.data?.data)
          ? res.data.data
          : null
      assert(Array.isArray(arr), 'services array not found in response')
    },
  )

  await runTest(
    'FT-IMEI-101',
    'Submit IMEI order tanpa auth ditolak',
    'IMEI',
    async () => {
      const res = await request(null, 'POST', '/api/imei/orders', {
        serviceId: 'fake',
        imei: '123456789012345',
      })
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )
}

async function suiteTopup(): Promise<void> {
  console.log('\n=== Domain: TOP (Topup) ===')

  await runTest(
    'FT-TOP-001',
    'Browse katalog topup (public read)',
    'TOP',
    async () => {
      const res = await request(null, 'GET', '/api/topup/catalog')
      assert(res.status === 200, `expected 200, got ${res.status}`)
      assert(
        res.data?.success === true || Array.isArray(res.data?.data) || Array.isArray(res.data),
        'unexpected response shape',
      )
    },
  )
}

async function suiteAdmin(): Promise<void> {
  console.log('\n=== Domain: ADM (Admin Governance) ===')

  await runTest(
    'FT-ADM-901',
    'USER mengakses /api/admin/users ditolak',
    'ADM',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')
      const res = await request(jar, 'GET', '/api/admin/users')
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )

  await runTest(
    'FT-ADM-902',
    'TEKNISI mengakses /api/admin/* ditolak',
    'ADM',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_TEKNISI), 'login failed')
      const res = await request(jar, 'GET', '/api/admin/users')
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )
}

async function suitePublicReads(): Promise<void> {
  console.log('\n=== Domain: Public Reads (Notifications, Banners, Stores) ===')

  await runTest(
    'FT-MKT-008',
    'Endpoint public banners tersedia',
    'MKT',
    async () => {
      const res = await request(null, 'GET', '/api/banners')
      assert(res.status === 200, `expected 200, got ${res.status}`)
    },
  )

  await runTest(
    'FT-STR-008',
    'Endpoint public list stores tersedia',
    'STR',
    async () => {
      const res = await request(null, 'GET', '/api/stores?limit=3')
      assert(res.status === 200, `expected 200, got ${res.status}`)
    },
  )

  await runTest(
    'FT-NOT-080',
    'USER lihat platform notifications miliknya',
    'NOT',
    async () => {
      const jar = makeJar()
      assert(await login(jar, STRESS_USER), 'login failed')
      const res = await request(jar, 'GET', '/api/notifications?limit=5')
      assert(res.status === 200, `expected 200, got ${res.status}`)
    },
  )
}

async function suiteSecurity(): Promise<void> {
  console.log('\n=== Security hardening smoke ===')

  await runTest(
    'FT-SEC-001',
    'Telegram webhook tanpa secret ditolak (401)',
    'SEC',
    async () => {
      const res = await request(null, 'POST', '/api/telegram/webhook', { update_id: 1 })
      assert(
        res.status === 401 || res.status === 503,
        `expected 401/503 when secret enforced, got ${res.status}`,
      )
    },
  )

  await runTest(
    'FT-SEC-002',
    'Forgot-password POST dengan Origin allowlist',
    'SEC',
    async () => {
      const res = await request(
        null,
        'POST',
        '/api/auth/forgot-password',
        { email: 'nobody@example.com' },
        { origin: BASE_URL.replace(/\/$/, '') },
      )
      assert(res.status === 200, `expected 200, got ${res.status}`)
      assert(res.data?.success === true, 'expected success true (anti-enumeration)')
    },
  )

  await runTest(
    'FT-SEC-003',
    'Cron endpoint tanpa Bearer ditolak',
    'SEC',
    async () => {
      const res = await request(null, 'GET', '/api/cron/imei-orders')
      assert(res.status === 401 || res.status === 503, `expected 401/503, got ${res.status}`)
    },
  )

  await runTest(
    'FT-SEC-004',
    'API state-changing tanpa Origin ditolak (CSRF)',
    'SEC',
    async () => {
      const res = await request(null, 'POST', '/api/auth/register', {
        name: 'CSRF Test',
        email: `csrf-${Date.now()}@example.com`,
        password: 'Strong#Pass1',
        phone: '+6281234567890',
      })
      assert(res.status === 403, `expected 403 CSRF, got ${res.status}`)
    },
  )
}

async function suiteRbacGuest(): Promise<void> {
  console.log('\n=== RBAC: Guest access ===')

  await runTest(
    'FT-SMOKE-901',
    'Guest GET /api/user/profile ditolak',
    'CROSS',
    async () => {
      const res = await request(null, 'GET', '/api/user/profile')
      assert(
        res.status === 401 || res.status === 403,
        `expected 401/403, got ${res.status}`,
      )
    },
  )

  await runTest(
    'FT-SMOKE-902',
    'Guest GET /api/teknisi/dashboard ditolak',
    'CROSS',
    async () => {
      const res = await request(null, 'GET', '/api/teknisi/dashboard')
      assert(
        res.status === 401 || res.status === 403 || res.status === 404,
        `expected 401/403/404, got ${res.status}`,
      )
    },
  )

  await runTest(
    'FT-SMOKE-903',
    'Guest GET /api/admin/dashboard ditolak',
    'CROSS',
    async () => {
      const res = await request(null, 'GET', '/api/admin/dashboard')
      assert(
        res.status === 401 || res.status === 403 || res.status === 404,
        `expected 401/403/404, got ${res.status}`,
      )
    },
  )
}

// ------------------------------------------------------------------------------------
// Reporter
// ------------------------------------------------------------------------------------

function generateReport(): string {
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length
  const total = results.length
  const verdict = failed === 0 ? '✅ ALL PASS' : '❌ SOME FAILURES'

  const totalDurationMs = results.reduce((s, r) => s + r.durationMs, 0)
  const avgDurationMs = total > 0 ? Math.round(totalDurationMs / total) : 0
  const p95DurationMs = (() => {
    const sorted = results.map((r) => r.durationMs).sort((a, b) => a - b)
    if (sorted.length === 0) return 0
    const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)
    return sorted[idx]
  })()

  const date = new Date().toISOString().slice(0, 10)
  const time = new Date().toISOString().slice(11, 19)

  const byDomain = new Map<string, TestResult[]>()
  for (const r of results) {
    const list = byDomain.get(r.domain) ?? []
    list.push(r)
    byDomain.set(r.domain, list)
  }

  const lines: string[] = []
  lines.push(`# Functional Smoke Test Report — ${date}`)
  lines.push('')
  lines.push(`**Run at**: ${date} ${time} UTC`)
  lines.push(`**Base URL**: ${BASE_URL}`)
  lines.push(`**Mode**: API-level smoke (no UI)`)
  lines.push(`**Auth bypass**: \`/api/stress-internal/login\` (STRESS_TEST_MODE=true)`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 1. Executive Summary')
  lines.push('')
  lines.push(`- **Verdict**: ${verdict}`)
  lines.push(`- **Total cases**: ${total}`)
  lines.push(`- **Pass**: ${passed} (${total ? Math.round((passed / total) * 100) : 0}%)`)
  lines.push(`- **Fail**: ${failed}`)
  lines.push(`- **Skip**: ${skipped}`)
  lines.push(`- **Total duration**: ${(totalDurationMs / 1000).toFixed(2)}s`)
  lines.push(`- **Avg per case**: ${avgDurationMs}ms`)
  lines.push(`- **P95 per case**: ${p95DurationMs}ms`)
  lines.push('')

  lines.push('## 2. Cakupan Test')
  lines.push('')
  lines.push('Smoke run ini hanya cover **subset core P0** dari paket dokumentasi. Test dijalankan via HTTP API, bukan klik manual di browser. Untuk validasi UI lengkap, tetap perlu QA manual mengikuti dokumen di `indoteknizi/docs/functional-tests/`.')
  lines.push('')
  lines.push(`Total ${total} test case dieksekusi lintas ${byDomain.size} domain.`)
  lines.push('')

  lines.push('## 3. Per-Domain Results')
  lines.push('')
  for (const [domain, list] of [...byDomain.entries()].sort()) {
    const domainPass = list.filter((r) => r.status === 'PASS').length
    const domainFail = list.filter((r) => r.status === 'FAIL').length
    const domainVerdict = domainFail === 0 ? '✅' : '❌'
    lines.push(`### ${domainVerdict} ${domain} (${domainPass}/${list.length} pass)`)
    lines.push('')
    lines.push('| ID | Test Case | Status | Duration | Note |')
    lines.push('| --- | --- | :---: | ---: | --- |')
    for (const r of list) {
      const statusEmoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️'
      const note = r.message ? r.message.replace(/\|/g, '\\|').slice(0, 100) : '—'
      lines.push(`| ${r.id} | ${r.title} | ${statusEmoji} ${r.status} | ${r.durationMs}ms | ${note} |`)
    }
    lines.push('')
  }

  lines.push('## 4. Failed Tests Detail')
  lines.push('')
  const failures = results.filter((r) => r.status === 'FAIL')
  if (failures.length === 0) {
    lines.push('Tidak ada kegagalan. ✅')
  } else {
    for (const r of failures) {
      lines.push(`### ❌ ${r.id} — ${r.title}`)
      lines.push('')
      lines.push(`- **Domain**: ${r.domain}`)
      lines.push(`- **Duration**: ${r.durationMs}ms`)
      lines.push(`- **Error**: \`${r.message}\``)
      lines.push('')
    }
  }
  lines.push('')

  lines.push('## 5. Konteks & Limitasi')
  lines.push('')
  lines.push('- **Bukan substitusi QA manual**: Smoke test ini hanya menyentuh API; flow UI seperti Google OAuth, 2FA TOTP scan QR, upload file via input, drag-drop foto, dan lifecycle order yang melibatkan polling worker eksternal **tidak di-cover**.')
  lines.push('- **STRESS_TEST_MODE aktif**: External provider (DhruFusion, BinderByte, Telegram) dimock. Behavior real provider perlu re-test di staging tanpa mode ini.')
  lines.push('- **Akun yang dipakai**: `stress-user-1@indoteknizi.test`, `stress-user-2@indoteknizi.test`, `stress-teknisi-1@indoteknizi.test` (semuanya pakai password `StressTest123!`).')
  lines.push('- **Database baseline**: `npm run db:reset` + `npm run db:seed` + `npm run stress:seed` sebelum run.')
  lines.push('')

  lines.push('## 6. Next Actions')
  lines.push('')
  if (failures.length > 0) {
    lines.push('1. Investigasi setiap kegagalan di section 4 — kemungkinan endpoint yang return 404 (belum diimplementasi) atau response shape yang berbeda dari ekspektasi.')
    lines.push('2. Jika test memang invalid (mis. endpoint memang belum ada), update smoke test runner di `scripts/functional-smoke-test.ts`.')
    lines.push('3. Untuk UI yang belum tertest, lanjutkan QA manual pakai dokumen `indoteknizi/docs/functional-tests/`.')
  } else {
    lines.push('1. Lanjutkan QA manual untuk skenario UI-only di `indoteknizi/docs/functional-tests/` (mis. upload foto, scan QR 2FA, drag-drop, polling worker).')
    lines.push('2. Pertimbangkan menambah lebih banyak skenario di smoke runner saat endpoint baru muncul.')
    lines.push('3. Re-run smoke test setiap kali ada perubahan API: `npx tsx scripts/functional-smoke-test.ts`.')
  }
  lines.push('')

  return lines.join('\n')
}

// ------------------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------------------

async function main(): Promise<number> {
  console.log(`Functional Smoke Test — base ${BASE_URL}`)
  console.log('============================================================')

  // Sanity: server reachable?
  try {
    const ping = await fetch(`${BASE_URL}/`)
    if (ping.status >= 500) {
      console.error(`Server returned ${ping.status} on /. Aborting.`)
      return 2
    }
  } catch (error) {
    console.error(`Cannot reach ${BASE_URL}: ${(error as Error).message}`)
    console.error('Pastikan `npm run dev` aktif sebelum menjalankan smoke test.')
    return 2
  }

  await suiteAuth()
  await suiteMarketplace()
  await suiteWallet()
  await suiteRekber()
  await suiteImei()
  await suiteTopup()
  await suiteAdmin()
  await suitePublicReads()
  await suiteSecurity()
  await suiteRbacGuest()

  console.log('')
  console.log('============================================================')
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const total = results.length
  console.log(`Total: ${total}  Pass: ${passed}  Fail: ${failed}`)

  // Write report
  mkdirSync(RESULTS_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const reportPath = join(RESULTS_DIR, `${date}-smoke-run.md`)
  writeFileSync(reportPath, generateReport())
  console.log(`\nReport written to: ${reportPath}`)

  return failed > 0 ? 1 : 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(2)
  })
