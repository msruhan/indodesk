import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  assert4xx,
  assertStatus,
  findBuyerMarketplaceOrderId,
  getStressProduct,
  login,
  makeJar,
  request,
  skip,
} from '../lib'

const SEED_ORDER_CODE = 'ORD-2026-000001'

export function registerMarketplaceHandlers(r: HandlerRegistry): void {
  r.api('FT-MKT-001', async () => {
    const res = await request(null, 'GET', '/api/marketplace/products?limit=5')
    assertStatus(res.status, 200, 'products')
    assert(res.data?.success === true, 'not success')
    assert(Array.isArray(res.data?.data) && res.data.data.length > 0, 'empty list')
  })

  r.skip('FT-MKT-002', 'Cart disimpan di client (localStorage) — tidak ada API cart')

  r.api('FT-MKT-003', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login')
    const product = await getStressProduct(jar)
    const checkout = await request(jar, 'POST', '/api/marketplace/checkout', {
      items: [{ productId: product.id, quantity: 1 }],
    })
    assert(checkout.status === 200 || checkout.status === 201, `checkout ${checkout.status}`)
    assert(checkout.data?.success === true, JSON.stringify(checkout.data))
  })

  r.skip('FT-MKT-004', 'Input resi TEKNISI memerlukan order PAID milik teknisi — setup order terpisah')

  r.skip('FT-MKT-005', 'Tracking otomatis memerlukan polling worker BinderByte (900s)')

  r.skip('FT-MKT-006', 'Konfirmasi penerimaan memerlukan order state SHIPPED')

  r.skip('FT-MKT-007', 'Review produk memerlukan order COMPLETED')

  r.api('FT-MKT-008', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login')
    const orders = await request(jar, 'GET', '/api/user/marketplace/orders')
    assertStatus(orders.status, 200, 'orders')
    const order = (orders.data?.data ?? orders.data ?? [])[0]
    if (!order?.id) skip('Belum ada order marketplace untuk user stress')
    const tracking = await request(jar, 'GET', `/api/user/marketplace/orders/${order.id}/tracking`)
    assertStatus(tracking.status, [200, 404], 'order tracking timeline')
  })

  r.skip('FT-MKT-101', 'Stok 0 memerlukan produk khusus di DB')

  r.skip('FT-MKT-102', 'Saldo kurang memerlukan user dengan saldo rendah')

  r.api('FT-MKT-103', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login')
    const res = await request(jar, 'POST', '/api/marketplace/checkout', { items: [] })
    assert4xx(res.status, 'empty items')
  })

  r.skip('FT-MKT-104', 'Validasi alamat pengiriman — perlu payload checkout lengkap')

  r.skip('FT-MKT-105', 'Listing PENDING memerlukan produk seed khusus')

  r.skip('FT-MKT-201', 'Concurrent checkout memerlukan race condition setup')

  r.skip('FT-MKT-202', 'Tracking invalid memerlukan order TEKNISI aktif')

  r.api('FT-MKT-901', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login')
    const res = await request(jar, 'GET', '/api/teknisi/marketplace/orders')
    assert4xx(res.status, 'user on teknisi orders')
  })

  r.api('FT-MKT-902', async () => {
    const siti = makeJar()
    assert(await login(siti, ACCOUNTS.seedUser1), 'login siti')
    const orderId = await findBuyerMarketplaceOrderId(siti, SEED_ORDER_CODE)

    const budi = makeJar()
    assert(await login(budi, ACCOUNTS.seedTeknisi2), 'login budi')
    const res = await request(budi, 'PATCH', `/api/teknisi/marketplace/orders/${orderId}`, {
      action: 'advance',
    })
    assert4xx(res.status, 'teknisi on foreign order')
    assert(res.status === 404, `expected 404, got ${res.status}`)
  })
}
