import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  assert,
  assert4xx,
  assertStatus,
  buildStressServerEmail,
  createServerOrder,
  ensureServerCatalog,
  findServerService,
  listServerServices,
  login,
  makeJar,
  pollServerOrder,
  request,
  serverOrderBody,
} from '../lib'

export function registerServerHandlers(r: HandlerRegistry): void {
  r.api('FT-SRV-001', async () => {
    const { services, boxes } = await listServerServices()
    assert(services.length >= 1, `expected >= 1 server service got ${services.length}`)
    assert(boxes.length >= 1, 'expected >= 1 server box')
    const active = services.every((s) => s.status === 'ACTIVE' || s.status === undefined)
    assert(active, 'public catalog should only list ACTIVE services')
  })

  r.api('FT-SRV-002', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findServerService({ titleIncludes: 'Sigma' })
    const before = await request(siti, 'GET', '/api/wallet')
    assertStatus(before.status, 200, 'wallet before')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const order = await createServerOrder(siti, serverOrderBody(service.id))
    assert(
      order.status === 'pending' || order.status === 'in_process' || order.status === 'rejected',
      `status ${order.status}`,
    )

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    if (order.status !== 'rejected') {
      assert(balanceBefore > balanceAfter, 'wallet should decrease after server order')
    }
  })

  r.api('FT-SRV-003', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findServerService({ titleIncludes: 'Sigma' })
    const { id } = await createServerOrder(
      siti,
      serverOrderBody(service.id, { email: buildStressServerEmail('success') }),
    )
    const completed = await pollServerOrder(
      siti,
      id,
      (o) => o.status === 'success' && !!o.code,
      { maxWaitMs: 12_000, intervalMs: 1_500 },
    )
    assert(String(completed.code ?? '').includes('LICENSE'), 'server result code missing')
  })

  r.api('FT-SRV-004', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const list = await request(siti, 'GET', '/api/imei/server-orders?limit=20')
    assertStatus(list.status, 200, 'server orders list')
    const rows = list.data?.data ?? []
    const seed = rows.find((o: { orderCode?: string }) => o.orderCode === 'SRV-2026-A1B2C3')
    const order =
      seed ?? rows.find((o: { status?: string }) => o.status === 'SUCCESS') ?? rows[0]
    assert(order?.id, 'no server order for detail test')
    const detail = await request(siti, 'GET', `/api/imei/server-orders/${order.id}`)
    assertStatus(detail.status, 200, 'server order detail')
    assert(
      String(detail.data?.data?.status ?? '').toUpperCase() === 'SUCCESS' ||
        detail.data?.data?.code,
      'expected SUCCESS server order with code',
    )
  })

  r.api('FT-SRV-005', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 1_000_000)
    const service = await findServerService({ titleIncludes: 'Sigma' })
    const before = await request(siti, 'GET', '/api/wallet')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const { id } = await createServerOrder(
      siti,
      serverOrderBody(service.id, { email: buildStressServerEmail('reject') }),
    )

    await pollServerOrder(siti, id, (o) => o.status === 'rejected', {
      maxWaitMs: 8_000,
      intervalMs: 1_000,
    })

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(
      balanceAfter >= balanceBefore,
      `refund expected ${balanceAfter} >= ${balanceBefore}`,
    )
  })

  r.api('FT-SRV-101', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(siti, 'POST', '/api/imei/server-orders', {
      serviceId: '00000000-0000-0000-0000-000000000000',
      requiredFields: { email: 'a@b.com', username: 'u1' },
    })
    assert(res.status === 404, `expected 404 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('tidak ditemukan') ||
        String(res.data?.error ?? '').toLowerCase().includes('service'),
      'service not found message',
    )
  })

  r.api('FT-SRV-102', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findServerService({ titleIncludes: 'Sigma' })
    const res = await request(siti, 'POST', '/api/imei/server-orders', {
      serviceId: service.id,
      requiredFields: { username: 'only_username' },
    })
    assert4xx(res.status, 'missing email')
    assert(res.status === 400, `expected 400 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('wajib'),
      `field required: ${res.data?.error}`,
    )
  })

  r.api('FT-SRV-103', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const inactive = await findServerService({
      titleIncludes: 'Inactive',
      status: 'INACTIVE',
    })
    const res = await request(siti, 'POST', '/api/imei/server-orders', {
      serviceId: inactive.id,
      requiredFields: { email: 'a@b.com', username: 'u1' },
    })
    assert(res.status === 400, `expected 400 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('tidak aktif'),
      `inactive message: ${res.data?.error}`,
    )
  })

  r.api('FT-SRV-201', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 1_000_000)
    const service = await findServerService({ titleIncludes: 'Sigma' })
    const before = await request(siti, 'GET', '/api/wallet')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const created = await createServerOrder(
      siti,
      serverOrderBody(service.id, { email: buildStressServerEmail('timeout') }),
    )
    const final =
      created.status === 'rejected'
        ? created
        : await pollServerOrder(siti, created.id, (o) => o.status === 'rejected', {
            maxWaitMs: 8_000,
            intervalMs: 1_000,
          })
    assert(String(final.status).toLowerCase() === 'rejected', `rejected got ${final.status}`)

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(balanceAfter >= balanceBefore, 'timeout refund expected')
  })

  r.api('FT-SRV-901', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const list = await request(siti, 'GET', '/api/imei/server-orders?limit=20')
    const rows = list.data?.data ?? []
    const target =
      rows.find((o: { orderCode?: string }) => o.orderCode === 'SRV-2026-A1B2C3') ?? rows[0]
    assert(target?.id, 'siti server order missing')

    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const res = await request(rudi, 'GET', `/api/imei/server-orders/${target.id}`)
    assert(res.status === 403, `expected 403 got ${res.status}`)
  })
}
