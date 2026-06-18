import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  adminTopupUser,
  assert,
  assert4xx,
  assertStatus,
  createRekberAndFund,
  findRekberForBuyer,
  getTeknisiId,
  getUserIdByEmail,
  login,
  makeJar,
  request,
} from '../lib'

export function registerRekberHandlers(r: HandlerRegistry): void {
  r.api('FT-RKB-001', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 8_000_000)
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser2), 'login rudi')
    const sellerId = await getUserIdByEmail(ACCOUNTS.seedTeknisi2)
    const { id, orderCode } = await createRekberAndFund(jar, {
      sellerId,
      amount: 7_200_000,
      description: 'Pembelian Samsung S21 Ultra via rekber',
    })
    assert(orderCode.startsWith('RKB-'), 'order code')
    const detail = await request(jar, 'GET', `/api/rekber/${id}`)
    assert(detail.data?.data?.status === 'held', 'expected HELD')
  })

  r.api('FT-RKB-002', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser2), 'login rudi')
    const seed = await findRekberForBuyer(jar, 'RKB-2026-000001')
    const targetId =
      seed?.status === 'held'
        ? seed.id
        : (
            await createRekberAndFund(jar, {
              sellerId: await getUserIdByEmail(ACCOUNTS.seedTeknisi2),
              amount: 500_000,
              description: 'Release test rekber',
            })
          ).id

    const release = await request(jar, 'PATCH', `/api/rekber/${targetId}`, {
      action: 'release',
    })
    assertStatus(release.status, 200, 'release')
    assert(release.data?.data?.status === 'released', 'status released')
  })

  r.api('FT-RKB-003', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 2_000_000)
    const buyer = makeJar()
    assert(await login(buyer, ACCOUNTS.seedUser2), 'buyer login')
    const sellerId = await getUserIdByEmail(ACCOUNTS.seedTeknisi1)
    const { id } = await createRekberAndFund(buyer, {
      sellerId,
      amount: 1_000_000,
      description: 'Admin refund test rekber',
    })

    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const refund = await request(admin, 'POST', `/api/admin/rekber/${id}/resolve`, {
      action: 'refund',
      note: 'Functional test refund',
    })
    assertStatus(refund.status, 200, 'admin refund')
    assert(refund.data?.data?.status === 'refunded', 'refunded')
  })

  r.api('FT-RKB-004', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 2_000_000)
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser2), 'login rudi')
    const { id } = await createRekberAndFund(jar, {
      sellerId: await getUserIdByEmail(ACCOUNTS.seedTeknisi2),
      amount: 800_000,
      description: 'Dispute test rekber',
    })

    const dispute = await request(jar, 'PATCH', `/api/rekber/${id}`, {
      action: 'dispute',
      note: 'Layanan tidak sesuai deskripsi.',
    })
    assertStatus(dispute.status, 200, 'dispute')
    assert(dispute.data?.data?.status === 'disputed', 'disputed')
  })

  r.api('FT-RKB-101', async () => {
    const res = await request(null, 'POST', '/api/rekber', {
      sellerId: 'x',
      amount: 1000,
      description: 'test unauthorized',
    })
    assert4xx(res.status, 'guest rekber')
    assert(res.status === 401, 'expected 401')
  })

  r.api('FT-RKB-102', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser2), 'login')
    const sellerId = await getUserIdByEmail(ACCOUNTS.seedTeknisi2)
    const res = await request(jar, 'POST', '/api/rekber', {
      sellerId,
      amount: 0,
      description: 'invalid amount test',
    })
    assert4xx(res.status, 'zero amount')
  })

  r.api('FT-RKB-103', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser3, 100_000)
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser3), 'login dewi')
    const sellerId = await getUserIdByEmail(ACCOUNTS.seedTeknisi2)
    const create = await request(jar, 'POST', '/api/rekber', {
      sellerId,
      amount: 5_000_000,
      description: 'Should fail insufficient balance',
    })
    assert(create.status === 200 || create.status === 201, 'create pending ok')
    const id = create.data?.data?.id
    const fund = await request(jar, 'PATCH', `/api/rekber/${id}`, { action: 'fund' })
    assert(fund.status === 402 || fund.status === 400, `fund ${fund.status}`)
    assert(
      String(fund.data?.error ?? '').toLowerCase().includes('saldo'),
      'insufficient balance message',
    )
  })

  r.api('FT-RKB-104', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser2), 'login')
    const res = await request(jar, 'POST', '/api/rekber', {
      sellerEmail: 'tidak-ada@gmail.com',
      amount: 100_000,
      description: 'unknown seller',
    })
    assert(res.status === 404, `expected 404 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('tidak ditemukan'),
      'seller not found',
    )
  })

  r.api('FT-RKB-201', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 1_500_000)
    const buyer = makeJar()
    assert(await login(buyer, ACCOUNTS.seedUser2), 'buyer')
    const { id } = await createRekberAndFund(buyer, {
      sellerId: await getUserIdByEmail(ACCOUNTS.seedTeknisi2),
      amount: 500_000,
      description: 'Refund then release edge',
    })

    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin')
    await request(admin, 'POST', `/api/admin/rekber/${id}/resolve`, {
      action: 'refund',
      note: 'Edge 201',
    })

    const release = await request(buyer, 'PATCH', `/api/rekber/${id}`, { action: 'release' })
    assert(release.status === 409, `expected 409 got ${release.status}`)
    assert(release.data?.code === 'INVALID_STATE', 'INVALID_STATE code')
  })

  r.api('FT-RKB-202', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 1_500_000)
    const buyer = makeJar()
    assert(await login(buyer, ACCOUNTS.seedUser2), 'buyer')
    const { id } = await createRekberAndFund(buyer, {
      sellerId: await getUserIdByEmail(ACCOUNTS.seedTeknisi2),
      amount: 400_000,
      description: 'Double release edge',
    })

    const first = await request(buyer, 'PATCH', `/api/rekber/${id}`, { action: 'release' })
    assertStatus(first.status, 200, 'first release')
    const second = await request(buyer, 'PATCH', `/api/rekber/${id}`, { action: 'release' })
    assert(second.status === 409, `double release ${second.status}`)
    assert(second.data?.code === 'INVALID_STATE', 'INVALID_STATE')
  })

  r.api('FT-RKB-901', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 1_000_000)
    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'rudi')
    const { id } = await createRekberAndFund(rudi, {
      sellerId: await getUserIdByEmail(ACCOUNTS.seedTeknisi2),
      amount: 300_000,
      description: 'RBAC release test',
    })

    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'siti')
    const release = await request(siti, 'PATCH', `/api/rekber/${id}`, { action: 'release' })
    assert(release.status === 403, `expected 403 got ${release.status}`)
  })
}
