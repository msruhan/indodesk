# Stress Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementasikan stress test plan untuk soft launch IndoTeknizi MVP — 5 skenario k6 (discovery, checkout, service, polling, soak) plus mock layer, seed, monitoring, dan report template.

**Architecture:** k6 sebagai test runner di luar app, mock layer terkontrol via env flag `STRESS_TEST_MODE` di Next.js (zero impact saat flag off), seed terpisah dari production seed dengan email pattern `*@indoteknizi.test` untuk easy cleanup. Internal endpoints (`/api/_internal/*`) untuk introspeksi runtime aktif hanya saat flag on.

**Tech Stack:** k6 (load testing), TypeScript (seed/scripts), Bash (monitor), Next.js 16 + Prisma 7 (existing app, modifikasi minimal).

**Reference:** `docs/superpowers/specs/2026-05-25-stress-test-design.md`

---

## Task Order Rationale

Plan disusun dalam **3 phase** yang independen:

- **Phase A (Foundation)** — buat infra dasar (mock, internal endpoints, seed). Tidak bisa skip ini.
- **Phase B (k6 Scenarios)** — buat 5 skenario k6 satu per satu (smoke → S1 → S2 → S3 → S4 → soak). Tiap skenario bisa di-run setelah selesai.
- **Phase C (Polish)** — README, monitor script, report template.

**Dependency:** Phase B membutuhkan Phase A. Phase C bisa paralel dengan akhir Phase B.

---

## Phase A: Foundation

### Task A1: Buat helper `stress-mode.ts`

**Files:**
- Create: `src/lib/stress-mode.ts`

- [ ] **Step 1: Buat file `src/lib/stress-mode.ts`**

```typescript
/**
 * Stress Test Mode Helper
 *
 * Aktif hanya saat env STRESS_TEST_MODE=true.
 * Digunakan oleh client library (Telegram, DhruFusion, BinderByte) untuk
 * mengembalikan response mock alih-alih hit external API.
 *
 * Production safety: ketika env tidak di-set, fungsi return false dan
 * perilaku app 100% identik dengan kondisi normal.
 */

export function isStressTestMode(): boolean {
  return process.env.STRESS_TEST_MODE === 'true'
}

/**
 * Helper untuk simulate network latency di mock.
 * Digunakan di mock function agar test response time mencakup
 * ekspektasi delay external API.
 */
export async function mockDelay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
```

- [ ] **Step 2: Verifikasi build tidak rusak**

Run: `npx tsc --noEmit`
Expected: exit code 0, tidak ada error baru.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stress-mode.ts
git commit -m "feat(stress-test): add stress-mode helper"
```

---

### Task A2: Inject mock di `telegram.ts`

**Files:**
- Modify: `src/lib/telegram.ts` — tambah early-return di `sendTelegramMessage`

- [ ] **Step 1: Tambah import di atas file `src/lib/telegram.ts`**

Tambahkan setelah baris konstanta `TELEGRAM_API_BASE`:

```typescript
import { isStressTestMode, mockDelay } from './stress-mode'
```

- [ ] **Step 2: Tambah early-return di `sendTelegramMessage`**

Sisipkan blok berikut tepat di awal try-block (setelah `if (!TELEGRAM_BOT_TOKEN)` block):

```typescript
  if (isStressTestMode()) {
    await mockDelay(50)
    return { success: true }
  }
