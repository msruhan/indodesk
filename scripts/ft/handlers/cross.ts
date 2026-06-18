import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  adminSetWalletBalance,
  adminTopupUser,
  assert,
  assert4xx,
  assertForbidden,
  assertLoginRedirect,
  assertRedirect,
  assertStatus,
  bookKonsultasiSession,
  createInspectionOrder,
  createRekberAndFund,
  createTeknisiPendingProduct,
  findBuyerMarketplaceOrderId,
  findAndPrepareSeedIphoneProduct,
  findPublishedProduct,
  getOrCreateChatConversation,
  getTeknisiId,
  getUserIdByEmail,
  inspectionPayload,
  login,
  makeJar,
  marketplaceCheckoutProduct,
  request,
  storeActivatePayload,
  teknisiAcceptAndStartInspection,
  teknisiSubmitInspectionReport,
} from '../lib'

const SEED_ORDER_CODE = 'ORD-2026-000001'

export function registerCrossHandlers(r: HandlerRegistry): void {
  r.api('FT-CROSS-001', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 9_000_000)

    const siti = makeJar()
    const ahmad = makeJar()
    const admin = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    assert(await login(admin, ACCOUNTS.seedAdmin), 'login admin')

    const product = await findAndPrepareSeedIphoneProduct()
    const walletBefore = Number((await request(siti, 'GET', '/api/wallet')).data?.data?.balance ?? 0)

    const { orderId, orderCode } = await marketplaceCheckoutProduct(siti, product.id)
    assert(orderCode.length > 0, 'order code')

    const walletAfter = Number((await request(siti, 'GET', '/api/wallet')).data?.data?.balance ?? 0)
    assert(walletBefore - walletAfter >= product.price, 'wallet debited')

    const advance = await request(ahmad, 'PATCH', `/api/teknisi/marketplace/orders/${orderId}`, {
      action: 'advance',
    })
    assertStatus(advance.status, 200, 'advance to processing')

    const ship = await request(ahmad, 'PATCH', `/api/teknisi/marketplace/orders/${orderId}`, {
      action: 'set_shipment',
      courier: 'JNE',
      trackingNumber: 'JNE5550001111',
    })
    assertStatus(ship.status, 200, 'set shipment')

    const adminDash = await request(admin, 'GET', '/api/admin/dashboard')
    assertStatus(adminDash.status, 200, 'admin dashboard')

    const confirm = await request(siti, 'POST', `/api/user/marketplace/orders/${orderId}/confirm`)
    assertStatus(confirm.status, 200, 'confirm receipt')
    assert(
      String(confirm.data?.data?.status ?? '').toLowerCase() === 'completed',
      'order completed',
    )

    const review = await request(siti, 'POST', `/api/marketplace/products/${product.id}/reviews`, {
      orderId,
      rating: 5,
      comment: 'Produk sesuai deskripsi, pengiriman cepat — FT-CROSS-001',
    })
    assertStatus(review.status, [200, 201], 'product review')
  })

  r.api('FT-CROSS-002', async () => {
    await adminTopupUser(ACCOUNTS.seedUser2, 6_000_000)

    const rudi = makeJar()
    const budi = makeJar()
    const admin = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    assert(await login(admin, ACCOUNTS.seedAdmin), 'login admin')

    const sellerId = await getUserIdByEmail(ACCOUNTS.seedTeknisi2)
    const { id } = await createRekberAndFund(rudi, {
      sellerId,
      amount: 5_000_000,
      description: 'Pembelian unit demo — FT-CROSS-002',
    })

    const dispute = await request(rudi, 'PATCH', `/api/rekber/${id}`, {
      action: 'dispute',
      note: 'Layanan tidak sesuai deskripsi.',
    })
    assertStatus(dispute.status, 200, 'dispute')
    assert(dispute.data?.data?.status === 'disputed', 'disputed')

    const refund = await request(admin, 'POST', `/api/admin/rekber/${id}/resolve`, {
      action: 'refund',
      note: 'Functional test refund buyer',
    })
    assertStatus(refund.status, 200, 'admin refund')
    assert(refund.data?.data?.status === 'refunded', 'refunded')
  })

  r.api('FT-CROSS-003', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser3, 2_000_000)

    const dewi = makeJar()
    const ahmad = makeJar()
    assert(await login(dewi, ACCOUNTS.seedUser3), 'login dewi')
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')

    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const { id } = await createInspectionOrder(
      dewi,
      inspectionPayload(teknisiId, 'OFFLINE', {
        productName: 'iPhone 14 Pro — FT-CROSS-003',
        location: 'Jl. Diponegoro No. 12, Jakarta',
        city: 'Jakarta',
      }),
    )

    await teknisiAcceptAndStartInspection(ahmad, id)
    await teknisiSubmitInspectionReport(ahmad, id)

    const cert = await request(dewi, 'GET', `/api/user/inspeksi/${id}/certificate`)
    assert(cert.status === 200, `certificate ${cert.status}`)

    const confirm = await request(dewi, 'POST', `/api/user/inspeksi/${id}/confirm`)
    assertStatus(confirm.status, 200, 'confirm inspection')
    assert(
      String(confirm.data?.data?.status ?? '').toLowerCase() === 'completed',
      'completed',
    )
  })

  r.api('FT-CROSS-004', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 500_000)

    const siti = makeJar()
    const ahmad = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')

    const teknisiId = await getTeknisiId(makeJar(), ACCOUNTS.seedTeknisi1)
    const { id, amount } = await bookKonsultasiSession(siti, teknisiId, { forceNew: true })

    await request(ahmad, 'PATCH', `/api/teknisi/konsultasi/${id}`, { action: 'start' })

    const teknisiIdForChat = teknisiId
    const convId = await getOrCreateChatConversation(siti, teknisiIdForChat)
    await request(siti, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Halo teknisi, butuh bantuan unlock — FT-CROSS-004',
    })
    await request(ahmad, 'POST', `/api/chat/conversations/${convId}/messages`, {
      body: 'Siap, kita mulai sesi konsultasi.',
    })

    const complete = await request(ahmad, 'PATCH', `/api/teknisi/konsultasi/${id}`, {
      action: 'complete',
    })
    assertStatus(complete.status, 200, 'complete session')
    assert(complete.data?.data?.status === 'completed', 'completed')

    const rate = await request(siti, 'PATCH', `/api/user/konsultasi/${id}`, {
      action: 'rate',
      rating: 5,
      review: 'Penjelasannya jelas dan sangat membantu.',
    })
    assertStatus(rate.status, 200, 'rate session')

    const wallet = await request(ahmad, 'GET', '/api/wallet')
    assertStatus(wallet.status, 200, 'teknisi wallet')
    assert(amount > 0, 'session amount')
  })

  r.api('FT-CROSS-005', async () => {
    await adminSetWalletBalance(ACCOUNTS.seedUser1, 9_000_000)

    const budi = makeJar()
    const admin = makeJar()
    const siti = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    assert(await login(admin, ACCOUNTS.seedAdmin), 'login admin')
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')

    const productName = `[FT-CROSS] OPPO Reno ${Date.now()}`
    const productId = await createTeknisiPendingProduct(budi, productName)

    const approve = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'product',
      id: productId,
      action: 'approve',
    })
    assertStatus(approve.status, 200, 'approve product')

    const browse = await request(null, 'GET', `/api/marketplace/products?limit=50&q=${encodeURIComponent('[FT-CROSS]')}`)
    assertStatus(browse.status, 200, 'public browse')
    const listed = (browse.data?.data ?? []).find((p: { id?: string }) => p.id === productId)
    assert(listed, 'product visible after approve')

    const checkout = await marketplaceCheckoutProduct(siti, productId)
    assert(
      checkout.status === 'paid' || checkout.status === 'processing',
      `checkout status ${checkout.status}`,
    )
  })

  r.api('FT-CROSS-901', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(siti, 'GET', '/api/admin/users')
    assertForbidden(res, 'user admin users')
  })

  r.api('FT-CROSS-902', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(siti, 'GET', '/admin/dashboard')
    assertRedirect(res, '/user/dashboard', 'user away from admin')
  })

  r.api('FT-CROSS-903', async () => {
    const ahmad = makeJar()
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(ahmad, 'POST', '/api/admin/approval', {
      entityType: 'product',
      id: '00000000-0000-0000-0000-000000000000',
      action: 'approve',
    })
    assertForbidden(res, 'teknisi approve product')
  })

  r.api('FT-CROSS-904', async () => {
    const ahmad = makeJar()
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(ahmad, 'GET', '/admin/users')
    assertRedirect(res, '/teknisi/dashboard', 'teknisi away from admin')
  })

  r.api('FT-CROSS-905', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(siti, 'PATCH', '/api/teknisi/toko', storeActivatePayload())
    assertForbidden(res, 'user patch teknisi store')
  })

  r.api('FT-CROSS-906', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const orderId = await findBuyerMarketplaceOrderId(siti, SEED_ORDER_CODE)
    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const res = await request(rudi, 'PATCH', `/api/teknisi/marketplace/orders/${orderId}`, {
      action: 'set_shipment',
      courier: 'JNE',
      trackingNumber: 'JNE9990000001',
    })
    assertForbidden(res, 'user ship as teknisi')
  })

  r.api('FT-CROSS-907', async () => {
    const res = await request(null, 'GET', '/user/orders')
    assertLoginRedirect(res, '/user/orders')
  })

  r.api('FT-CROSS-908', async () => {
    const res = await request(null, 'GET', '/teknisi/dashboard')
    assertLoginRedirect(res, '/teknisi/dashboard')
  })

  r.api('FT-CROSS-909', async () => {
    const res = await request(null, 'GET', '/admin/activity-log')
    assertLoginRedirect(res, '/admin/activity-log')
  })

  r.api('FT-CROSS-910', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const orderId = await findBuyerMarketplaceOrderId(siti, SEED_ORDER_CODE)

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    const res = await request(budi, 'PATCH', `/api/teknisi/marketplace/orders/${orderId}`, {
      action: 'set_shipment',
      courier: 'JNE',
      trackingNumber: 'JNE9990000002',
    })
    assert4xx(res.status, 'budi ship ahmad order')
    assert(res.status === 404, `expected 404, got ${res.status}`)
  })

  r.api('FT-CROSS-911', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const orderId = await findBuyerMarketplaceOrderId(siti, SEED_ORDER_CODE)

    const rudi = makeJar()
    assert(await login(rudi, ACCOUNTS.seedUser2), 'login rudi')
    const res = await request(rudi, 'GET', `/api/user/marketplace/orders/${orderId}/tracking`)
    assert4xx(res.status, 'rudi tracking siti order')
    assert(res.status === 404, `expected 404, got ${res.status}`)
  })

  r.api('FT-CROSS-912', async () => {
    const ahmad = makeJar()
    assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const targetId = await getUserIdByEmail(ACCOUNTS.seedUser2)
    const res = await request(ahmad, 'POST', '/api/admin/wallet/deposit', {
      userId: targetId,
      amount: 1000,
      method: 'manual',
      note: 'FT-CROSS-912 should fail',
    })
    assertForbidden(res, 'teknisi manual deposit')
  })
}
