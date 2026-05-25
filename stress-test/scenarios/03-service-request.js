/**
 * S3 — Service Request
 *
 * Test request konsultasi/remote/inspeksi + Telegram notif (mocked).
 * Spec §5.3.
 *
 * Total durasi: ~6 menit
 * Distribusi: 50% remote, 30% konsultasi, 20% inspeksi
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Counter } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import { thinkTimeShort } from '../lib/data.js'
import { apiThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '2m', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: apiThresholds,
}

const requestsRemote = new Counter('requests_remote')
const requestsKonsultasi = new Counter('requests_konsultasi')
const requestsInspeksi = new Counter('requests_inspeksi')

function pickServiceType() {
  const r = Math.random()
  if (r < 0.5) return 'remote'
  if (r < 0.8) return 'konsultasi'
  return 'inspeksi'
}

export default function () {
  const user = pickStressUser(__VU)

  group('Login', () => {
    const jar = login(user.email, user.password)
    if (!jar) return
  })
  sleep(thinkTimeShort())

  let teknisiId = null
  group('Get teknisi list', () => {
    const res = http.get(`${BASE_URL}/api/teknisi`, { tags: { name: 'teknisi_pick' } })
    if (res.status === 200) {
      const body = res.json()
      const items = body?.data?.items || body?.data || []
      if (Array.isArray(items) && items.length > 0) {
        teknisiId = items[Math.floor(Math.random() * items.length)].id
      }
    }
  })

  if (!teknisiId) {
    console.warn(`VU ${__VU}: no teknisi found`)
    return
  }

  sleep(thinkTimeShort())

  const serviceType = pickServiceType()

  group(`Request ${serviceType}`, () => {
    let url = ''
    let payload = ''

    if (serviceType === 'remote') {
      url = `${BASE_URL}/api/remote`
      payload = JSON.stringify({
        teknisiId,
        remoteId: `STRESS-${__VU}-${Date.now()}`,
        otp: '1234',
        platform: 'Windows 11',
        description: 'Stress test remote request',
      })
      requestsRemote.add(1)
    } else if (serviceType === 'konsultasi') {
      url = `${BASE_URL}/api/user/konsultasi`
      payload = JSON.stringify({
        teknisiId,
        service: 'Konsultasi Stress Test',
        description: 'Stress test konsultasi',
      })
      requestsKonsultasi.add(1)
    } else {
      url = `${BASE_URL}/api/user/inspeksi`
      payload = JSON.stringify({
        teknisiId,
        productName: 'iPhone 13 Pro',
        mode: 'ONLINE',
        description: 'Stress test inspeksi',
      })
      requestsInspeksi.add(1)
    }

    const res = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: `${serviceType}_request` },
    })

    check(res, {
      [`${serviceType} 200/201`]: (r) => r.status === 200 || r.status === 201,
    })

    if (res.status >= 400) {
      console.error(
        `VU ${__VU}: ${serviceType} failed status=${res.status} body=${res.body?.slice(0, 200)}`,
      )
    }
  })
}
