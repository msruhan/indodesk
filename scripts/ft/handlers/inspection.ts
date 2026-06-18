import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  ensureWalletMinBalance,
  assert4xx,
  assertStatus,
  bookInspection,
  createInspectionOrder,
  getTeknisiId,
  inspectionPayload,
  login,
  makeJar,
  request,
  sampleInspectionReport,
  teknisiAcceptAndStartInspection,
  teknisiSubmitInspectionReport,
} from '../lib'

export function registerInspectionHandlers(r: HandlerRegistry): void {
  r.api('FT-INS-001', async () => {
    await ensureWalletMinBalance(ACCOUNTS.seedUser3, 2_000_000)
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const before = await request(dewi, 'GET', '/api/wallet')
    assertStatus(before.status, 200, 'wallet before')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const order = await bookInspection(dewi, teknisiId, 'ONLINE')
    assert(order.status === 'waiting', `expected waiting (PAID) got ${order.status}`)
    assert(order.teknisiId === teknisiId, 'teknisi assigned at booking')

    const after = await request(dewi, 'GET', '/api/wallet')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(balanceBefore > balanceAfter, 'wallet debited for inspection')
  })

  r.api('FT-INS-002', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const order = await createInspectionOrder(
      dewi,
      inspectionPayload(teknisiId, 'OFFLINE', {
        category: 'LAPTOP',
        productName: 'MacBook Pro 14 — FT',
      }),
    )
    assert(order.status === 'waiting', `expected waiting (PAID) got ${order.status}`)
  })

  r.api('FT-INS-003', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const order = await bookInspection(dewi, teknisiId, 'ONLINE')

    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'login admin')
    const list = await request(admin, 'GET', '/api/admin/inspeksi')
    assertStatus(list.status, 200, 'admin inspeksi list')
    const items = list.data?.data?.items ?? list.data?.items ?? []
    const found = items.find((o: { id?: string }) => o.id === order.id)
    assert(found, 'order visible to admin')
    assert(found.teknisi?.id === teknisiId, 'teknisi set (user picks teknisi at booking)')
    assert(
      String(found.status ?? '').toLowerCase() === 'waiting',
      'status waiting (PAID) awaiting teknisi accept',
    )
  })

  r.api('FT-INS-004', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const { id } = await bookInspection(dewi, teknisiId, 'ONLINE')

    const ahmad = makeJar()
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    await teknisiAcceptAndStartInspection(ahmad, id)

    const detail = await request(ahmad, 'GET', `/api/teknisi/inspeksi/${id}`)
    assertStatus(detail.status, 200, 'detail after start')
    assert(
      String(detail.data?.data?.status ?? '').toLowerCase() === 'in_progress',
      'in_progress',
    )
    assert(detail.data?.data?.startedAt, 'startedAt set')
  })

  r.api('FT-INS-005', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const { id } = await bookInspection(dewi, teknisiId, 'ONLINE')

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    await teknisiAcceptAndStartInspection(budi, id)
    await teknisiSubmitInspectionReport(budi, id)

    const detail = await request(dewi, 'GET', `/api/user/inspeksi/${id}`)
    assertStatus(detail.status, 200, 'user sees report')
    assert(detail.data?.data?.report, 'report attached')
    assert(
      String(detail.data?.data?.status ?? '').toLowerCase() === 'report_ready',
      'report_ready',
    )
  })

  r.api('FT-INS-006', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const { id } = await bookInspection(dewi, teknisiId, 'ONLINE')

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    await teknisiAcceptAndStartInspection(budi, id)
    await teknisiSubmitInspectionReport(budi, id)

    const certBefore = await request(dewi, 'GET', `/api/user/inspeksi/${id}/certificate`)
    assert(certBefore.status === 200, `certificate before confirm ${certBefore.status}`)
    const contentType = certBefore.raw.headers.get('content-type') ?? ''
    assert(
      contentType.includes('pdf') ||
        (typeof certBefore.data === 'string' && certBefore.data.length > 200),
      `PDF certificate response type=${contentType}`,
    )

    const confirm = await request(dewi, 'POST', `/api/user/inspeksi/${id}/confirm`)
    assertStatus(confirm.status, 200, 'confirm report')
    assert(
      String(confirm.data?.data?.status ?? '').toLowerCase() === 'completed',
      'completed after confirm',
    )
  })

  r.api('FT-INS-101', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(
      dewi,
      'POST',
      '/api/user/inspeksi',
      inspectionPayload(teknisiId, 'OFFLINE', { location: '' }),
    )
    assert4xx(res.status, 'offline no location')
    assert(res.status === 400, `expected 400 got ${res.status}`)
  })

  r.api('FT-INS-102', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(
      dewi,
      'POST',
      '/api/user/inspeksi',
      inspectionPayload(teknisiId, 'ONLINE', {
        scheduledAt: new Date(Date.now() - 86_400_000).toISOString(),
      }),
    )
    assert4xx(res.status, 'past schedule')
    assert(
      String(res.data?.error ?? '').includes('masa depan'),
      `schedule error: ${res.data?.error}`,
    )
  })

  r.api('FT-INS-103', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(
      dewi,
      'POST',
      '/api/user/inspeksi',
      inspectionPayload(teknisiId, 'ONLINE', { category: 'MOBIL' }),
    )
    assert4xx(res.status, 'bad category')
    assert(res.status === 400, `expected 400 got ${res.status}`)
  })

  r.api('FT-INS-104', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const { id } = await bookInspection(dewi, teknisiId, 'ONLINE')

    const ahmad = makeJar()
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    await teknisiAcceptAndStartInspection(ahmad, id)

    const res = await request(ahmad, 'PATCH', `/api/teknisi/inspeksi/${id}`, {
      action: 'submit_report',
      report: { ...sampleInspectionReport(0), photoUrls: [] },
    })
    assert4xx(res.status, 'no photos')
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('foto') ||
        String(res.data?.error ?? '').includes('3'),
      `photo validation: ${res.data?.error}`,
    )

    const still = await request(ahmad, 'GET', `/api/teknisi/inspeksi/${id}`)
    assert(
      String(still.data?.data?.status ?? '').toLowerCase() === 'in_progress',
      'status unchanged after failed submit',
    )
  })

  r.api('FT-INS-201', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const res = await request(
      dewi,
      'POST',
      '/api/user/inspeksi',
      inspectionPayload('00000000-0000-0000-0000-000000000000', 'ONLINE'),
    )
    assert(res.status === 404, `expected 404 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('teknisi'),
      'teknisi unavailable message',
    )
  })

  r.api('FT-INS-901', async () => {
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const ahmadId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const { id } = await bookInspection(dewi, ahmadId, 'ONLINE')

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    const res = await request(budi, 'GET', `/api/teknisi/inspeksi/${id}`)
    assert(res.status === 403, `expected 403 got ${res.status}`)
  })
}
