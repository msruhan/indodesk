/**
 * S1 — Public Discovery
 *
 * Test halaman publik (visitor pertama). Read-heavy, cache-friendly.
 * Spec §5.1.
 *
 * Total durasi: ~7 menit
 * Stages: 0→10→30→50→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { BASE_URL } from '../lib/auth.js'
import { randomSearchQuery, randomCategory, randomPage, thinkTimeNormal } from '../lib/data.js'
import { baseThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: baseThresholds,
}

export default function () {
  group('Landing page', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { name: 'landing' } })
    check(res, { 'landing 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse marketplace', () => {
    const cat = randomCategory()
    const page = randomPage()
    const res = http.get(
      `${BASE_URL}/api/marketplace/products?category=${cat}&page=${page}`,
      { tags: { name: 'marketplace_list' } },
    )
    check(res, { 'marketplace 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse teknisi', () => {
    const res = http.get(`${BASE_URL}/api/teknisi?page=${randomPage()}`, {
      tags: { name: 'teknisi_list' },
    })
    check(res, { 'teknisi 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Browse stores', () => {
    const res = http.get(`${BASE_URL}/api/stores?page=${randomPage()}`, {
      tags: { name: 'stores_list' },
    })
    check(res, { 'stores 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Search', () => {
    const q = randomSearchQuery()
    const res = http.get(`${BASE_URL}/api/search?q=${q}`, {
      tags: { name: 'search' },
    })
    check(res, { 'search 200': (r) => r.status === 200 })
  })
  sleep(thinkTimeNormal())

  group('Banners', () => {
    const res = http.get(`${BASE_URL}/api/banners`, { tags: { name: 'banners' } })
    check(res, { 'banners 200': (r) => r.status === 200 })
  })
}
