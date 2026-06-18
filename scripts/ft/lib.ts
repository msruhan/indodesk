/**
 * Shared utilities for functional test runners (smoke + full).
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const BASE_URL = (() => {
  const idx = process.argv.indexOf('--base')
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'http://localhost:3000'
})()

export const RESULTS_DIR = join(process.cwd(), 'docs', 'functional-tests', 'results')

export const STRESS_PASSWORD = 'StressTest123!'
export const SEED_PASSWORD = 'password123'

export const ACCOUNTS = {
  stressUser1: 'stress-user-1@indoteknizi.test',
  stressUser2: 'stress-user-2@indoteknizi.test',
  stressTeknisi1: 'stress-teknisi-1@indoteknizi.test',
  stressTeknisi2: 'stress-teknisi-2@indoteknizi.test',
  stressAdmin: 'stress-admin-1@indoteknizi.test',
  seedUser1: 'siti@gmail.com',
  seedUser2: 'rudi@gmail.com',
  seedUser3: 'dewi@gmail.com',
  seedTeknisi1: 'ahmad@indoteknizi.com',
  seedTeknisi2: 'budi@indoteknizi.com',
  seedAdmin: 'admin@indoteknizi.com',
} as const

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP'

export type TestResult = {
  id: string
  title: string
  domain: string
  file: string
  status: TestStatus
  durationMs: number
  message?: string
}

export type CookieJar = {
  cookies: Map<string, string>
  toHeader(): string
  setFromResponse(res: Response): void
}

export function makeJar(): CookieJar {
  const cookies = new Map<string, string>()
  return {
    cookies,
    toHeader() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    setFromResponse(res: Response) {
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
        cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
      }
    },
  }
}

export async function request(
  jar: CookieJar | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: any; raw: Response }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
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

export async function login(
  jar: CookieJar,
  email: string,
  password = email.endsWith('@indoteknizi.test') ? STRESS_PASSWORD : SEED_PASSWORD,
): Promise<boolean> {
  const { status } = await request(jar, 'POST', '/api/stress-internal/login', { email, password })
  return status === 200
}

export function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

export function assertStatus(
  status: number,
  expected: number | number[],
  label: string,
): void {
  const ok = Array.isArray(expected) ? expected.includes(status) : status === expected
  if (!ok) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${status}`)
}

export function assert4xx(status: number, label = 'response'): void {
  if (status < 400 || status >= 500) {
    throw new Error(`${label}: expected 4xx, got ${status}`)
  }
}

export function assertForbidden(
  res: { status: number; data?: { error?: string; success?: boolean } },
  label = 'response',
): void {
  assertStatus(res.status, 403, label)
  assert(res.data?.success === false, `${label}: success should be false`)
  assert(
    String(res.data?.error ?? '').toLowerCase().includes('forbidden'),
    `${label}: expected Forbidden, got ${JSON.stringify(res.data)}`,
  )
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308]

export function assertRedirect(
  res: { status: number; raw: Response },
  locationIncludes: string,
  label = 'redirect',
): void {
  assert(
    REDIRECT_STATUSES.includes(res.status),
    `${label}: expected redirect, got ${res.status}`,
  )
  const location = res.raw.headers.get('location') ?? ''
  assert(
    location.includes(locationIncludes),
    `${label}: location "${location}" expected to include "${locationIncludes}"`,
  )
}

export function assertLoginRedirect(
  res: { status: number; raw: Response },
  callbackPath: string,
): void {
  assertRedirect(res, '/login', 'login redirect')
  const location = res.raw.headers.get('location') ?? ''
  assert(
    location.includes(encodeURIComponent(callbackPath)) || location.includes(callbackPath),
    `callbackUrl should reference ${callbackPath}, got ${location}`,
  )
}

export async function findBuyerMarketplaceOrderId(
  buyerJar: CookieJar,
  orderCode: string,
): Promise<string> {
  const res = await request(buyerJar, 'GET', '/api/user/marketplace/orders')
  assertStatus(res.status, 200, 'buyer orders')
  const rows = res.data?.data ?? []
  const row = rows.find((o: { orderCode?: string }) => o.orderCode === orderCode)
  assert(row?.id, `order ${orderCode} not found for buyer`)
  return row.id as string
}

export function domainFromId(id: string): string {
  const m = id.match(/^FT-([A-Z]+)-/)
  return m?.[1] ?? 'UNK'
}

export const results: TestResult[] = []

export async function runTest(
  id: string,
  title: string,
  file: string,
  fn: () => Promise<void>,
  onSkip?: (reason: string) => void,
): Promise<void> {
  const started = Date.now()
  const domain = domainFromId(id)
  process.stdout.write(`  [${id}] ${title.slice(0, 60)}... `)
  try {
    await fn()
    const durationMs = Date.now() - started
    results.push({ id, title, domain, file, status: 'PASS', durationMs })
    console.log(`✅ PASS (${durationMs}ms)`)
  } catch (error) {
    const durationMs = Date.now() - started
    const message = error instanceof Error ? error.message : String(error)
    if (message.startsWith('SKIP:')) {
      const reason = message.slice(5).trim()
      onSkip?.(reason)
      results.push({ id, title, domain, file, status: 'SKIP', durationMs, message: reason })
      console.log(`⏭️  SKIP (${durationMs}ms)`)
      if (reason) console.log(`     → ${reason}`)
      return
    }
    results.push({ id, title, domain, file, status: 'FAIL', durationMs, message })
    console.log(`❌ FAIL (${durationMs}ms)`)
    console.log(`     → ${message}`)
  }
}

export function skip(reason: string): never {
  throw new Error(`SKIP: ${reason}`)
}

export async function getStressProduct(jar: CookieJar): Promise<{ id: string; name: string }> {
  const products = await request(jar, 'GET', '/api/marketplace/products?limit=10&q=%5BSTRESS%5D')
  assertStatus(products.status, 200, 'list products')
  const product = (products.data?.data ?? []).find((p: any) => p?.name?.includes('[STRESS]'))
  assert(product, 'no stress product found — jalankan npm run stress:seed')
  return product
}

export async function getTeknisiId(
  jar: CookieJar,
  email: string = ACCOUNTS.stressTeknisi1,
): Promise<string> {
  const self = await request(jar, 'GET', '/api/auth/session')
  if (self.data?.user?.email === email && self.data?.user?.id) return self.data.user.id

  const teknisiJar = makeJar()
  if (await login(teknisiJar, email)) {
    const s = await request(teknisiJar, 'GET', '/api/auth/session')
    if (s.data?.user?.id) return s.data.user.id
  }

  try {
    return await getUserIdByEmail(email)
  } catch {
    /* fall through to public list */
  }

  const listRes = await request(null, 'GET', '/api/teknisi?limit=50')
  const list = listRes.data?.data ?? listRes.data ?? []
  const fromPublic = Array.isArray(list)
    ? list.find((x: any) => x.email === email || x.user?.email === email)
    : null
  if (fromPublic?.id) return fromPublic.id

  const adminJar = makeJar()
  if (await login(adminJar, ACCOUNTS.stressAdmin)) {
    const users = await request(adminJar, 'GET', '/api/admin/users?limit=100')
    const rows = users.data?.data ?? users.data?.users ?? users.data ?? []
    const row = Array.isArray(rows)
      ? rows.find((u: any) => (u.email ?? u.user?.email) === email)
      : null
    if (row?.id) return row.id
  }

  throw new Error(`teknisi ${email} not found — jalankan npm run stress:seed`)
}

