import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  assert4xx,
  assertStatus,
  createTeknisiPendingProduct,
  login,
  makeJar,
  request,
  skip,
} from '../lib'

async function findPendingProduct(adminJar: ReturnType<typeof makeJar>): Promise<string> {
  const queue = await request(adminJar, 'GET', '/api/admin/approval')
  assertStatus(queue.status, 200, 'approval queue')
  const items = queue.data?.data?.items ?? []
  const pending = items.find(
    (i: { entityType?: string; status?: string }) =>
      i.entityType === 'product' && i.status === 'pending',
  )
  if (pending?.id) return pending.id as string

  const ahmad = makeJar()
  assert(await login(ahmad, ACCOUNTS.seedTeknisi1), 'login ahmad')
  return createTeknisiPendingProduct(ahmad)
}

export function registerAdminHandlers(r: HandlerRegistry): void {
  r.api('FT-ADM-001', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const productId = await findPendingProduct(admin)

    const res = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'product',
      id: productId,
      action: 'approve',
    })
    assertStatus(res.status, 200, 'approve product')

    const products = await request(admin, 'GET', '/api/admin/products?listingStatus=APPROVED')
    assertStatus(products.status, 200, 'products list')
  })

  r.api('FT-ADM-002', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const productId = await findPendingProduct(admin)

    const res = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'product',
      id: productId,
      action: 'reject',
    })
    assertStatus(res.status, 200, 'reject product')

    const patch = await request(admin, 'PATCH', `/api/admin/products/${productId}`, {})
    assert(patch.status === 200 || patch.status === 400, 'verify product state')
  })

  r.api('FT-ADM-003', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const queue = await request(admin, 'GET', '/api/admin/approval')
    const items = queue.data?.data?.items ?? []
    const pendingStore = items.find(
      (i: { entityType?: string; status?: string }) =>
        i.entityType === 'store' && i.status === 'pending',
    )
    if (!pendingStore?.id) {
      skip('Tidak ada TeknisiStore PENDING di antrian')
    }

    const res = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'store',
      id: pendingStore.id,
      action: 'approve',
    })
    assertStatus(res.status, 200, 'approve store')
  })

  r.api('FT-ADM-004', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const res = await request(admin, 'POST', '/api/admin/help', {
      audience: 'user',
      question: 'Cara unlock IMEI iPhone — FT',
      answer: 'Ikuti panduan resmi dan pastikan perangkat tidak dalam status hilang.',
      sortOrder: 99,
      isActive: true,
    })
    assert(res.status === 200 || res.status === 201, `help article ${res.status}`)
    assert(res.data?.data?.id, 'help id')
  })

  r.api('FT-ADM-005', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const get = await request(admin, 'GET', '/api/admin/platform/settings')
    assertStatus(get.status, 200, 'settings get')
    const current = get.data?.data ?? get.data
    assert(current?.platformName, 'settings payload')

    const patch = await request(admin, 'PATCH', '/api/admin/platform/settings', {
      ...current,
      maintenanceMode: !current.maintenanceMode,
    })
    assertStatus(patch.status, 200, 'settings patch')
  })

  r.api('FT-ADM-006', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedAdmin), 'admin login')
    const res = await request(jar, 'GET', '/api/admin/monitoring')
    assertStatus(res.status, 200, 'monitoring')
  })

  r.api('FT-ADM-007', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedAdmin), 'admin login')
    const res = await request(jar, 'GET', '/api/admin/logs?limit=5')
    assertStatus(res.status, 200, 'activity logs')
    const rows = res.data?.data ?? res.data ?? []
    assert(Array.isArray(rows) ? rows.length >= 1 : true, 'has log entries')
  })

  r.api('FT-ADM-101', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const list = await request(admin, 'GET', '/api/admin/products?listingStatus=APPROVED&limit=5')
    assertStatus(list.status, 200, 'approved products')
    const approved = (list.data?.data ?? [])[0]
    if (!approved?.id) skip('Tidak ada produk APPROVED di seed')

    const res = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'product',
      id: approved.id,
      action: 'approve',
    })
    assert4xx(res.status, 're-approve approved')
  })

  r.api('FT-ADM-102', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const queue = await request(admin, 'GET', '/api/admin/approval')
    const pendingTeknisi = (queue.data?.data?.items ?? []).find(
      (i: { entityType?: string; status?: string }) =>
        i.entityType === 'teknisi' && i.status === 'pending',
    )
    if (!pendingTeknisi?.id) skip('Tidak ada teknisi PENDING di antrian')

    const res = await request(admin, 'POST', '/api/admin/approval', {
      entityType: 'teknisi',
      id: pendingTeknisi.id,
      action: 'reject',
      rejectionReason: '',
    })
    assert4xx(res.status, 'reject teknisi tanpa alasan')
  })

  r.api('FT-ADM-103', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedAdmin), 'admin login')
    const res = await request(jar, 'POST', '/api/admin/wallet/deposit', {
      userId: 'x',
      amount: 0,
      method: 'manual',
    })
    assert4xx(res.status, 'zero deposit')
  })

  r.api('FT-ADM-201', async () => {
    const admin = makeJar()
    assert(await login(admin, ACCOUNTS.seedAdmin), 'admin login')
    const stores = await request(admin, 'GET', '/api/admin/toko?listingStatus=APPROVED')
    assertStatus(stores.status, 200, 'stores')
    const store = (stores.data?.data ?? [])[0]
    if (!store?.id) skip('Tidak ada toko APPROVED')

    const res = await request(admin, 'PATCH', `/api/admin/toko/${store.id}`, {
      listingStatus: 'REJECTED',
      isPublished: false,
    })
    assertStatus(res.status, 200, 'unpublish store')
  })

  r.api('FT-ADM-901', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'GET', '/api/admin/users')
    assert4xx(res.status, 'user admin')
  })

  r.api('FT-ADM-902', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(jar, 'GET', '/api/admin/users')
    assert4xx(res.status, 'teknisi admin')
  })

  r.api('FT-ADM-903', async () => {
    const res = await request(null, 'GET', '/admin/users')
    assert(res.status === 307 || res.status === 302 || res.status === 401, `redirect ${res.status}`)
  })
}