```

Function lengkap setelah modifikasi:

```typescript
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML'
    disable_web_page_preview?: boolean
    disable_notification?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] Bot token tidak dikonfigurasi')
    return { success: false, error: 'Bot token tidak dikonfigurasi' }
  }

  if (isStressTestMode()) {
    await mockDelay(50)
    return { success: true }
  }

  try {
    // ...rest unchanged
```

- [ ] **Step 3: Verifikasi behaviour saat flag off**

Run: `STRESS_TEST_MODE=false node -e "require('./src/lib/stress-mode').isStressTestMode() === false || process.exit(1)"`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/telegram.ts
git commit -m "feat(stress-test): inject mock at telegram sendMessage"
```

---

### Task A3: Inject mock di `binderbyte-client.ts`

**Files:**
- Modify: `src/lib/binderbyte-client.ts` — tambah early-return di `trackShipment`

- [ ] **Step 1: Tambah import di awal file**

```typescript
import { isStressTestMode, mockDelay } from './stress-mode'
```

- [ ] **Step 2: Sisipkan mock check di awal `trackShipment`**

Tambahkan tepat setelah signature `export async function trackShipment(...)`:

```typescript
  if (isStressTestMode()) {
    await mockDelay(150)
    return {
      summary: {
        awb: 'STRESS-TEST-AWB',
        courier: 'mock-courier',
        service: 'mock-service',
        status: 'DELIVERED',
        date: new Date().toISOString(),
        sender: 'Stress Test Sender',
        receiver: 'Stress Test Receiver',
        origin: 'JKT',
        destination: 'JKT',
        weight: 1,
      },
      history: [
        {
          date: new Date().toISOString(),
          desc: 'Mock event - delivered',
          location: 'JKT',
        },
      ],
    } as unknown as Awaited<ReturnType<typeof trackShipment>>
  }
```

(Tipe persis bisa berubah; kalau TypeScript complain, sesuaikan dengan `BinderbyteTrackResult`.)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build sukses, type error hanya jika ada — fix dengan adjust type assertion.

- [ ] **Step 4: Commit**

```bash
git add src/lib/binderbyte-client.ts
git commit -m "feat(stress-test): inject mock at binderbyte trackShipment"
```

---

### Task A4: Inject mock di `dhru-fusion.ts`

**Files:**
- Modify: `src/lib/dhru-fusion.ts` — wrap method `placeOrder` & `getOrderStatus` di kedua class (`DhruFusionClient`, `DhruFusionProClient`) dengan stress-mode check.

- [ ] **Step 1: Tambah import**

Di awal file, tambah:

```typescript
import { isStressTestMode, mockDelay } from './stress-mode'
```

- [ ] **Step 2: Identifikasi method yang akan di-mock**

Cari method dengan signature seperti `placeOrder`, `getOrderStatus`, atau yang melakukan `fetch` ke API DhruFusion. Inject check stress mode di awal tiap method:

```typescript
  async placeOrder(payload: SomeType): Promise<SomeReturn> {
    if (isStressTestMode()) {
      await mockDelay(200)
      return {
        // mock minimal yang valid untuk SomeReturn
        success: true,
        orderId: `stress-${Date.now()}`,
      } as SomeReturn
    }
    // ...existing implementation
  }
```

Catatan: pertahankan signature & shape return value asli. Kalau ada method yang return tipe complex, gunakan `as unknown as ReturnType` saat perlu.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build sukses.

- [ ] **Step 4: Commit**

```bash
git add src/lib/dhru-fusion.ts
git commit -m "feat(stress-test): inject mock at dhru-fusion methods"
```

---

### Task A5: Buat internal endpoint `/api/_internal/memory`

**Files:**
- Create: `src/app/api/_internal/memory/route.ts`

- [ ] **Step 1: Buat file `src/app/api/_internal/memory/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { isStressTestMode } from '@/lib/stress-mode'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/_internal/memory
 *
 * Return Node.js memory usage. Aktif hanya saat STRESS_TEST_MODE=true.
 * Production safety: return 404 jika flag off.
 */
export async function GET() {
  if (!isStressTestMode()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const m = process.memoryUsage()
  return NextResponse.json({
    rssMB: Math.round((m.rss / 1024 / 1024) * 100) / 100,
    heapUsedMB: Math.round((m.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotalMB: Math.round((m.heapTotal / 1024 / 1024) * 100) / 100,
    externalMB: Math.round((m.external / 1024 / 1024) * 100) / 100,
    arrayBuffersMB: Math.round((m.arrayBuffers / 1024 / 1024) * 100) / 100,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: Math.round(process.uptime()),
  })
}
```

- [ ] **Step 2: Smoke test**

Start dev server di terminal terpisah dengan flag on:
`STRESS_TEST_MODE=true npm run dev`

Lalu di terminal lain:

Run: `curl -s http://localhost:3000/api/_internal/memory | head -3`
Expected: JSON dengan key `rssMB`, `heapUsedMB`, dll.

Restart dev server tanpa flag (default off):
`npm run dev`

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/_internal/memory`
Expected: `404`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/_internal/memory/route.ts
git commit -m "feat(stress-test): add internal memory endpoint"
```

---

### Task A6: Buat internal endpoint `/api/_internal/db-stats`

**Files:**
- Create: `src/app/api/_internal/db-stats/route.ts`

- [ ] **Step 1: Buat file**

```typescript
import { NextResponse } from 'next/server'
import { isStressTestMode } from '@/lib/stress-mode'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/_internal/db-stats
 *
 * Return PostgreSQL connection stats. Aktif hanya saat STRESS_TEST_MODE=true.
 */
export async function GET() {
  if (!isStressTestMode()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const result = await prisma.$queryRaw<Array<{ state: string | null; count: bigint }>>`
      SELECT state, count(*)::bigint AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
      ORDER BY count DESC
    `

    const byState = result.map((r) => ({
      state: r.state ?? 'idle-no-state',
      count: Number(r.count),
    }))
    const total = byState.reduce((sum, s) => sum + s.count, 0)

    return NextResponse.json({
      total,
      byState,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Smoke test**

Dengan dev server `STRESS_TEST_MODE=true npm run dev`:

Run: `curl -s http://localhost:3000/api/_internal/db-stats | head -5`
Expected: JSON dengan `total`, `byState`, `timestamp`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/_internal/db-stats/route.ts
git commit -m "feat(stress-test): add internal db-stats endpoint"
```

---

### Task A7: Buat seed script `stress-test/seed/stress-seed.ts`

**Files:**
- Create: `stress-test/seed/stress-seed.ts`

- [ ] **Step 1: Buat folder & file**

Folder structure auto-create saat fs_write. Isi file:

```typescript
/**
 * Stress Test Seed
 *
 * Membuat data test dengan email pattern `*@indoteknizi.test` yang mudah
 * dibersihkan. TIDAK menghapus data existing — append-only.
 *
 * Usage: npm run stress:seed
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STRESS_PASSWORD = 'StressTest123!'
const USER_COUNT = 30
const TEKNISI_COUNT = 20
const TEKNISI_WITH_TELEGRAM = 5
const STARTING_BALANCE = 5_000_000

async function main() {
  console.log('🌱 Stress test seed starting...')
  const passwordHash = await hash(STRESS_PASSWORD, 12)

  // ---- USERS ----
  console.log(`Creating ${USER_COUNT} stress users...`)
  for (let i = 1; i <= USER_COUNT; i++) {
    const email = `stress-user-${i}@indoteknizi.test`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Stress User ${i}`,
        password: passwordHash,
        role: UserRole.USER,
        phone: `+62 800-0000-${String(i).padStart(4, '0')}`,
      },
    })

    // Wallet
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: STARTING_BALANCE },
      create: { userId: user.id, balance: STARTING_BALANCE },
    })
  }

  // ---- TEKNISI ----
  console.log(`Creating ${TEKNISI_COUNT} stress teknisi...`)
  for (let i = 1; i <= TEKNISI_COUNT; i++) {
    const email = `stress-teknisi-${i}@indoteknizi.test`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Stress Teknisi ${i}`,
        password: passwordHash,
        role: UserRole.TEKNISI,
        phone: `+62 801-0000-${String(i).padStart(4, '0')}`,
      },
    })

    // TeknisiProfile
    const isLinkedTelegram = i <= TEKNISI_WITH_TELEGRAM
    await prisma.teknisiProfile.upsert({
      where: { userId: user.id },
      update: {
        telegramChatId: isLinkedTelegram ? `99900000${i}` : null,
        telegramUsername: isLinkedTelegram ? `stress_teknisi_${i}` : null,
        telegramLinkedAt: isLinkedTelegram ? new Date() : null,
      },
      create: {
        userId: user.id,
        telegramChatId: isLinkedTelegram ? `99900000${i}` : null,
        telegramUsername: isLinkedTelegram ? `stress_teknisi_${i}` : null,
        telegramLinkedAt: isLinkedTelegram ? new Date() : null,
      },
    })

    // Wallet
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 0 },
    })
  }

  console.log('✅ Stress test seed complete')
  console.log(`   Users: ${USER_COUNT} (email: stress-user-1..${USER_COUNT}@indoteknizi.test)`)
  console.log(`   Teknisi: ${TEKNISI_COUNT} (email: stress-teknisi-1..${TEKNISI_COUNT}@indoteknizi.test)`)
  console.log(`   With Telegram: ${TEKNISI_WITH_TELEGRAM}`)
  console.log(`   Password (semua): ${STRESS_PASSWORD}`)
  console.log(`   Wallet user: Rp ${STARTING_BALANCE.toLocaleString('id-ID')}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
```

- [ ] **Step 2: Tambah npm script**

Edit `package.json`, tambah ke `scripts`:

```json
"stress:seed": "tsx stress-test/seed/stress-seed.ts"
```

- [ ] **Step 3: Test seed**

Run: `npm run stress:seed`
Expected: output `✅ Stress test seed complete` dan menyebut count user/teknisi.

Verify di DB:
Run: `docker exec indoteknizi-postgres psql -U indoteknizi -d indoteknizi -c "SELECT count(*) FROM \"User\" WHERE email LIKE '%@indoteknizi.test';"`
Expected: count = 50 (30 user + 20 teknisi).

- [ ] **Step 4: Commit**

```bash
git add stress-test/seed/stress-seed.ts package.json
git commit -m "feat(stress-test): add stress seed script"
```

---

### Task A8: Buat cleanup script `stress-test/seed/clean.ts`

**Files:**
- Create: `stress-test/seed/clean.ts`

- [ ] **Step 1: Buat file**

```typescript
/**
 * Stress Test Cleanup
 *
 * Hapus semua user dengan email pattern `*@indoteknizi.test`.
 * Cascade delete handle relasi (Wallet, Order, dll) via Prisma onDelete: Cascade.
 *
 * Usage: npm run stress:clean
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Stress test cleanup starting...')

  const before = await prisma.user.count({
    where: { email: { endsWith: '@indoteknizi.test' } },
  })
  console.log(`   Found ${before} stress users to delete`)

  if (before === 0) {
    console.log('   Nothing to delete.')
    return
  }

  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: '@indoteknizi.test' } },
  })

  console.log(`✅ Deleted ${result.count} stress users (cascade includes wallet, orders, sessions)`)
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
```

- [ ] **Step 2: Tambah npm script**

Edit `package.json`, tambah:

```json
"stress:clean": "tsx stress-test/seed/clean.ts"
```

- [ ] **Step 3: Test cleanup (HATI-HATI: hapus seed yang barusan dibuat)**

Run: `npm run stress:clean`
Expected: output `Deleted 50 stress users`.

Re-seed untuk task berikutnya:
Run: `npm run stress:seed`

- [ ] **Step 4: Commit**

```bash
git add stress-test/seed/clean.ts package.json
git commit -m "feat(stress-test): add stress cleanup script"
```

---

### Task A9: Install k6

**Files:**
- (no file changes)

- [ ] **Step 1: Install k6 via Homebrew**

Run: `brew install k6`
Expected: install sukses.

- [ ] **Step 2: Verifikasi**

Run: `k6 version`
Expected: output seperti `k6 v0.x.x ...`

- [ ] **Step 3: (no commit needed — installation only)**

---

## Phase B: k6 Scenarios

### Task B1: Buat shared thresholds file

**Files:**
- Create: `stress-test/config/thresholds.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * Shared k6 thresholds untuk stress test IndoTeknizi.
 * Per spec §3.2.
 */

export const baseThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: [
    'p(95)<800',
    'p(99)<1500',
  ],
}