/** Resolve user id by email via admin wallet/users list. */
export async function getUserIdByEmail(email: string): Promise<string> {
  const adminJar = makeJar()
  assert(await login(adminJar, ACCOUNTS.seedAdmin), 'admin login')

  const wallets = await request(adminJar, 'GET', '/api/admin/wallet')
  const walletRows = wallets.data?.data ?? wallets.data ?? []
  if (Array.isArray(walletRows)) {
    const w = walletRows.find((x: any) => x.user?.email === email)
    if (w?.userId) return w.userId as string
  }

  const users = await request(adminJar, 'GET', '/api/admin/users?limit=200')
  const userRows = users.data?.data ?? users.data?.users ?? users.data ?? []
  if (Array.isArray(userRows)) {
    const u = userRows.find((x: any) => (x.email ?? x.user?.email) === email)
    if (u?.id) return u.id as string
  }

  throw new Error(`user ${email} not found`)
}

export async function adminTopupUser(email: string, amount: number): Promise<void> {
  const adminJar = makeJar()
  assert(await login(adminJar, ACCOUNTS.seedAdmin), 'admin login')
  const userId = await getUserIdByEmail(email)
  const res = await request(adminJar, 'POST', '/api/admin/wallet', {
    userId,
    amount,
    type: 'ADD',
    reason: 'Functional test rekber top-up',
  })
  assert(
    (res.status === 200 || res.status === 201) && res.data?.success !== false,
    `admin topup ${email}: ${JSON.stringify(res.data)}`,
  )
}

/** Set wallet balance to an exact amount (for negative balance tests). */
export async function adminSetWalletBalance(email: string, targetBalance: number): Promise<void> {
  const adminJar = makeJar()
  assert(await login(adminJar, ACCOUNTS.seedAdmin), 'admin login')
  const userId = await getUserIdByEmail(email)
  const walletRes = await request(adminJar, 'GET', `/api/admin/wallet?userId=${userId}`)
  assertStatus(walletRes.status, 200, 'admin wallet get')
  const current = Number(walletRes.data?.data?.balance ?? 0)
  const delta = targetBalance - current
  if (delta === 0) return
  const res = await request(adminJar, 'POST', '/api/admin/wallet', {
    userId,
    amount: Math.abs(delta),
    type: delta > 0 ? 'ADD' : 'DEDUCT',
    reason: 'Functional test wallet reset',
  })
  assert(
    (res.status === 200 || res.status === 201) && res.data?.success !== false,
    `admin set balance ${email}: ${JSON.stringify(res.data)}`,
  )
}

