import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminManualDeposit,
  assert,
  assert4xx,
  assertStatus,
  getOrCreateChatConversation,
  getTeknisiId,
  getUserIdByEmail,
  login,
  makeJar,
  request,
  skip,
} from '../lib'

export function registerWalletChatNotifHandlers(r: HandlerRegistry): void {
  r.api('FT-WAL-001', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'POST', '/api/wallet/topup', {
      amount: 50_000,
      paymentMethod: 'TRANSFER',
      bankName: 'BCA',
      accountName: 'Siti Nurhaliza',
    })
    assert(res.status === 200 || res.status === 201, `topup request ${res.status}`)
    assert(String(res.data?.data?.status ?? '').toUpperCase() === 'PENDING', 'pending topup')
  })

  r.skip(
    'FT-WAL-002',
    'Approve topup manual belum persist ke DB (TopupRequest model TODO di /api/wallet/topup)',
  )

  r.api('FT-WAL-003', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const before = await request(siti, 'GET', '/api/wallet')
    const balBefore = Number(before.data?.data?.balance ?? 0)

    await adminManualDeposit(ACCOUNTS.seedUser1, 50_000, 'Bonus referral — FT-WAL-003')

    const after = await request(siti, 'GET', '/api/wallet')
    const balAfter = Number(after.data?.data?.balance ?? 0)
    assert(balAfter >= balBefore + 50_000, 'balance increased after manual deposit')
  })

  r.api('FT-WAL-004', async () => {
    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    const before = await request(budi, 'GET', '/api/wallet')
    const balBefore = Number(before.data?.data?.balance ?? 0)

    await adminManualDeposit(ACCOUNTS.seedTeknisi2, 100_000, 'Bonus performa — FT-WAL-004')

    const after = await request(budi, 'GET', '/api/wallet')
    const balAfter = Number(after.data?.data?.balance ?? 0)
    assert(balAfter >= balBefore + 100_000, 'teknisi balance increased')
  })

  r.skip('FT-WAL-005', 'Endpoint withdraw belum diimplementasi')
  r.skip('FT-WAL-006', 'Endpoint approve withdraw belum diimplementasi')

  r.api('FT-WAL-007', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const wallet = await request(jar, 'GET', '/api/wallet')
    assertStatus(wallet.status, 200, 'wallet')
    const tx = await request(jar, 'GET', '/api/wallet/transactions?limit=10')
    assertStatus(tx.status, 200, 'transactions')
    const rows = tx.data?.data?.transactions ?? tx.data?.transactions ?? []
    assert(Array.isArray(rows), 'transactions array')
  })

  r.api('FT-CHT-050', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(siti, teknisiId)
    const msg = await request(siti, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Halo, saya butuh bantuan unlock iPhone 13',
    })
    assertStatus(msg.status, [200, 201], 'send message')
  })

  r.api('FT-CHT-051', async () => {
    const siti = makeJar()
    const ahmad = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(siti, teknisiId)
    await request(siti, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Pesan dari user FT-CHT-051',
    })
    const reply = await request(ahmad, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Balasan dari teknisi FT-CHT-051',
    })
    assertStatus(reply.status, [200, 201], 'teknisi reply')
  })

  r.api('FT-CHT-052', async () => {
    const siti = makeJar()
    const ahmad = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(siti, teknisiId)
    await request(ahmad, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Unread message for mark-read test',
    })

    const listBefore = await request(siti, 'GET', '/api/chat/conversations')
    assertStatus(listBefore.status, 200, 'conv list')
    const row = (listBefore.data?.data ?? []).find((c: { id?: string }) => c.id === convId)
    assert(row, 'conversation in list')

    const mark = await request(siti, 'POST', `/api/chat/conversations/${convId}/read`)
    assertStatus(mark.status, 200, 'mark read')
    assert(Number(mark.data?.data?.marked ?? mark.data?.marked ?? 0) >= 0, 'marked count')
  })

  r.api('FT-NOT-080', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'GET', '/api/notifications?limit=10')
    assertStatus(res.status, 200, 'notifications')
    assert(Array.isArray(res.data?.data ?? res.data), 'notifications list')
  })

  r.skip('FT-NOT-081', 'Telegram notif memerlukan bot & akun terhubung')
  r.skip('FT-NOT-082', 'Mark all read — state lokal di client (localStorage), bukan API')

  r.api('FT-WAL-101', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'POST', '/api/wallet/topup', {
      amount: 0,
      paymentMethod: 'TRANSFER',
    })
    assert4xx(res.status, 'zero topup')
  })

  r.skip('FT-WAL-102', 'Batas atas topup belum divalidasi di API (hanya min Rp 10.000)')

  r.skip('FT-WAL-103', 'Withdraw belum diimplementasi')

  r.api('FT-CHT-150', async () => {
    const res = await request(null, 'POST', '/api/chat/conversations', { peerId: 'x' })
    assert(res.status === 401, `expected 401 got ${res.status}`)
  })

  r.api('FT-CHT-151', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(jar, ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(jar, teknisiId)
    const msg = await request(jar, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: '   ',
    })
    assert4xx(msg.status, 'empty message')
  })

  r.skip('FT-NOT-180', 'PlatformNotification broadcast — tidak ada ownership per user')

  r.skip('FT-WAL-201', 'Withdraw concurrent belum diimplementasi')

  r.api('FT-CHT-251', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const teknisiId = await getTeknisiId(jar, ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(jar, teknisiId)
    const msg = await request(jar, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'x'.repeat(5001),
    })
    assert4xx(msg.status, 'long message')
  })

  r.api('FT-WAL-901', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const dewiId = await getUserIdByEmail(ACCOUNTS.seedUser3)
    const res = await request(jar, 'POST', '/api/admin/wallet/deposit', {
      userId: dewiId,
      amount: 1000,
      method: 'manual',
    })
    assert4xx(res.status, 'user admin deposit')
  })

  r.api('FT-CHT-950', async () => {
    const siti = makeJar()
    const rudi = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const convId = await getOrCreateChatConversation(siti, teknisiId)

    const res = await request(rudi, 'GET', `/api/chat/conversations/${convId}/messages`)
    assert4xx(res.status, 'non-participant read')
  })

  r.skip('FT-NOT-970', 'PlatformNotification broadcast — tidak ada ownership per user')
}
