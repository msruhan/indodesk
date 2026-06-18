import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  assert,
  assert4xx,
  assertStatus,
  buildStressImei,
  createImeiOrder,
  findImeiService,
  getImeiServiceId,
  imeiOrderBody,
  listImeiServices,
  login,
  makeJar,
  pollImeiOrder,
  randomImei15,
  request,
} from '../lib'

export function registerImeiHandlers(r: HandlerRegistry): void {
  r.api('FT-IMEI-001', async () => {
    const arr = await listImeiServices(20)
    assert(arr.length >= 6, `expected >= 6 services got ${arr.length}`)
    const groupsRes = await request(null, 'GET', '/api/imei/groups')
    assertStatus(groupsRes.status, 200, 'imei groups')
    const groups = groupsRes.data?.data ?? []
    assert(Array.isArray(groups) && groups.length > 0, 'no imei groups')
  })

  r.api('FT-IMEI-002', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findImeiService({ titleIncludes: 'Blacklist Check', simpleOnly: true })
    const before = await request(siti, 'GET', '/api/wallet')
    assertStatus(before.status, 200, 'wallet before')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const order = await createImeiOrder(siti, imeiOrderBody(service.id, service))
    assert(
      order.status === 'pending' || order.status === 'in_process',
      `status ${order.status}`,
    )

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(balanceBefore > balanceAfter, 'wallet should decrease after IMEI order')
  })

  r.api('FT-IMEI-003', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findImeiService({
      titleIncludes: 'S24 Ultra',
      requiresModel: true,
      requiresNetwork: true,
    })
    const order = await createImeiOrder(
      siti,
      imeiOrderBody(service.id, service, randomImei15()),
    )
    assert(order.id, 'order created with model+network')
  })

  r.api('FT-IMEI-004', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const serviceId = await getImeiServiceId()
    const { id } = await createImeiOrder(
      siti,
      imeiOrderBody(serviceId, undefined, buildStressImei('success')),
    )
    const completed = await pollImeiOrder(
      siti,
      id,
      (o) => o.status === 'success' && !!o.code,
      { maxWaitMs: 12_000, intervalMs: 1_500 },
    )
    assert(String(completed.code ?? '').includes('NCK'), 'unlock code missing')
  })

  r.api('FT-IMEI-005', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const list = await request(siti, 'GET', '/api/imei/orders?limit=20')
    assertStatus(list.status, 200, 'orders list')
    const rows = list.data?.data ?? []
    const seed = rows.find((o: { orderCode?: string }) => o.orderCode === 'IMEI-2026-A1B2C3')
    const order = seed ?? rows.find((o: { status?: string }) => o.status === 'SUCCESS') ?? rows[0]
    assert(order?.id, 'no imei order for detail test')
    const detail = await request(siti, 'GET', `/api/imei/orders/${order.id}`)
    assertStatus(detail.status, 200, 'order detail')
    assert(
      String(detail.data?.data?.status ?? '').toUpperCase() === 'SUCCESS' ||
        detail.data?.data?.code,
      'expected SUCCESS order with code',
    )
  })

  r.api('FT-IMEI-101', async () => {
    const serviceId = await getImeiServiceId()
    const res = await request(null, 'POST', '/api/imei/orders', {
      serviceId,
      imei: '12345',
    })
    assert4xx(res.status, 'guest imei order')
    assert(res.status === 401, `expected 401 got ${res.status}`)
  })

  r.api('FT-IMEI-102', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const serviceId = await getImeiServiceId()
    const res = await request(siti, 'POST', '/api/imei/orders', {
      serviceId,
      imei: '12345ABC9012345',
    })
    assert4xx(res.status, 'non-numeric imei')
    assert(res.status === 400, `expected 400 got ${res.status}`)
  })

  r.api('FT-IMEI-103', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(siti, 'POST', '/api/imei/orders', {
      serviceId: '00000000-0000-0000-0000-000000000000',
      imei: '356938035643809',
    })
    assert(res.status === 404, `expected 404 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('tidak ditemukan') ||
        String(res.data?.error ?? '').toLowerCase().includes('layanan'),
      'service not found message',
    )
  })

  r.api('FT-IMEI-104', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const service = await findImeiService({
      titleIncludes: 'S24 Ultra',
      requiresModel: true,
      requiresNetwork: true,
    })
    const res = await request(siti, 'POST', '/api/imei/orders', {
      serviceId: service.id,
      imei: randomImei15(),
    })
    assert4xx(res.status, 'missing model/network')
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('wajib'),
      `field required message: ${res.data?.error}`,
    )
  })

  r.api('FT-IMEI-201', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 1_000_000)
    const serviceId = await getImeiServiceId()
    const before = await request(siti, 'GET', '/api/wallet')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const created = await createImeiOrder(
      siti,
      imeiOrderBody(serviceId, undefined, buildStressImei('timeout')),
    )
    assert(
      created.status === 'rejected' || created.status === 'pending',
      `unexpected status after timeout submit: ${created.status}`,
    )
    const final =
      created.status === 'rejected'
        ? created
        : await pollImeiOrder(siti, created.id, (o) => o.status === 'rejected', {
            maxWaitMs: 8_000,
            intervalMs: 1_000,
          })
    assert(
      String(final.status).toLowerCase() === 'rejected',
      `rejected status got ${final.status}`,
    )

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(
      balanceAfter >= balanceBefore,
      `refund expected balance restored got ${balanceAfter} vs ${balanceBefore}`,
    )
  })

  r.api('FT-IMEI-202', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 1_000_000)
    const serviceId = await getImeiServiceId()
    const before = await request(siti, 'GET', '/api/wallet')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const res = await request(siti, 'POST', '/api/imei/orders', {
      serviceId,
      imei: buildStressImei('credit'),
    })
    assert(
      res.status === 201 || res.status === 200,
      `order may be created then rejected: ${res.status}`,
    )
    const row = res.data?.data ?? res.data
    const orderId = row?.id as string
    assert(orderId, 'order id')
    const statusNow = String(row?.status ?? '').toLowerCase()
    if (statusNow !== 'rejected') {
      await pollImeiOrder(
        siti,
        orderId,
        (o) => o.status === 'rejected',
        { maxWaitMs: 8_000, intervalMs: 1_000 },
      )
    }

    const after = await request(siti, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(
      balanceAfter >= balanceBefore,
      `credit-fail refund expected ${balanceAfter} >= ${balanceBefore}`,
    )
  })

  r.api('FT-IMEI-901', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const list = await request(siti, 'GET', '/api/imei/orders?limit=20')
    const rows = list.data?.data ?? []
    const target =
      rows.find((o: { orderCode?: string }) => o.orderCode === 'IMEI-2026-A1B2C3') ?? rows[0]
    assert(target?.id, 'siti imei order missing')

    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const res = await request(rudi, 'GET', `/api/imei/orders/${target.id}`)
    assert(res.status === 403, `expected 403 got ${res.status}`)
  })
}