export async function createRekberAndFund(
  buyerJar: CookieJar,
  opts: { sellerId?: string; sellerEmail?: string; amount: number; description: string },
): Promise<{ id: string; orderCode: string }> {
  const create = await request(buyerJar, 'POST', '/api/rekber', opts)
  assert(
    create.status === 200 || create.status === 201,
    `create rekber ${create.status} ${JSON.stringify(create.data)}`,
  )
  const id = create.data?.data?.id as string
  assert(id, 'rekber id missing')
  const fund = await request(buyerJar, 'PATCH', `/api/rekber/${id}`, { action: 'fund' })
  assert(
    fund.status === 200 && fund.data?.data?.status === 'held',
    `fund rekber ${fund.status} ${JSON.stringify(fund.data)}`,
  )
  return { id, orderCode: create.data.data.orderCode as string }
}

export async function findRekberForBuyer(
  buyerJar: CookieJar,
  orderCode: string,
): Promise<{ id: string; status: string } | null> {
  const list = await request(buyerJar, 'GET', '/api/rekber')
  assertStatus(list.status, 200, 'rekber list')
  const items = list.data?.data?.items ?? []
  const row = items.find((r: any) => r.orderCode === orderCode)
  return row ? { id: row.id, status: row.status } : null
}

export type TopupCatalogPick = {
  productSlug: string
  denominationSku: string
  basePrice: number
  category?: string
}

export async function getTopupCatalog(
  jar: CookieJar | null = null,
): Promise<{ products: any[]; denominations: TopupCatalogPick[] }> {
  const res = await request(jar, 'GET', '/api/topup/catalog')
  assertStatus(res.status, 200, 'topup catalog')
  const data = res.data?.data ?? res.data ?? {}
  const products = data.products ?? []
  const denominations = (data.denominations ?? []).map((d: any) => ({
    productSlug: d.productSlug as string,
    denominationSku: d.sku as string,
    basePrice: Number(d.salePrice ?? d.basePrice ?? 0),
    category: products.find((p: any) => p.slug === d.productSlug)?.category,
  }))
  return { products, denominations }
}

export function pickTopupDenom(
  denominations: TopupCatalogPick[],
  opts?: { productSlug?: string; minPrice?: number },
): TopupCatalogPick | undefined {
  let list = denominations
  if (opts?.productSlug) list = list.filter((d) => d.productSlug === opts.productSlug)
  if (opts?.minPrice != null) {
    const minPrice = opts.minPrice
    list = list.filter((d) => d.basePrice >= minPrice)
  }
  return list.sort((a, b) => a.basePrice - b.basePrice)[0]
}

export async function topupCheckout(
  jar: CookieJar,
  pick: TopupCatalogPick,
  accountId: string,
): Promise<{ orderCode: string; order: any }> {
  const res = await request(jar, 'POST', '/api/topup/checkout', {
    productSlug: pick.productSlug,
    denominationSku: pick.denominationSku,
    accountId,
    paymentMethod: 'saldo',
  })
  assert(
    res.status === 200 || res.status === 201,
    `topup checkout ${res.status} ${JSON.stringify(res.data)}`,
  )
  const order = res.data?.data?.order ?? res.data?.order ?? res.data?.data
  const orderCode = order?.orderCode as string
  assert(orderCode, 'orderCode missing')
  return { orderCode, order }
}

export async function pollTopupOrder(
  orderCode: string,
  predicate: (order: any) => boolean,
  opts?: { maxWaitMs?: number; intervalMs?: number },
): Promise<any> {
  const maxWait = opts?.maxWaitMs ?? 15_000
  const interval = opts?.intervalMs ?? 1_500
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await request(null, 'GET', `/api/topup/orders/${orderCode}`)
    if (res.status === 200 && res.data?.data) {
      const order = res.data.data
      if (predicate(order)) return order
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`poll topup ${orderCode} timeout`)
}

export type ImeiServiceRow = {
  id: string
  title?: string
  price?: number
  requiresModel?: boolean
  requiresNetwork?: boolean
  requiresProvider?: boolean
  status?: string
}

export async function listImeiServices(limit = 50): Promise<ImeiServiceRow[]> {
  const res = await request(null, 'GET', `/api/imei/services?limit=${limit}`)
  assertStatus(res.status, 200, 'imei services')
  const arr = res.data?.data?.services ?? res.data?.data ?? []
  assert(Array.isArray(arr) && arr.length > 0, 'no imei services')
  return arr as ImeiServiceRow[]
}

export async function getImeiServiceId(): Promise<string> {
  const arr = await listImeiServices(20)
  const noExtra = arr.find(
    (s) =>
      (s.status === 'ACTIVE' || (s as { isActive?: boolean }).isActive !== false) &&
      !s.requiresModel &&
      !s.requiresNetwork &&
      !s.requiresProvider,
  )
  if (noExtra?.id) return noExtra.id
  const active =
    arr.find((s) => s.status === 'ACTIVE' || (s as { isActive?: boolean }).isActive !== false) ??
    arr[0]
  return active!.id
}

