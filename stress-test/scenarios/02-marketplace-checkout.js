/**
 * S2 — Marketplace Transaction E2E
 *
 * Test full transaction journey: login → browse → checkout.
 * Spec §5.2.
 *
 * Total durasi: ~8 menit
 * Stages: 0→5→15→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Counter, Trend } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import { thinkTimeShort } from '../lib/data.js'
import { checkoutThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '2m', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ...checkoutThresholds,
    successful_checkouts: ['count>10'],
  },
}

const successfulCheckouts = new Counter('successful_checkouts')
const transactionTime = new Trend('transaction_time', true)

export default function () {
  const user = pickStressUser(__VU)
  const start = Date.now()

  group('Login', () => {
    const jar = login(user.email, user.password)
    if (!jar) {
      console.error(`VU ${__VU}: login failed for ${user.email}`)
      return
    }
  })
  sleep(thinkTimeShort())

  let productId = null

  group('Browse products', () => {
    const res = http.get(`${BASE_URL}/api/marketplace/products?page=1`, {
      tags: { name: 'mp_products_list' },
    })
    if (check(res, { 'list 200': (r) => r.status === 200 })) {
      const body = res.json()
      // API returns { success: true, data: [...] } or { success: true, data: { items: [...] } }
      const data = body?.data
      const items = Array.isArray(data) ? data : (data?.items || [])
      if (items.length > 0) {
        productId = items[Math.floor(Math.random() * items.length)].id
      }
    }
  })

  if (!productId) {
    console.warn(`VU ${__VU}: no product found, skipping checkout`)
    return
  }

  sleep(thinkTimeShort())

  group('Product detail', () => {
    const res = http.get(`${BASE_URL}/api/marketplace/products/${productId}`, {
      tags: { name: 'mp_product_detail' },
    })
    check(res, { 'detail 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeShort())

  group('Checkout', () => {
    const payload = JSON.stringify({
      items: [{ productId, quantity: 1 }],
    })
    const res = http.post(`${BASE_URL}/api/marketplace/checkout`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'mp_checkout' },
    })
    const ok = check(res, {
      'checkout 200/201': (r) => r.status === 200 || r.status === 201,
    })
    if (ok) {
      successfulCheckouts.add(1)
    } else {
      console.error(
        `VU ${__VU}: checkout failed status=${res.status} body=${res.body?.slice(0, 200)}`,
      )
    }
  })

  transactionTime.add(Date.now() - start)
}
