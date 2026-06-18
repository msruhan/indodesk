import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  assert4xx,
  assertStatus,
  createTeknisiPendingProduct,
  login,
  makeJar,
  productCreateBody,
  request,
  storeActivatePayload,
} from '../lib'

export function registerStoreHandlers(r: HandlerRegistry): void {
  r.api('FT-STR-001', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi2), 'login budi')

    const res = await request(jar, 'POST', '/api/teknisi/toko', storeActivatePayload())
    if (res.status === 400 && String(res.data?.error ?? '').includes('sudah memiliki')) {
      const existing = await request(jar, 'GET', '/api/teknisi/toko')
      assertStatus(existing.status, 200, 'existing store')
      return
    }
    assert(res.status === 200 || res.status === 201, `activate store ${res.status}`)
    const status = String(res.data?.data?.listingStatus ?? '').toUpperCase()
    assert(status === 'PENDING' || status === 'DRAFT', `listing status ${status}`)
  })

  r.skip('FT-STR-002', 'Upload cover/avatar memerlukan multipart file')

  r.api('FT-STR-003', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(jar, 'POST', '/api/teknisi/portfolio', {
      title: 'Battery health restore',
      meta: 'iPhone 13 · 60 menit',
      result: 'Health 100%, charging cycle reset',
      imageUrl: '/uploads/teknisi-portfolio/ft-case.jpg',
      icon: 'smartphone',
    })
    assert(res.status === 200 || res.status === 201, `portfolio ${res.status}`)
    assert(res.data?.data?.id, 'portfolio id')
  })

  r.skip('FT-STR-004', 'Gallery update memerlukan multipart upload')

  r.api('FT-STR-005', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(jar, 'PATCH', '/api/teknisi/toko', {
      journeyIntro: 'Perjalanan layanan sejak 2020',
      journeyJson: JSON.stringify([
        { year: '2026', title: 'Ekspansi Jakarta Selatan', description: 'FT milestone' },
      ]),
    })
    assertStatus(res.status, 200, 'journey update')
  })

  r.api('FT-STR-006', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const hours = {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '10:00', close: '18:00', closed: false },
      sunday: { closed: true },
    }
    const res = await request(jar, 'PATCH', '/api/teknisi/toko', {
      operatingHoursJson: JSON.stringify(hours),
      jamWeekdays: '09:00 - 21:00',
      jamWeekend: '10:00 - 18:00',
    })
    assertStatus(res.status, 200, 'operating hours')
  })

  r.api('FT-STR-007', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const productId = await createTeknisiPendingProduct(jar)
    const detail = await request(jar, 'GET', '/api/teknisi/products')
    assertStatus(detail.status, 200, 'products list')
    const row = (detail.data?.data ?? []).find((p: { id?: string }) => p.id === productId)
    assert(row, 'product in list')
    assert(
      String(row.listingStatus ?? '').toUpperCase() === 'PENDING',
      'pending listing',
    )
  })

  r.api('FT-STR-101', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi2), 'login budi')
    const res = await request(jar, 'POST', '/api/teknisi/toko', {
      name: '',
      city: '',
      address: '',
    })
    assert4xx(res.status, 'empty store fields')
  })

  r.api('FT-STR-102', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const res = await request(jar, 'POST', '/api/teknisi/products', {
      name: 'Bad price product',
      category: 'HANDPHONE',
      price: 0,
      description: 'x',
      stock: 1,
    })
    assert4xx(res.status, 'zero price')
  })

  r.skip('FT-STR-103', 'Upload cover > 5MB memerlukan multipart file')

  r.api('FT-STR-201', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedTeknisi1), 'login ahmad')
    const productId = await createTeknisiPendingProduct(jar)
    const patch = await request(jar, 'PATCH', `/api/teknisi/products/${productId}`, {
      price: 150_000,
    })
    assertStatus(patch.status, 200, 'edit pending product')
    const row = patch.data?.data
    assert(
      String(row?.listingStatus ?? '').toUpperCase() === 'PENDING',
      'still pending after edit',
    )
  })

  r.api('FT-STR-901', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.seedUser1), 'login siti')
    const res = await request(jar, 'GET', '/api/teknisi/toko')
    assert4xx(res.status, 'user on teknisi store')
  })
}