export async function findImeiService(opts: {
  titleIncludes?: string
  requiresModel?: boolean
  requiresNetwork?: boolean
  simpleOnly?: boolean
}): Promise<ImeiServiceRow> {
  const arr = await listImeiServices(50)
  const match = arr.find((s) => {
    if (opts.titleIncludes && !String(s.title ?? '').includes(opts.titleIncludes)) return false
    if (opts.requiresModel === true && !s.requiresModel) return false
    if (opts.requiresNetwork === true && !s.requiresNetwork) return false
    if (opts.simpleOnly && (s.requiresModel || s.requiresNetwork || s.requiresProvider)) return false
    return s.status === 'ACTIVE' || (s as { isActive?: boolean }).isActive !== false
  })
  assert(match?.id, `imei service not found: ${JSON.stringify(opts)}`)
  return match
}

export function imeiOrderBody(
  serviceId: string,
  service?: { requiresNetwork?: boolean; requiresModel?: boolean },
  imei?: string,
) {
  const body: Record<string, string> = {
    serviceId,
    imei: imei ?? randomImei15(),
  }
  if (service?.requiresNetwork) body.network = 'Telkomsel'
  if (service?.requiresModel) body.model = 'SM-S928B'
  return body
}

export async function createImeiOrder(
  jar: CookieJar,
  body: Record<string, string>,
): Promise<{ id: string; orderCode: string; status: string; price?: number }> {
  const res = await request(jar, 'POST', '/api/imei/orders', body)
  assert(
    res.status === 200 || res.status === 201,
    `imei order ${res.status} ${JSON.stringify(res.data)}`,
  )
  const row = res.data?.data ?? res.data
  assert(row?.id, 'imei order id missing')
  return {
    id: row.id as string,
    orderCode: row.orderCode as string,
    status: String(row.status ?? 'PENDING').toLowerCase(),
    price: row.price != null ? Number(row.price) : undefined,
  }
}

export async function pollImeiOrder(
  jar: CookieJar,
  orderId: string,
  predicate: (order: { status?: string; code?: string | null }) => boolean,
  opts?: { maxWaitMs?: number; intervalMs?: number },
): Promise<any> {
  const maxWait = opts?.maxWaitMs ?? 15_000
  const interval = opts?.intervalMs ?? 1_500
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await request(jar, 'GET', `/api/imei/orders/${orderId}`)
    if (res.status === 200 && res.data?.data) {
      const order = res.data.data
      const status = String(order.status ?? '').toLowerCase()
      if (predicate({ status, code: order.code ?? null })) {
        return { ...order, status }
      }
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`poll imei order ${orderId} timeout`)
}

export function buildStressImei(kind: 'success' | 'reject' | 'credit' | 'timeout'): string {
  const suffix = { success: '40', reject: '41', credit: '42', timeout: '43' }[kind]
  const mid = String(Date.now() % 1e11).padStart(11, '0')
  return `35${mid}${suffix}`
}

export function randomImei15(): string {
  let s = ''
  for (let i = 0; i < 15; i++) s += String(Math.floor(Math.random() * 10))
  return s
}

export type ServerServiceRow = {
  id: string
  title?: string
  price?: number
  status?: string
  requiredFields?: string | null
}

export async function listServerServices(): Promise<{
  services: ServerServiceRow[]
  boxes: { id: string; title?: string }[]
}> {
  const res = await request(null, 'GET', '/api/imei/server-services')
  assertStatus(res.status, 200, 'server services')
  const payload = res.data?.data ?? res.data ?? {}
  const services = (payload.services ?? []) as ServerServiceRow[]
  const boxes = (payload.boxes ?? []) as { id: string; title?: string }[]
  return { services, boxes }
}

export async function findServerService(opts: {
  titleIncludes?: string
  status?: 'ACTIVE' | 'INACTIVE'
}): Promise<ServerServiceRow> {
  const { services } = await listServerServices()
  const all = opts.status
    ? await (async () => {
        const admin = makeJar()
        assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login for inactive service')
        const res = await request(admin, 'GET', '/api/admin/imei/server-services')
        assertStatus(res.status, 200, 'admin server services')
        return (res.data?.data ?? []) as ServerServiceRow[]
      })()
    : services
  const match = all.find((s) => {
    if (opts.titleIncludes && !String(s.title ?? '').includes(opts.titleIncludes)) return false
    if (opts.status) {
      if (s.status !== opts.status) return false
    } else if (s.status != null && s.status !== 'ACTIVE') {
      return false
    }
    return true
  })
  assert(match?.id, `server service not found: ${JSON.stringify(opts)}`)
  return match
}

export function serverOrderBody(
  serviceId: string,
  opts?: { email?: string; username?: string },
) {
  return {
    serviceId,
    requiredFields: {
      email: opts?.email ?? `ft-user-${Date.now()}@example.com`,
      username: opts?.username ?? 'ft_sigma_user',
    },
  }
}

export function buildStressServerEmail(kind: 'success' | 'reject' | 'credit' | 'timeout'): string {
  const token = { success: 'success', reject: 'reject', credit: 'credit', timeout: 'timeout' }[kind]
  return `ft-server-${token}-${Date.now()}@stress.test`
}