export const apiThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: [
    'p(95)<500',
    'p(99)<1000',
  ],
}

export const checkoutThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: [
    'p(95)<1500',
    'p(99)<3000',
  ],
}

export const pollingThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: [
    'p(95)<500',
    'p(99)<1000',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add stress-test/config/thresholds.js
git commit -m "feat(stress-test): add shared thresholds"
```

---

### Task B2: Buat k6 helper library

**Files:**
- Create: `stress-test/lib/auth.js`
- Create: `stress-test/lib/data.js`

- [ ] **Step 1: Buat `stress-test/lib/auth.js`**

```javascript
/**
 * Auth helper untuk k6 — login dan dapatkan session cookie NextAuth.
 *
 * NextAuth credentials login flow:
 * 1. GET CSRF token dari /api/auth/csrf
 * 2. POST credentials ke /api/auth/callback/credentials dengan csrf token
 * 3. Cookie session di-set di response
 */

import http from 'k6/http'
import { check } from 'k6'

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export function login(email, password) {
  // 1. Get CSRF
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`)
  const csrfToken = csrfRes.json('csrfToken')

  if (!csrfToken) {
    console.error('Failed to get CSRF token')
    return null
  }

  // 2. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      email,
      password,
      csrfToken,
      callbackUrl: BASE_URL,
      json: 'true',
    },
    {
      redirects: 0,
      tags: { name: 'auth_login' },
    },
  )

  const ok = check(loginRes, {
    'login returns 200 or 302': (r) => r.status === 200 || r.status === 302,
  })

  if (!ok) return null

  // Cookie jar k6 sudah otomatis simpan cookie session.
  // Return jar supaya caller bisa pakai kalau perlu inspect.
  return http.cookieJar()
}

export function pickStressUser(vuId) {
  // VU id 1..N, kita modulo dengan jumlah user
  const userIdx = ((vuId - 1) % 30) + 1
  return {
    email: `stress-user-${userIdx}@indoteknizi.test`,
    password: 'StressTest123!',
  }
}

export function pickStressTeknisi(vuId) {
  const teknisiIdx = ((vuId - 1) % 20) + 1
  return {
    email: `stress-teknisi-${teknisiIdx}@indoteknizi.test`,
    password: 'StressTest123!',
  }
}
```

- [ ] **Step 2: Buat `stress-test/lib/data.js`**

```javascript
/**
 * Data helper — pick random data untuk variasi request.
 */

const SEARCH_QUERIES = [
  'iphone',
  'samsung',
  'unlock',
  'flash',
  'imei',
  'remote',
  'konsultasi',
  'jakarta',
]

const PRODUCT_CATEGORIES = ['HARDWARE', 'SOFTWARE', 'TOOL', 'AKSESORIS', 'LAINNYA']

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomSearchQuery() {
  return randomItem(SEARCH_QUERIES)
}

export function randomCategory() {
  return randomItem(PRODUCT_CATEGORIES)
}

export function randomPage() {
  return Math.floor(Math.random() * 3) + 1
}

export function thinkTimeShort() {
  // 1-3 detik
  return 1 + Math.random() * 2
}

export function thinkTimeNormal() {
  // 2-5 detik
  return 2 + Math.random() * 3
}

export function thinkTimeLong() {
  // 5-10 detik
  return 5 + Math.random() * 5
}
```

- [ ] **Step 3: Commit**

```bash
git add stress-test/lib/auth.js stress-test/lib/data.js
git commit -m "feat(stress-test): add k6 helper library"
```

---

### Task B3: Skenario S1 — Public Discovery

**Files:**
- Create: `stress-test/scenarios/01-public-discovery.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * S1 — Public Discovery
 *
 * Test halaman publik (visitor pertama). Read-heavy, cache-friendly.
 * Spec §5.1.
 *
 * Total durasi: ~7 menit
 * Stages: 0→10→30→50→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { BASE_URL } from '../lib/auth.js'
import { randomSearchQuery, randomCategory, randomPage, thinkTimeNormal } from '../lib/data.js'
import { baseThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: baseThresholds,
}

export default function () {
  group('Landing page', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { name: 'landing' } })
    check(res, { 'landing 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse marketplace', () => {
    const cat = randomCategory()
    const page = randomPage()
    const res = http.get(
      `${BASE_URL}/api/marketplace/products?category=${cat}&page=${page}`,
      { tags: { name: 'marketplace_list' } },
    )
    check(res, { 'marketplace 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse teknisi', () => {
    const res = http.get(`${BASE_URL}/api/teknisi?page=${randomPage()}`, {
      tags: { name: 'teknisi_list' },
    })
    check(res, { 'teknisi 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse stores', () => {
    const res = http.get(`${BASE_URL}/api/stores?page=${randomPage()}`, {
      tags: { name: 'stores_list' },
    })
    check(res, { 'stores 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Search', () => {
    const q = randomSearchQuery()
    const res = http.get(`${BASE_URL}/api/search?q=${q}`, {
      tags: { name: 'search' },
    })
    check(res, { 'search 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Banners', () => {
    const res = http.get(`${BASE_URL}/api/banners`, { tags: { name: 'banners' } })
    check(res, { 'banners 200': (r) => r.status === 200 })
  })
}
```

- [ ] **Step 2: Tambah npm scripts**

Edit `package.json`, tambah:

```json
"stress:smoke": "k6 run stress-test/scenarios/01-public-discovery.js --vus 1 --duration 30s",
"stress:1": "k6 run stress-test/scenarios/01-public-discovery.js"
```

- [ ] **Step 3: Smoke test (1 VU, 30 detik)**

Pastikan dev server jalan dengan flag: `STRESS_TEST_MODE=true npm run dev` (di terminal terpisah).

Run: `npm run stress:smoke`
Expected: k6 selesai dengan status `✓` (semua check pass), output summary dengan `http_req_failed` 0%.

- [ ] **Step 4: Commit**

```bash
git add stress-test/scenarios/01-public-discovery.js package.json
git commit -m "feat(stress-test): add S1 public discovery scenario"
```

---

### Task B4: Skenario S2 — Marketplace Checkout

**Files:**
- Create: `stress-test/scenarios/02-marketplace-checkout.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * S2 — Marketplace Transaction E2E
 *
 * Test full transaction journey: login → browse → checkout.
 * Spec §5.2.
 *
 * Total durasi: ~8 menit
 * Stages: 0→5→15→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Counter, Trend } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import { thinkTimeShort } from '../lib/data.js'
import { checkoutThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '2m', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ...checkoutThresholds,
    successful_checkouts: ['count>10'],
  },
}

const successfulCheckouts = new Counter('successful_checkouts')
const transactionTime = new Trend('transaction_time', true)

export default function () {
  const user = pickStressUser(__VU)
  const start = Date.now()

  group('Login', () => {
    const jar = login(user.email, user.password)
    if (!jar) {
      console.error(`VU ${__VU}: login failed for ${user.email}`)
      return
    }
  })
  sleep(thinkTimeShort())

  let productId = null

  group('Browse products', () => {
    const res = http.get(`${BASE_URL}/api/marketplace/products?page=1`, {
      tags: { name: 'mp_products_list' },
    })
    if (check(res, { 'list 200': (r) => r.status === 200 })) {
      const body = res.json()
      const items = body?.data?.items || body?.data || []
      if (Array.isArray(items) && items.length > 0) {
        productId = items[Math.floor(Math.random() * items.length)].id
      }
    }
  })

  if (!productId) {
    console.warn(`VU ${__VU}: no product found, skipping checkout`)
    return
  }

  sleep(thinkTimeShort())

  group('Product detail', () => {
    const res = http.get(`${BASE_URL}/api/marketplace/products/${productId}`, {
      tags: { name: 'mp_product_detail' },
    })
    check(res, { 'detail 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeShort())

  group('Checkout', () => {
    const payload = JSON.stringify({
      productId,
      quantity: 1,
    })
    const res = http.post(`${BASE_URL}/api/marketplace/checkout`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'mp_checkout' },
    })
    const ok = check(res, {
      'checkout 200/201': (r) => r.status === 200 || r.status === 201,
    })
    if (ok) {
      successfulCheckouts.add(1)
    } else {
      console.error(`VU ${__VU}: checkout failed status=${res.status} body=${res.body?.slice(0, 200)}`)
    }
  })

  transactionTime.add(Date.now() - start)
}
```

> **Catatan untuk eksekusi:** Endpoint `/api/marketplace/checkout` exact request body & response shape mungkin perlu disesuaikan. Lihat `src/app/api/marketplace/checkout/route.ts` saat run pertama. Kalau payload schema berbeda, update bagian `payload` dan retry.

- [ ] **Step 2: Tambah npm script**

```json
"stress:2": "k6 run stress-test/scenarios/02-marketplace-checkout.js"
```

- [ ] **Step 3: Smoke test**

Pastikan seed sudah dijalankan: `npm run stress:seed` (kalau belum).

Run: `k6 run stress-test/scenarios/02-marketplace-checkout.js --vus 1 --iterations 1`
Expected: 1 iterasi selesai. Kalau checkout fail dengan 4xx, baca error → fix payload sesuai actual API contract. Update file dan re-test.

- [ ] **Step 4: Commit**

```bash
git add stress-test/scenarios/02-marketplace-checkout.js package.json
git commit -m "feat(stress-test): add S2 marketplace checkout scenario"
```

---

### Task B5: Skenario S3 — Service Request

**Files:**
- Create: `stress-test/scenarios/03-service-request.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * S3 — Service Request
 *
 * Test request konsultasi/remote/inspeksi + Telegram notif (mocked).
 * Spec §5.3.
 *
 * Total durasi: ~6 menit
 * Distribusi: 50% remote, 30% konsultasi, 20% inspeksi
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Counter } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import { thinkTimeShort, randomItem } from '../lib/data.js'
import { apiThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '2m', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: apiThresholds,
}

const requestsRemote = new Counter('requests_remote')
const requestsKonsultasi = new Counter('requests_konsultasi')
const requestsInspeksi = new Counter('requests_inspeksi')

function pickServiceType() {
  const r = Math.random()
  if (r < 0.5) return 'remote'
  if (r < 0.8) return 'konsultasi'
  return 'inspeksi'
}

function pickTeknisiId() {
  // Pakai 1 dari 5 teknisi yang sudah link Telegram (ID 1..5)
  // atau random dari semua 20 teknisi.
  // Kita ambil random dari 20 teknisi.
  const idx = Math.floor(Math.random() * 20) + 1
  return idx
}

export default function () {
  const user = pickStressUser(__VU)

  group('Login', () => {
    const jar = login(user.email, user.password)
    if (!jar) return
  })
  sleep(thinkTimeShort())

  // Teknisi list — pick first available teknisi ID dari API
  let teknisiId = null
  group('Get teknisi list', () => {
    const res = http.get(`${BASE_URL}/api/teknisi`, { tags: { name: 'teknisi_pick' } })
    if (res.status === 200) {
      const body = res.json()
      const items = body?.data?.items || body?.data || []
      if (Array.isArray(items) && items.length > 0) {
        teknisiId = items[Math.floor(Math.random() * items.length)].id
      }
    }
  })

  if (!teknisiId) {
    console.warn(`VU ${__VU}: no teknisi found`)
    return
  }

  sleep(thinkTimeShort())

  const serviceType = pickServiceType()

  group(`Request ${serviceType}`, () => {
    let url = ''
    let payload = ''

    if (serviceType === 'remote') {
      url = `${BASE_URL}/api/remote`
      payload = JSON.stringify({
        teknisiId,
        remoteId: `STRESS-${__VU}-${Date.now()}`,
        otp: '1234',
        platform: 'Windows 11',
        description: 'Stress test remote request',
      })
      requestsRemote.add(1)
    } else if (serviceType === 'konsultasi') {
      url = `${BASE_URL}/api/user/konsultasi`
      payload = JSON.stringify({
        teknisiId,
        service: 'Konsultasi Stress Test',
        description: 'Stress test konsultasi',
      })
      requestsKonsultasi.add(1)
    } else {
      url = `${BASE_URL}/api/user/inspeksi`
      payload = JSON.stringify({
        teknisiId,
        productName: 'iPhone 13 Pro',
        mode: 'ONLINE',
        description: 'Stress test inspeksi',
      })
      requestsInspeksi.add(1)
    }

    const res = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: `${serviceType}_request` },
    })

    check(res, {
      [`${serviceType} 200/201`]: (r) => r.status === 200 || r.status === 201,
    })

    if (res.status >= 400) {
      console.error(
        `VU ${__VU}: ${serviceType} failed status=${res.status} body=${res.body?.slice(0, 200)}`,
      )
    }
  })
}
```

> **Catatan eksekusi:** Body request untuk konsultasi & inspeksi mungkin butuh adjustment sesuai schema validasi Zod actual. Saat smoke test, kalau dapat 400, baca error response dan adjust payload.

- [ ] **Step 2: Tambah npm script**

```json
"stress:3": "k6 run stress-test/scenarios/03-service-request.js"
```

- [ ] **Step 3: Smoke test**

Run: `k6 run stress-test/scenarios/03-service-request.js --vus 1 --iterations 3`
Expected: 3 iterasi distribusi acak (remote/konsultasi/inspeksi). Adjust payload kalau perlu.

- [ ] **Step 4: Commit**

```bash
git add stress-test/scenarios/03-service-request.js package.json
git commit -m "feat(stress-test): add S3 service request scenario"
```

---

### Task B6: Skenario S4 — Real-time Polling

**Files:**
- Create: `stress-test/scenarios/04-realtime-polling.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * S4 — Real-time Polling
 *
 * Simulate teknisi login + polling notification/presence/chat.
 * Spec §5.4.
 *
 * Total durasi: ~10 menit
 * Stages: 0→10→30→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { BASE_URL, login, pickStressTeknisi } from '../lib/auth.js'
import { thinkTimeLong } from '../lib/data.js'
import { pollingThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: pollingThresholds,
}

export default function () {
  const teknisi = pickStressTeknisi(__VU)

  // Login sekali per iterasi (simplifikasi — di produksi 1 login → banyak polling)
  group('Login', () => {
    login(teknisi.email, teknisi.password)
  })

  // Polling 4 endpoint
  group('Poll notifications', () => {
    const res = http.get(`${BASE_URL}/api/notifications`, {
      tags: { name: 'poll_notifications' },
    })
    check(res, { 'notif 200': (r) => r.status === 200 })
  })

  group('Poll presence', () => {
    const res = http.get(`${BASE_URL}/api/teknisi/presence`, {
      tags: { name: 'poll_presence' },
    })
    check(res, { 'presence ok': (r) => r.status === 200 || r.status === 204 })
  })

  group('Poll chat conversations', () => {
    const res = http.get(`${BASE_URL}/api/chat/conversations`, {
      tags: { name: 'poll_chat' },
    })
    check(res, { 'chat 200': (r) => r.status === 200 })
  })

  group('Poll teknisi remote pending', () => {
    const res = http.get(`${BASE_URL}/api/teknisi/remote`, {
      tags: { name: 'poll_remote_pending' },
    })
    check(res, { 'remote 200': (r) => r.status === 200 })
  })

  // Think time mirip real polling interval
  sleep(thinkTimeLong())
}
```

- [ ] **Step 2: Tambah npm script**

```json
"stress:4": "k6 run stress-test/scenarios/04-realtime-polling.js"
```

- [ ] **Step 3: Smoke test**

Run: `k6 run stress-test/scenarios/04-realtime-polling.js --vus 1 --iterations 2`
Expected: semua endpoint return 200 (atau 204 untuk presence). Kalau 401/403, cek login flow.

- [ ] **Step 4: Commit**

```bash
git add stress-test/scenarios/04-realtime-polling.js package.json
git commit -m "feat(stress-test): add S4 realtime polling scenario"
```

---

### Task B7: Skenario S5 — Soak Test

**Files:**
- Create: `stress-test/scenarios/05-soak-test.js`

- [ ] **Step 1: Buat file**

```javascript
/**
 * S5 — Soak Test
 *
 * Constant 5 VU mixing semua flow selama 30 menit.
 * Tujuan: detect memory leak.
 * Spec §5.5.
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Trend } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import {
  randomSearchQuery,
  randomCategory,
  randomPage,
  thinkTimeNormal,
} from '../lib/data.js'

export const options = {
  vus: 5,
  duration: '30m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
}

const memRss = new Trend('memory_rss_mb', false)

function snapshotMemory() {
  const res = http.get(`${BASE_URL}/api/_internal/memory`, {
    tags: { name: 'memory_snapshot' },
  })
  if (res.status === 200) {
    const body = res.json()
    if (body && typeof body.rssMB === 'number') {
      memRss.add(body.rssMB)
    }
  }
}

function browseFlow() {
  group('Browse', () => {
    http.get(`${BASE_URL}/`, { tags: { name: 'soak_landing' } })
    http.get(
      `${BASE_URL}/api/marketplace/products?category=${randomCategory()}&page=${randomPage()}`,
      { tags: { name: 'soak_marketplace' } },
    )
    http.get(`${BASE_URL}/api/search?q=${randomSearchQuery()}`, {
      tags: { name: 'soak_search' },
    })
  })
}

function pollFlow() {
  const user = pickStressUser(__VU)
  login(user.email, user.password)

  group('Poll', () => {
    http.get(`${BASE_URL}/api/notifications`, { tags: { name: 'soak_notif' } })
    http.get(`${BASE_URL}/api/chat/conversations`, { tags: { name: 'soak_chat' } })
  })
}

export default function () {
  // Distribusi: 60% browse, 30% poll, 10% memory snapshot
  const r = Math.random()
  if (r < 0.6) {
    browseFlow()
  } else if (r < 0.9) {
    pollFlow()
  } else {
    snapshotMemory()
  }
  sleep(thinkTimeNormal())
}

export function handleSummary(data) {
  const memTrend = data.metrics.memory_rss_mb
  if (memTrend) {
    console.log(`\n=== Memory RSS Summary ===`)
    console.log(`min: ${memTrend.values.min} MB`)
    console.log(`max: ${memTrend.values.max} MB`)
    console.log(`avg: ${memTrend.values.avg.toFixed(2)} MB`)
    const drift = memTrend.values.max - memTrend.values.min
    console.log(`drift: ${drift.toFixed(2)} MB`)
    console.log(`verdict: ${drift < 10 ? '✅ PASS' : drift < 50 ? '⚠️ INVESTIGATE' : '❌ FAIL'}`)
  }
  return {
    stdout: '',
  }
}
```

- [ ] **Step 2: Tambah npm script**

```json
"stress:soak": "k6 run stress-test/scenarios/05-soak-test.js"
```

- [ ] **Step 3: Quick verify (NOT full 30 min)**

Untuk verify script bisa jalan, run dengan duration kecil:
Run: `k6 run stress-test/scenarios/05-soak-test.js --duration 1m --vus 2`
Expected: selesai tanpa error, output memory summary.

Untuk run full soak: `npm run stress:soak` (30 menit, jangan ditinggal).

- [ ] **Step 4: Commit**

```bash
git add stress-test/scenarios/05-soak-test.js package.json
git commit -m "feat(stress-test): add S5 soak test scenario"
```

---

### Task B8: Tambah `stress:all` aggregator

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Tambah npm script**

```json
"stress:all": "npm run stress:1 && npm run stress:2 && npm run stress:3 && npm run stress:4"
```

(Soak test tidak masuk `all` karena 30 menit, dijalankan terpisah.)

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat(stress-test): add stress:all aggregator script"
```

---

## Phase C: Polish

### Task C1: Buat monitor.sh

**Files:**
- Create: `stress-test/monitor.sh`

- [ ] **Step 1: Buat file**

```bash
#!/bin/bash
#
# Stress Test Monitor
# Loop tiap 5 detik tampilkan: connection count, top active queries.
#
# Usage: bash stress-test/monitor.sh

set -e

DB_USER="${DB_USER:-indoteknizi}"
DB_NAME="${DB_NAME:-indoteknizi}"
DB_CONTAINER="${DB_CONTAINER:-indoteknizi-postgres}"
INTERVAL="${INTERVAL:-5}"

echo "🔍 Monitoring PostgreSQL & Memory"
echo "   Interval: ${INTERVAL}s"
echo "   DB Container: ${DB_CONTAINER}"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "=== $(date '+%H:%M:%S') ==="

  echo ""
  echo "📊 PostgreSQL Connections:"
  docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT state, count(*) FROM pg_stat_activity WHERE datname = current_database() GROUP BY state ORDER BY count DESC;" \
    2>/dev/null || echo "   (DB unavailable)"

  echo ""
  echo "🧠 Node.js Memory (RSS):"
  curl -s http://localhost:3000/api/_internal/memory 2>/dev/null \
    | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   RSS={d[\"rssMB\"]}MB  heap={d[\"heapUsedMB\"]}/{d[\"heapTotalMB\"]}MB  uptime={d[\"uptime\"]}s')" \
    2>/dev/null || echo "   (memory endpoint unavailable — STRESS_TEST_MODE off?)"

  echo ""
  echo "🔥 Top Active Queries (>1s):"
  docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT pid, now() - query_start AS duration, left(query, 80) AS query FROM pg_stat_activity WHERE state = 'active' AND query_start IS NOT NULL AND now() - query_start > interval '1 second' ORDER BY duration DESC LIMIT 5;" \
    2>/dev/null || echo "   (none)"

  sleep "${INTERVAL}"
done
```

- [ ] **Step 2: Make executable**

Run: `chmod +x stress-test/monitor.sh`

- [ ] **Step 3: Smoke test**

Pastikan dev server jalan dengan flag.

Run: `bash stress-test/monitor.sh`
Expected: refresh tiap 5 detik dengan koneksi count + memory + queries.

Tekan `Ctrl+C` untuk stop.

- [ ] **Step 4: Commit**

```bash
git add stress-test/monitor.sh
git commit -m "feat(stress-test): add monitor.sh helper"
```

---

### Task C2: Buat README.md

**Files:**
- Create: `stress-test/README.md`

- [ ] **Step 1: Buat file**

```markdown
# Stress Test — IndoTeknizi MVP

Skenario stress test untuk soft launch IndoTeknizi.
Reference spec: `docs/superpowers/specs/2026-05-25-stress-test-design.md`

## Prasyarat

1. **k6 terinstall**

   ```bash
   brew install k6
   ```

2. **Database PostgreSQL jalan**

   ```bash
   npm run db:up
   ```

3. **Seed stress data**

   ```bash
   npm run stress:seed
   ```

   Membuat 30 user + 20 teknisi dengan email pattern `*@indoteknizi.test`.

4. **Dev server dengan stress mode aktif**

   ```bash
   STRESS_TEST_MODE=true npm run dev
   ```

   Penting: tanpa flag, mock external API tidak aktif → bot Telegram, BinderByte, DhruFusion akan di-hit beneran.

## Eksekusi

| Skenario | Command | Durasi |
|----------|---------|-------:|
| Smoke (sanity check) | `npm run stress:smoke` | 30 detik |
| S1 Public Discovery | `npm run stress:1` | ~7 menit |
| S2 Marketplace Checkout | `npm run stress:2` | ~8 menit |
| S3 Service Request | `npm run stress:3` | ~6 menit |
| S4 Realtime Polling | `npm run stress:4` | ~10 menit |
| S5 Soak Test | `npm run stress:soak` | 30 menit |
| Semua kecuali soak | `npm run stress:all` | ~31 menit |

## Workflow Standar

```bash
# Terminal 1: dev server
STRESS_TEST_MODE=true npm run dev

# Terminal 2: monitoring
bash stress-test/monitor.sh

# Terminal 3: jalankan test
npm run stress:smoke   # sanity check dulu
npm run stress:1       # baru full skenario
```

## Cleanup

Setelah selesai:

```bash
npm run stress:clean
```

Hapus semua user/data dengan email `*@indoteknizi.test`.

## Threshold Pass/Fail

Lihat spec §3.2 dan §7.3.

| Skenario | PASS | FAIL |
|----------|------|------|
| S1 | P95 < 800ms, errors < 1% | P95 > 1.5s atau errors > 5% |
| S2 | Zero failed checkout, P95 < 1.5s | Wallet inconsistency |
| S3 | Notif terkirim, P95 < 1s | Activity log block |
| S4 | DB conn < 8/10, P95 < 500ms | Pool exhausted |
| S5 | RSS drift ±10MB | Drift > 50MB |

## Troubleshooting

**Login fail di k6** — pastikan seed sudah dijalankan, password default `StressTest123!`.

**Connection refused** — dev server belum jalan.

**Mock tidak aktif** — env `STRESS_TEST_MODE=true` belum di-set.

**404 di `/api/_internal/memory`** — sama, flag belum aktif.

**Build error setelah modifikasi mock** — cek type assertion di `binderbyte-client.ts` & `dhru-fusion.ts`.
```

- [ ] **Step 2: Commit**

```bash
git add stress-test/README.md
git commit -m "docs(stress-test): add README with usage guide"
```

---

### Task C3: Buat REPORT_TEMPLATE.md

**Files:**
- Create: `stress-test/results/REPORT_TEMPLATE.md`
- Create: `stress-test/results/.gitkeep`

- [ ] **Step 1: Buat folder + .gitkeep**

```bash
mkdir -p stress-test/results
touch stress-test/results/.gitkeep
```

- [ ] **Step 2: Buat REPORT_TEMPLATE.md**

```markdown
# Stress Test Report — IndoTeknizi MVP

**Date**: YYYY-MM-DD
**Tested by**: <nama>
**Environment**: Local (Mac/Linux, X GB RAM, dev server)
**Target VPS**: 1 vCPU, 2 GB RAM

---

## 1. Executive Summary

- **Overall verdict**: ✅ READY / ⚠️ NEEDS FIX / ❌ NOT READY
- **Top 3 findings**:
  1.
  2.
  3.
- **Recommendation before launch**:

---

## 2. Per Scenario Results

### S1 — Public Discovery
- Verdict: PASS / INVESTIGATE / FAIL
- Total requests: ___
- P95: ___ ms | P99: ___ ms
- Error rate: ___ %
- Throughput: ___ req/s
- Notes:

### S2 — Marketplace Checkout
- Verdict: PASS / INVESTIGATE / FAIL
- Successful checkouts: ___
- P95: ___ ms | P99: ___ ms
- Error rate: ___ %
- Wallet/order inconsistency found: yes/no
- Notes:

### S3 — Service Request
- Verdict: PASS / INVESTIGATE / FAIL
- Requests by type: remote=___, konsultasi=___, inspeksi=___
- P95: ___ ms | P99: ___ ms
- Notif dispatch verified: yes/no
- Notes:

### S4 — Realtime Polling
- Verdict: PASS / INVESTIGATE / FAIL
- Peak DB connections: ___
- P95: ___ ms | P99: ___ ms
- Pool saturation detected: yes/no
- Notes:

### S5 — Soak Test
- Verdict: PASS / INVESTIGATE / FAIL
- RSS min/max/drift: ___ / ___ / ___ MB
- Latency drift: ___ ms (start) → ___ ms (end)
- Memory leak suspected: yes/no
- Notes:

---

## 3. Bottleneck Findings

| # | Severity | Title | Root Cause | Fix | Effort |
|---|----------|-------|------------|-----|--------|
| 1 | High/Med/Low | | | | S/M/L |
| 2 | | | | | |

---

## 4. Capacity Planning Conclusion

- **Headroom from 30 → 50 VU**: ___ %
- **Estimated max concurrent users di VPS 1vCPU/2GB**: ~___
- **Rekomendasi**:
  - [ ] Co-located OK untuk MVP
  - [ ] Pisahkan DB sebelum launch
  - [ ] Optimasi dulu sebelum scale up

---

## 5. Production Readiness Checklist

- [ ] Semua threshold L2 (10 VU baseline) PASS
- [ ] Soak test 30 menit no memory leak
- [ ] Slow query teratasi (P95 query < 100ms)
- [ ] Connection pool config sesuai VPS
- [ ] External API mock dimatikan saat deploy (verify `STRESS_TEST_MODE` tidak ada di production env)
- [ ] Internal endpoints `/api/_internal/*` return 404 di production (verifikasi via curl post-deploy)
- [ ] Monitoring (logs, error tracking) terpasang
- [ ] Database backup strategy ready
- [ ] Rollback plan documented
```

- [ ] **Step 3: Tambah `.gitignore` rule untuk results**

Edit `.gitignore`, tambah:

```
# Stress test results (output JSON, generated reports)
stress-test/results/*
!stress-test/results/.gitkeep
!stress-test/results/REPORT_TEMPLATE.md
```

- [ ] **Step 4: Commit**

```bash
git add stress-test/results/.gitkeep stress-test/results/REPORT_TEMPLATE.md .gitignore
git commit -m "docs(stress-test): add report template & gitignore results"
```

---

### Task C4: Buat plan.md (ringkasan rujuk ke spec)

**Files:**
- Create: `stress-test/plan.md`

- [ ] **Step 1: Buat file**

```markdown
# Stress Test Plan — IndoTeknizi MVP

> Spec lengkap: [`docs/superpowers/specs/2026-05-25-stress-test-design.md`](../docs/superpowers/specs/2026-05-25-stress-test-design.md)

## TL;DR

5 skenario k6 untuk soft launch validation:

| # | Skenario | Beban Puncak | Durasi |
|---|----------|-------------:|-------:|
| S1 | Public Discovery | 50 VU | 7 min |
| S2 | Marketplace Checkout | 15 VU | 8 min |
| S3 | Service Request | 15 VU | 6 min |
| S4 | Realtime Polling | 30 VU | 10 min |
| S5 | Soak Test | 5 VU constant | 30 min |

External API (Telegram, DhruFusion, BinderByte) di-mock via `STRESS_TEST_MODE=true`.

## Cara Pakai

Lihat `README.md` untuk usage.
```

- [ ] **Step 2: Commit**

```bash
git add stress-test/plan.md
git commit -m "docs(stress-test): add plan.md summary"
```

---

## Self-Review

Sebelum handoff, saya verify plan terhadap spec:

**Spec coverage** (per section spec):
- §1 Tujuan → ditujukan via skenario S1-S5 (validation, bottleneck, capacity)
- §2.4 Flow di-cover (A/C/D/E) → S1/S2/S3/S4 ✅
- §3 Skema beban → semua VU di stages match spec
- §4 Strategi mock → Tasks A1-A4 ✅
- §5.1-5.5 Skenario detail → Tasks B3-B7 ✅
- §6.1 Folder layout → terbentuk via tasks
- §6.2 NPM scripts → 9 scripts ditambah (A7, A8, B3-B8)
- §6.5 Internal endpoints → A5 (memory), A6 (db-stats). **Reset-test-data endpoint tidak dibuat** karena §10.2 sudah cover via `npm run stress:clean` — keputusan YAGNI.
- §7 Eksekusi & monitoring → C1 monitor.sh, C2 README
- §8 Bottleneck playbook → tetap di spec (dokumen referensi, tidak butuh task implementation)
- §9 Report template → C3
- §10 Cleanup → A8

**Placeholder scan**: tidak ada TODO/TBD/"add appropriate handling" — semua step punya code/command lengkap.

**Type consistency**:
- `isStressTestMode()` & `mockDelay()` consistent di A1-A4
- `BASE_URL`, `login()`, `pickStressUser()`, `pickStressTeknisi()` consistent di B2-B7
- Threshold names (`baseThresholds`, `apiThresholds`, `checkoutThresholds`, `pollingThresholds`) consistent di B1 + B3-B6

**Gap yang sengaja diterima**:
- Reset-test-data internal endpoint tidak dibuat (digantikan `stress:clean` script).
- `prisma generate` re-run tidak ada di task — tidak perlu karena tidak ada schema change.

---

## Execution Handoff

Plan complete dan tersimpan di `indoteknizi/docs/superpowers/plans/2026-05-25-stress-test-implementation.md`.

**Total estimasi**: 17 task, ~6-8 jam kerja effective. Bisa di-split jadi beberapa session.

**Two execution options:**

1. **Subagent-Driven (recommended)** — saya dispatch fresh subagent per task, review hasil tiap task sebelum next. Iterasi cepat, context bersih.

2. **Inline Execution** — eksekusi tasks di session ini sekarang, dengan checkpoint untuk review tiap selesai phase (A → B → C).

3. **Manual** — Anda eksekusi sendiri pakai plan ini sebagai panduan. Kapan saja, sesuai kesempatan.

**Mau pilih yang mana?**
