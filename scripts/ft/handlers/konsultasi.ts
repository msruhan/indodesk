import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  assert,
  assert4xx,
  assertStatus,
  bookKonsultasiSession,
  getConsultationBookBody,
  getTeknisiId,
  login,
  makeJar,
  request,
} from '../lib'

export function registerKonsultasiHandlers(r: HandlerRegistry): void {
  r.api('FT-KON-001', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const session = await bookKonsultasiSession(siti, teknisiId)
    assert(session.status === 'pending', `expected pending got ${session.status}`)
  })

  r.api('FT-KON-002', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const before = await request(siti, 'GET', '/api/wallet')
    assertStatus(before.status, 200, 'wallet before')
    const balanceBefore = Number(before.data?.data?.balance ?? 0)

    const session = await bookKonsultasiSession(siti, teknisiId, { forceNew: true })
    const after = await request(siti, 'GET', '/api/wallet')
    assertStatus(after.status, 200, 'wallet after')
    const balanceAfter = Number(after.data?.data?.balance ?? 0)
    assert(
      balanceBefore - balanceAfter === session.amount,
      `debit expected ${session.amount} got ${balanceBefore - balanceAfter}`,
    )
  })

  r.api('FT-KON-003', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await bookKonsultasiSession(siti, teknisiId)

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi1), 'login teknisi')
    const start = await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, {
      action: 'start',
    })
    assertStatus(start.status, 200, 'start konsultasi')
    assert(start.data?.data?.status === 'active', 'status active')
  })

  r.api('FT-KON-004', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id, amount } = await bookKonsultasiSession(siti, teknisiId)

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi2), 'login teknisi')
    await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, { action: 'start' })

    const walletBefore = await request(teknisi, 'GET', '/api/wallet')
    assertStatus(walletBefore.status, 200, 'teknisi wallet before')
    const teknisiBalBefore = Number(walletBefore.data?.data?.balance ?? 0)

    const complete = await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, {
      action: 'complete',
    })
    assertStatus(complete.status, 200, 'complete')
    assert(complete.data?.data?.status === 'completed', 'completed status')

    const walletAfter = await request(teknisi, 'GET', '/api/wallet')
    const teknisiBalAfter = Number(walletAfter.data?.data?.balance ?? 0)
    assert(
      teknisiBalAfter - teknisiBalBefore === amount,
      `teknisi earning ${amount} expected got ${teknisiBalAfter - teknisiBalBefore}`,
    )
  })

  r.api('FT-KON-005', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await bookKonsultasiSession(siti, teknisiId, { forceNew: true })

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi2), 'login teknisi')
    await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, { action: 'start' })
    await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, { action: 'complete' })

    const rate = await request(siti, 'PATCH', `/api/user/konsultasi/${id}`, {
      action: 'rate',
      rating: 5,
      review: 'Diagnosisnya jelas, unlock berhasil cepat.',
    })
    assertStatus(rate.status, 200, 'rate')
    assert(rate.data?.data?.rating === 5, 'rating saved')
    assert(rate.data?.data?.review?.includes('unlock'), 'review saved')
  })

  r.api('FT-KON-101', async () => {
    const body = await getConsultationBookBody(await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1))
    const res = await request(null, 'POST', '/api/user/konsultasi', body)
    assert4xx(res.status, 'guest book')
    assert(res.status === 401, 'expected 401')
  })

  r.api('FT-KON-102', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login')
    const res = await request(jar, 'POST', '/api/user/konsultasi', {
      teknisiId: '00000000-0000-0000-0000-000000000000',
      service: 'Konsultasi Unlock',
      price: 50_000,
    })
    assert(res.status === 404, `expected 404 got ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('tidak ditemukan'),
      'teknisi not found message',
    )
  })

  r.api('FT-KON-103', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const dewi = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    const list = await request(dewi, 'GET', '/api/user/konsultasi')
    for (const row of list.data?.data ?? []) {
      if (row.status === 'pending' || row.status === 'active') {
        await request(dewi, 'PATCH', `/api/user/konsultasi/${row.id}`, { action: 'cancel' })
      }
    }
    await adminSetWalletBalance(ACCOUNTS.seedUser3, 10_000)
    const body = await getConsultationBookBody(teknisiId)
    assert(body.price > 10_000, `service price ${body.price} must exceed test balance`)
    const res = await request(dewi, 'POST', '/api/user/konsultasi', body)
    assert(res.status === 402 || res.status === 400, `insufficient ${res.status}`)
    assert(
      String(res.data?.error ?? '').toLowerCase().includes('saldo') ||
        String(res.data?.error ?? '').toLowerCase().includes('cukup'),
      `insufficient message: ${res.data?.error}`,
    )
    await adminSetWalletBalance(ACCOUNTS.seedUser3, 500_000)
  })

  r.api('FT-KON-201', async () => {
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id, amount } = await bookKonsultasiSession(siti, teknisiId, { forceNew: true })

    const teknisi = makeJar()
    assert(await login(teknisi, ACCOUNTS.seedTeknisi2), 'login teknisi')
    await request(teknisi, 'PATCH', `/api/teknisi/konsultasi/${id}`, { action: 'start' })

    const walletAfterPay = await request(siti, 'GET', '/api/wallet')
    const balAfterPay = Number(walletAfterPay.data?.data?.balance ?? 0)

    const cancel = await request(siti, 'PATCH', `/api/user/konsultasi/${id}`, {
      action: 'cancel',
    })
    assertStatus(cancel.status, 200, 'cancel active')
    assert(cancel.data?.data?.status === 'cancelled', 'cancelled')

    const walletAfterRefund = await request(siti, 'GET', '/api/wallet')
    const balAfterRefund = Number(walletAfterRefund.data?.data?.balance ?? 0)
    assert(
      balAfterRefund - balAfterPay === amount,
      `refund expected +${amount} got +${balAfterRefund - balAfterPay}`,
    )
  })

  r.api('FT-KON-901', async () => {
    const ahmadId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const budiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi2)

    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const { id } = await bookKonsultasiSession(siti, ahmadId)

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    const start = await request(budi, 'PATCH', `/api/teknisi/konsultasi/${id}`, {
      action: 'start',
    })
    assert(start.status === 403, `expected 403 got ${start.status}`)
    assert(budiId !== ahmadId, 'seed teknisi berbeda')
  })
}