export async function createServerOrder(
  jar: CookieJar,
  body: { serviceId: string; requiredFields: Record<string, string> },
): Promise<{ id: string; orderCode: string; status: string; price?: number }> {
  const res = await request(jar, 'POST', '/api/imei/server-orders', body)
  assert(
    res.status === 200 || res.status === 201,
    `server order ${res.status} ${JSON.stringify(res.data)}`,
  )
  const row = res.data?.data ?? res.data
  assert(row?.id, 'server order id missing')
  return {
    id: row.id as string,
    orderCode: row.orderCode as string,
    status: String(row.status ?? 'PENDING').toLowerCase(),
    price: row.price != null ? Number(row.price) : undefined,
  }
}

export async function pollServerOrder(
  jar: CookieJar,
  orderId: string,
  predicate: (order: { status?: string; code?: string | null }) => boolean,
  opts?: { maxWaitMs?: number; intervalMs?: number },
): Promise<any> {
  const maxWait = opts?.maxWaitMs ?? 15_000
  const interval = opts?.intervalMs ?? 1_500
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await request(jar, 'GET', `/api/imei/server-orders/${orderId}`)
    if (res.status === 200 && res.data?.data) {
      const order = res.data.data
      const status = String(order.status ?? '').toLowerCase()
      if (predicate({ status, code: order.code ?? null })) {
        return { ...order, status }
      }
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`poll server order ${orderId} timeout`)
}

/** Pastikan katalog server ada (buat via admin jika DB kosong). */
export async function ensureServerCatalog(): Promise<void> {
  const { services } = await listServerServices()
  if (services.length >= 1) return

  const admin = makeJar()
  assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login ensure server catalog')

  const apisRes = await request(admin, 'GET', '/api/admin/imei/apis')
  assertStatus(apisRes.status, 200, 'imei apis')
  const apis = apisRes.data?.data ?? []
  const apiId = apis[0]?.id as string | undefined
  assert(apiId, 'no imei api for server service seed')

  const boxRes = await request(admin, 'POST', '/api/admin/imei/server-boxes', {
    title: 'FT Server Box',
    sortOrder: 99,
  })
  assert(boxRes.status === 200 || boxRes.status === 201, `create server box ${boxRes.status}`)
  const boxId = (boxRes.data?.data ?? boxRes.data)?.id as string

  const fieldDefs = JSON.stringify([
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'username', label: 'Username', required: true, type: 'text' },
  ])

  const activeRes = await request(admin, 'POST', '/api/admin/imei/server-services', {
    apiId,
    boxId,
    title: 'Sigma Key Activation (FT)',
    description: 'FT catalog',
    price: 75000,
    deliveryTime: '1-24 jam',
    quantity: 1,
    requiredFields: fieldDefs,
    status: 'ACTIVE',
  })
  assert(activeRes.status === 200 || activeRes.status === 201, `create active server svc ${activeRes.status}`)

  await request(admin, 'POST', '/api/admin/imei/server-services', {
    apiId,
    boxId,
    title: 'Legacy Server Tool (Inactive FT)',
    price: 50000,
    quantity: 1,
    requiredFields: fieldDefs,
    status: 'INACTIVE',
  })
}

export function inspectionPayload(
  teknisiId: string,
  mode: 'ONLINE' | 'OFFLINE',
  overrides?: Record<string, unknown>,
) {
  const scheduledAt = new Date(Date.now() + 86_400_000).toISOString()
  return {
    teknisiId,
    mode,
    category: mode === 'OFFLINE' ? 'LAPTOP' : 'HANDPHONE',
    productName: 'iPhone 13 Pro Max — FT',
    productSource: 'OTHER',
    notes: 'Cek baterai dan kondisi screen',
    scheduledAt,
    ...(mode === 'OFFLINE'
      ? { location: 'Jl. Merdeka No. 45, Bandung', city: 'Bandung' }
      : {}),
    ...overrides,
  }
}

export function sampleInspectionReport(photoCount = 3) {
  const photoUrls = Array.from({ length: photoCount }, (_, i) =>
    `/uploads/inspection/ft-photo-${Date.now()}-${i + 1}.jpg`,
  )
  return {
    overallCondition: 'GOOD' as const,
    recommendation: 'RECOMMENDED' as const,
    checklist: [
      { key: 'battery', label: 'Battery health', result: 'pass' as const },
      { key: 'screen', label: 'Screen', result: 'pass' as const },
      { key: 'charging', label: 'Charging port', result: 'pass' as const },
      { key: 'camera', label: 'Camera', result: 'pass' as const },
      { key: 'speaker', label: 'Speaker', result: 'pass' as const },
      { key: 'mic', label: 'Microphone', result: 'pass' as const },
      { key: 'wifi', label: 'WiFi', result: 'pass' as const },
      { key: 'bluetooth', label: 'Bluetooth', result: 'pass' as const },
      { key: 'faceid', label: 'Face ID', result: 'pass' as const },
      { key: 'buttons', label: 'Physical buttons', result: 'pass' as const },
    ],
    findings:
      'Unit dalam kondisi baik secara keseluruhan. Baterai sehat, layar tanpa dead pixel, port charging normal.',
    suggestions: 'Layak beli, negosiasi 5–10% jika ada gores minor pada bezel.',
    photoUrls,
  }
}

