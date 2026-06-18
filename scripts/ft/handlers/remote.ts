import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  assert4xx,
  assertStatus,
  getTeknisiId,
  login,
  makeJar,
  remoteRequestBody,
  request,
  requestRemoteSession,
} from '../lib'

export function registerRemoteHandlers(r: HandlerRegistry): void {
  r.api('FT-REM-001', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const session = await requestRemoteSession(siti, teknisiId)
    assert(session.status === 'waiting', `expected waiting got ${session.status}`)
  })

  r.api('FT-REM-002', async () => {
    const res = await request(null, 'GET', '/api/indodesk/downloads')
    assertStatus(res.status, 200, 'indodesk downloads')
    const downloads = res.data?.data?.downloads ?? []
    assert(Array.isArray(downloads) && downloads.length > 0, 'downloads list empty')
    const windows = downloads.find((d: { platform?: string }) => d.platform === 'windows')
    assert(windows?.downloadUrl, 'windows download url missing')
  })

  r.api('FT-REM-003', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await requestRemoteSession(siti, teknisiId)

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi1), 'login teknisi')
    const accept = await request(teknisi, 'PATCH', `/api/teknisi/remote/${id}`, {
      action: 'accept',
    })
    assertStatus(accept.status, 200, 'accept remote')
    assert(accept.data?.data?.status === 'active', 'status active after accept')
    assert(
      String(accept.data?.data?.statusLabel ?? '').toLowerCase().includes('aktif'),
      'status label Aktif',
    )
  })

  r.api('FT-REM-004', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await requestRemoteSession(siti, teknisiId)

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi2), 'login budi')
    await request(teknisi, 'PATCH', `/api/teknisi/remote/${id}`, { action: 'accept' })

    const complete = await request(teknisi, 'PATCH', `/api/teknisi/remote/${id}`, {
      action: 'complete',
    })
    assertStatus(complete.status, 200, 'complete remote')
    assert(complete.data?.data?.status === 'completed', 'status completed')
  })

  r.api('FT-REM-101', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(null, 'POST', '/api/remote', remoteRequestBody(teknisiId))
    assert4xx(res.status, 'guest remote')
    assert(res.status === 401, `expected 401 got ${res.status}`)
  })

  r.api('FT-REM-102', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(siti, 'POST', '/api/remote', {
      ...remoteRequestBody(teknisiId),
      remoteId: 'abc',
    })
    assert4xx(res.status, 'invalid remote id')
    assert(res.status === 400, `expected 400 got ${res.status}`)
  })

  r.api('FT-REM-103', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const res = await request(siti, 'POST', '/api/remote', {
      ...remoteRequestBody(teknisiId),
      description: '',
    })
    assert4xx(res.status, 'empty description')
    assert(res.status === 400, `expected 400 got ${res.status}`)
  })

  r.api('FT-REM-201', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await requestRemoteSession(siti, teknisiId)

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi1), 'login teknisi')
    const reject = await request(teknisi, 'PATCH', `/api/teknisi/remote/${id}`, {
      action: 'reject',
    })
    assertStatus(reject.status, 200, 'reject remote')
    assert(
      reject.data?.data?.status === 'rejected' || reject.data?.data?.status === 'cancelled',
      `rejected status got ${reject.data?.data?.status}`,
    )
  })

  r.api('FT-REM-901', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await requestRemoteSession(siti, teknisiId)

    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const getRes = await request(rudi, 'GET', `/api/user/remote/${id}`)
    assert(getRes.status === 403, `expected 403 got ${getRes.status}`)

    const patchRes = await request(rudi, 'PATCH', `/api/user/remote/${id}`, {
      action: 'cancel',
    })
    assert(patchRes.status === 403, `patch expected 403 got ${patchRes.status}`)
  })
}
