import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  assert,
  assert4xx,
  assertStatus,
  getTopupCatalog,
  login,
  makeJar,
  pickTopupDenom,
  pollTopupOrder,
  request,
  skip,
  topupCheckout,
} from '../lib'

const PULSA_SLUG = 'pulsa-telkomsel'
const STRESS_FAIL_MSISDN = '0812900000000'

export function registerTopupHandlers(r: HandlerRegistry): void {
  r.api('FT-TOP-001', async () => {
    const { products, denominations } = await getTopupCatalog()
    assert(products.length > 0, 'katalog produk kosong')
    assert(denominations.length > 0, 'katalog denominasi kosong')
    const tsel = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    assert(tsel?.denominationSku, 'pulsa telkomsel tidak ada di seed')
  })

  r.api('FT-TOP-002', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'GET', `/api/topup/products/${PULSA_SLUG}`)
    assertStatus(res.status, 200, 'product detail')
    const denoms = res.data?.data?.denominations ?? []
    const d25 = denoms.find((d: any) => d.sku === 'tsel-20k' || d.label?.includes('20.000'))
    assert(d25, 'denominasi pulsa tidak ditemukan')
  })

  r.api('FT-TOP-003', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const { denominations } = await getTopupCatalog(jar)
    const pick = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    if (!pick) skip('Katalog topup kosong — jalankan npm run db:seed')
    const { order } = await topupCheckout(jar, pick!, '081234567890')
    assert(
      order.status === 'processing' || order.status === 'paid',
      `status after checkout ${order.status}`,
    )
  })

  r.api('FT-TOP-004', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const { denominations } = await getTopupCatalog(jar)
    const pick = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    if (!pick) skip('Katalog topup kosong')
    const { orderCode } = await topupCheckout(jar, pick!, '081211111111')
    const completed = await pollTopupOrder(
      orderCode,
      (o) => o.status === 'completed',
      { maxWaitMs: 12_000, intervalMs: 2_000 },
    )
    assert(completed.fulfillmentCode, 'fulfillment code missing on COMPLETED')
  })

  r.api('FT-TOP-101', async () => {
    const res = await request(null, 'POST', '/api/topup/checkout', {
      productSlug: PULSA_SLUG,
      denominationSku: 'tsel-5k',
      accountId: '081234567890',
      paymentMethod: 'saldo',
    })
    assert4xx(res.status, 'guest topup')
    assert(res.status === 401, 'expected 401')
  })

  r.api('FT-TOP-102', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login')
    const res = await request(jar, 'POST', '/api/topup/checkout', {
      productSlug: 'nonexistent-slug-xyz',
      denominationSku: 'nope',
      accountId: '081234567890',
      paymentMethod: 'saldo',
    })
    assert(res.status === 404, `expected 404 got ${res.status}`)
  })

  r.api('FT-TOP-103', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login')
    const { denominations } = await getTopupCatalog(jar)
    const pick = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    if (!pick) skip('Katalog topup kosong')
    const res = await request(jar, 'POST', '/api/topup/checkout', {
      productSlug: pick!.productSlug,
      denominationSku: pick!.denominationSku,
      accountId: 'abc-123',
      paymentMethod: 'saldo',
    })
    assert(res.status === 400, `expected 400 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('nomor'),
      'MSISDN validation message',
    )
  })

  r.api('FT-TOP-104', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser3, 100_000)
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser3), 'login dewi')
    const { denominations } = await getTopupCatalog(jar)
    const pick =
      pickTopupDenom(denominations, { productSlug: 'voucher-google-play', minPrice: 200_000 }) ??
      pickTopupDenom(denominations, { productSlug: PULSA_SLUG, minPrice: 100_000 })
    if (!pick) skip('Tidak ada denominasi untuk tes saldo kurang')
    const accountId = pick.productSlug.startsWith('pulsa') ? '081234567890' : 'dewi@gmail.com'
    const res = await request(jar, 'POST', '/api/topup/checkout', {
      productSlug: pick.productSlug,
      denominationSku: pick.denominationSku,
      accountId,
      paymentMethod: 'saldo',
    })
    assert(res.status === 402 || res.status === 400, `insufficient ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('saldo'),
      'insufficient balance message',
    )
  })

  r.api('FT-TOP-201', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const { denominations } = await getTopupCatalog(jar)
    const pick = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    if (!pick) skip('Katalog topup kosong')

    const walletBefore = await request(jar, 'GET', '/api/wallet')
    assertStatus(walletBefore.status, 200, 'wallet before')
    const balanceBefore = Number(walletBefore.data?.data?.balance ?? 0)

    const { orderCode, order } = await topupCheckout(jar, pick!, STRESS_FAIL_MSISDN)
    const total = Number(order.total ?? pick!.basePrice)

    const failed = await pollTopupOrder(
      orderCode,
      (o) => o.status === 'failed',
      { maxWaitMs: 8_000, intervalMs: 1_500 },
    )
    assert(failed.status === 'failed', 'expected failed status')

    const walletAfter = await request(jar, 'GET', '/api/wallet')
    assertStatus(walletAfter.status, 200, 'wallet after')
    const balanceAfter = Number(walletAfter.data?.data?.balance ?? 0)
    assert(
      Math.abs(balanceAfter - balanceBefore) < 100,
      `refund expected ~${balanceBefore} got ${balanceAfter} (paid ${total})`,
    )
  })

  r.api('FT-TOP-901', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedAdmin), 'admin login')
    const { denominations } = await getTopupCatalog(jar)
    const pick = pickTopupDenom(denominations, { productSlug: PULSA_SLUG })
    if (!pick) skip('Katalog topup kosong')
    const res = await request(jar, 'POST', '/api/topup/checkout', {
      productSlug: pick!.productSlug,
      denominationSku: pick!.denominationSku,
      accountId: '081234567890',
      paymentMethod: 'saldo',
      userId: 'should-be-ignored',
    })
    assert(res.status === 403, `admin checkout expected 403 got ${res.status}`)
  })
}