export async function ensureWalletMinBalance(email: string, minBalance: number): Promise<void> {
  const jar = makeJar()
  assert(await login(jar, email), `login ${email}`)
  const w = await request(jar, 'GET', '/api/wallet')
  assertStatus(w.status, 200, 'wallet read')
  const balance = Number(w.data?.data?.balance ?? 0)
  if (balance < minBalance) {
    await adminSetWalletBalance(email, minBalance)
  }
}

export async function ensureAdminProductStock(productId: string, stock: number): Promise<void> {
  const admin = makeJar()
  assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
  const res = await request(admin, 'PATCH', `/api/admin/products/${productId}`, {
    stock,
    listingStatus: 'APPROVED',
    isPublished: true,
    isActive: true,
  })
  assertStatus(res.status, 200, 'admin restock product')
}

export async function createInspectionOrder(
  jar: CookieJar,
  body: Record<string, unknown>,
): Promise<{ id: string; orderCode: string; status: string; teknisiId: string; price?: number }> {
  await ensureWalletMinBalance(ACCOUNTS.seedUser3, 800_000)
  const res = await request(jar, 'POST', '/api/user/inspeksi', body)
  assert(
    res.status === 200 || res.status === 201,
    `inspection order ${res.status} ${JSON.stringify(res.data)}`,
  )
  const row = res.data?.data ?? res.data
  assert(row?.id, 'inspection id missing')
  return {
    id: row.id as string,
    orderCode: row.orderCode as string,
    status: String(row.status ?? 'waiting').toLowerCase(),
    teknisiId: (row.teknisiId ?? row.teknisi?.id) as string,
    price: row.price != null ? Number(row.price) : undefined,
  }
}

export async function bookInspection(
  userJar: CookieJar,
  teknisiId: string,
  mode: 'ONLINE' | 'OFFLINE' = 'ONLINE',
): Promise<{ id: string; status: string; teknisiId: string }> {
  return createInspectionOrder(userJar, inspectionPayload(teknisiId, mode))
}

export async function teknisiAcceptAndStartInspection(
  teknisiJar: CookieJar,
  orderId: string,
): Promise<void> {
  const accept = await request(teknisiJar, 'PATCH', `/api/teknisi/inspeksi/${orderId}`, {
    action: 'accept',
  })
  assertStatus(accept.status, 200, 'accept inspection')
  assert(
    String(accept.data?.data?.status ?? '').toLowerCase() === 'accepted',
    'accepted status',
  )

  const start = await request(teknisiJar, 'PATCH', `/api/teknisi/inspeksi/${orderId}`, {
    action: 'start',
  })
  assertStatus(start.status, 200, 'start inspection')
  assert(
    String(start.data?.data?.status ?? '').toLowerCase() === 'in_progress',
    'in_progress status',
  )
}

export async function teknisiSubmitInspectionReport(
  teknisiJar: CookieJar,
  orderId: string,
  report?: ReturnType<typeof sampleInspectionReport>,
): Promise<void> {
  const res = await request(teknisiJar, 'PATCH', `/api/teknisi/inspeksi/${orderId}`, {
    action: 'submit_report',
    report: report ?? sampleInspectionReport(),
  })
  assertStatus(res.status, 200, 'submit report')
  assert(
    String(res.data?.data?.status ?? '').toLowerCase() === 'report_ready',
    'report_ready status',
  )
}

export async function bookKonsultasiSession(
  userJar: CookieJar,
  teknisiId: string,
  opts?: { forceNew?: boolean },
): Promise<{ id: string; status: string; amount: number }> {
  const list = await request(userJar, 'GET', '/api/user/konsultasi')
  assertStatus(list.status, 200, 'konsultasi list')
  const rows = list.data?.data ?? []
  const pending = rows.find(
    (k: { teknisiId?: string; status?: string }) =>
      k.teknisiId === teknisiId &&
      (k.status === 'pending' || k.status === 'awaiting_payment'),
  )
  if (pending?.id && opts?.forceNew) {
    await request(userJar, 'PATCH', `/api/user/konsultasi/${pending.id}`, { action: 'cancel' })
  } else if (pending?.id) {
    return { id: pending.id as string, status: pending.status as string, amount: Number(pending.amount) }
  }

  const body = await getConsultationBookBody(teknisiId)
  const res = await request(userJar, 'POST', '/api/user/konsultasi', body)
  assert(
    res.status === 200 || res.status === 201,
    `book konsultasi ${res.status} ${JSON.stringify(res.data)}`,
  )
  const row = res.data?.data
  assert(row?.id, 'konsultasi id missing')
  return {
    id: row.id as string,
    status: row.status as string,
    amount: Number(row.amount ?? body.price),
  }
}

export async function getConsultationBookBody(teknisiUserId: string): Promise<{
  teknisiId: string
  service: string
  price: number
  note?: string
  device: string
  clientOs: 'WINDOWS' | 'MACOS'
  remoteId?: string
  remoteOtp?: string
}> {
  const detail = await request(null, 'GET', `/api/teknisi/${teknisiUserId}`)
  assertStatus(detail.status, 200, 'teknisi detail')
  const services = detail.data?.data?.services ?? []
  const svc =
    services.find((s: any) => s.kind === 'consultation') ??
    services.find((s: any) => typeof s.price === 'number')
  assert(svc?.name && svc?.price != null, 'teknisi tidak punya layanan konsultasi')
  const body = {
    teknisiId: teknisiUserId,
    service: svc.name as string,
    price: Number(svc.price),
    note: 'functional test',
    device: 'iPhone 13 Pro',
    clientOs: 'WINDOWS' as const,
    remoteId: undefined as string | undefined,
    remoteOtp: undefined as string | undefined,
  }
  if (svc.requiresRemote) {
    body.remoteId = '987 654 321'
    body.remoteOtp = '654321'
  }
  return body
}

export function remoteRequestBody(teknisiId: string) {
  return {
    teknisiId,
    remoteId: '987 654 321',
    otp: '654321',
    description: 'iPhone stuck di logo Apple setelah update iOS. Butuh restore via remote.',
    platform: 'Windows 11',
  }
}

export async function requestRemoteSession(
  userJar: CookieJar,
  teknisiId: string,
): Promise<{ id: string; status: string }> {
  const res = await request(userJar, 'POST', '/api/remote', remoteRequestBody(teknisiId))
  assert(
    res.status === 200 || res.status === 201,
    `request remote ${res.status} ${JSON.stringify(res.data)}`,
  )
  const row = res.data?.data
  assert(row?.id, 'remote session id missing')
  return { id: row.id as string, status: row.status as string }
}

export function productCreateBody(name: string) {
  return {
    name,
    category: 'LAINNYA',
    price: 100_000,
    description: 'Functional test listing',
    stock: 10,
  }
}

export function storeActivatePayload(suffix: string | number = Date.now()) {
  return {
    name: `FT Store ${suffix}`,
    city: 'Bandung',
    address: 'Jl. Functional Test No. 1',
    phone: '081234567890',
  }
}

export async function adminManualDeposit(
  email: string,
  amount: number,
  note: string,
): Promise<void> {
  const adminJar = makeJar()
  assert(await login(adminJar, ACCOUNTS.seedAdmin), 'admin login')
  const userId = await getUserIdByEmail(email)
  const res = await request(adminJar, 'POST', '/api/admin/wallet/deposit', {
    userId,
    amount,
    method: 'manual',
    note,
  })
  assertStatus(res.status, [200, 201], `manual deposit ${email}`)
}

export async function getOrCreateChatConversation(
  jar: CookieJar,
  peerId: string,
): Promise<string> {
  const conv = await request(jar, 'POST', '/api/chat/conversations', { peerId })
  assert(conv.status === 200 || conv.status === 201, `chat conv ${conv.status}`)
  const id = conv.data?.data?.id ?? conv.data?.id
  assert(id, 'conversation id')
  return id as string
}

export async function findAndPrepareSeedIphoneProduct(): Promise<{
  id: string
  name: string
  price: number
}> {
  const nameIncludes = 'iPhone 13 Pro Max - Second'
  const admin = makeJar()
  assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
  const list = await request(admin, 'GET', '/api/admin/products')
  assertStatus(list.status, 200, 'admin products')
  const row = (list.data?.data ?? []).find((p: { name?: string }) =>
    p.name?.includes(nameIncludes),
  )
  assert(row?.id, `seed product "${nameIncludes}" not in admin catalog`)
  await ensureAdminProductStock(row.id as string, 5)
  return {
    id: row.id as string,
    name: row.name as string,
    price: Number(row.price ?? 0),
  }
}

export async function findPublishedProduct(
  nameIncludes: string,
): Promise<{ id: string; name: string; price: number }> {
  const q = encodeURIComponent(nameIncludes)
  const res = await request(null, 'GET', `/api/marketplace/products?limit=20&q=${q}`)
  assertStatus(res.status, 200, 'marketplace products')
  const rows = res.data?.data ?? []
  const product = rows.find((p: { name?: string }) => p.name?.includes(nameIncludes))
  assert(product?.id, `product "${nameIncludes}" not found in marketplace`)
  return {
    id: product.id as string,
    name: product.name as string,
    price: Number(product.price ?? 0),
  }
}

export async function marketplaceCheckoutProduct(
  buyerJar: CookieJar,
  productId: string,
  quantity = 1,
): Promise<{ orderId: string; orderCode: string; status: string }> {
  const res = await request(buyerJar, 'POST', '/api/marketplace/checkout', {
    items: [{ productId, quantity }],
    shippingAddress: 'Jl. Functional Test No. 1, Jakarta',
    shippingPhone: '081234567890',
    requiresShipping: true,
  })
  assert(
    res.status === 200 || res.status === 201,
    `marketplace checkout ${res.status} ${JSON.stringify(res.data)}`,
  )
  const payload = res.data?.data
  const order = Array.isArray(payload?.orders)
    ? payload.orders[0]
    : payload?.order ?? payload
  assert(order?.id, `order id missing: ${JSON.stringify(res.data)}`)
  return {
    orderId: order.id as string,
    orderCode: order.orderCode as string,
    status: String(order.status ?? 'PAID').toLowerCase(),
  }
}

export async function createTeknisiPendingProduct(
  teknisiJar: CookieJar,
  name?: string,
): Promise<string> {
  const res = await request(
    teknisiJar,
    'POST',
    '/api/teknisi/products',
    productCreateBody(name ?? `[FT] Product ${Date.now()}`),
  )
  assert(res.status === 200 || res.status === 201, `product create ${res.status}`)
  const id = res.data?.data?.id
  assert(id, 'product id')
  return id as string
}

export function generateReport(opts: {
  mode: string
  totalFromDocs: number
}): string {
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length
  const total = results.length
  const verdict = failed === 0 ? (skipped === 0 ? '✅ ALL PASS' : '⚠️ PASS WITH SKIPS') : '❌ SOME FAILURES'

  const totalDurationMs = results.reduce((s, r) => s + r.durationMs, 0)
  const avgDurationMs = total > 0 ? Math.round(totalDurationMs / total) : 0

  const date = new Date().toISOString().slice(0, 10)
  const time = new Date().toISOString().slice(11, 19)

  const byDomain = new Map<string, TestResult[]>()
  for (const r of results) {
    const list = byDomain.get(r.domain) ?? []
    list.push(r)
    byDomain.set(r.domain, list)
  }

  const lines: string[] = []
  lines.push(`# Functional Full Test Report — ${date}`)
  lines.push('')
  lines.push(`**Run at**: ${date} ${time} UTC`)
  lines.push(`**Base URL**: ${BASE_URL}`)
  lines.push(`**Mode**: ${opts.mode}`)
  lines.push(`**Auth**: \`/api/stress-internal/login\` (STRESS_TEST_MODE=true)`)
  lines.push(`**Dokumentasi**: ${opts.totalFromDocs} skenario di \`docs/functional-tests/\``)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 1. Executive Summary')
  lines.push('')
  lines.push(`- **Verdict**: ${verdict}`)
  lines.push(`- **Total dieksekusi**: ${total}`)
  lines.push(`- **Pass**: ${passed} (${total ? Math.round((passed / total) * 100) : 0}%)`)
  lines.push(`- **Fail**: ${failed}`)
  lines.push(`- **Skip**: ${skipped} (UI-only / belum ada API / butuh interaksi manual)`)
  lines.push(`- **Total duration**: ${(totalDurationMs / 1000).toFixed(2)}s`)
  lines.push(`- **Avg per case**: ${avgDurationMs}ms`)
  lines.push('')

  lines.push('## 2. Per-Domain Results')
  lines.push('')
  for (const [domain, list] of [...byDomain.entries()].sort()) {
    const domainPass = list.filter((r) => r.status === 'PASS').length
    const domainFail = list.filter((r) => r.status === 'FAIL').length
    const domainSkip = list.filter((r) => r.status === 'SKIP').length
    const icon = domainFail > 0 ? '❌' : domainSkip > 0 ? '⚠️' : '✅'
    lines.push(
      `### ${icon} ${domain} (pass ${domainPass} / fail ${domainFail} / skip ${domainSkip} / total ${list.length})`,
    )
    lines.push('')
    lines.push('| ID | Test Case | Status | Duration | Note |')
    lines.push('| --- | --- | :---: | ---: | --- |')
    for (const r of list) {
      const emoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️'
      const note = (r.message ?? '—').replace(/\|/g, '\\|').slice(0, 120)
      lines.push(`| ${r.id} | ${r.title} | ${emoji} ${r.status} | ${r.durationMs}ms | ${note} |`)
    }
    lines.push('')
  }

  const failures = results.filter((r) => r.status === 'FAIL')
  lines.push('## 3. Failed Tests')
  lines.push('')
  if (failures.length === 0) {
    lines.push('Tidak ada kegagalan.')
  } else {
    for (const f of failures) {
      lines.push(`### ${f.id} — ${f.title}`)
      lines.push('')
      lines.push(`- **File**: \`${f.file}\``)
      lines.push(`- **Error**: ${f.message ?? 'unknown'}`)
      lines.push('')
    }
  }

  const skips = results.filter((r) => r.status === 'SKIP')
  lines.push('## 4. Skipped Tests (ringkasan alasan)')
  lines.push('')
  if (skips.length === 0) {
    lines.push('Tidak ada skip.')
  } else {
    const byReason = new Map<string, string[]>()
    for (const s of skips) {
      const reason = s.message ?? 'unknown'
      const ids = byReason.get(reason) ?? []
      ids.push(s.id)
      byReason.set(reason, ids)
    }
    for (const [reason, ids] of byReason.entries()) {
      lines.push(`- **${reason}**: ${ids.join(', ')}`)
    }
  }
  lines.push('')

  return lines.join('\n')
}

export function writeReport(content: string, suffix = 'full-run'): string {
  mkdirSync(RESULTS_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const reportPath = join(RESULTS_DIR, `${date}-${suffix}.md`)
  writeFileSync(reportPath, content)
  return reportPath
}
