/**
 * S4 — Real-time Polling
 *
 * Simulate teknisi login + polling notification/presence/chat.
 * Spec §5.4.
 *
 * Total durasi: ~10 menit
 * Stages: 0→10→30→0
 */

import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { BASE_URL, login, pickStressTeknisi } from '../lib/auth.js'
import { thinkTimeLong } from '../lib/data.js'
import { pollingThresholds } from '../config/thresholds.js'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: pollingThresholds,
}

export default function () {
  const teknisi = pickStressTeknisi(__VU)

  group('Login', () => {
    login(teknisi.email, teknisi.password)
  })

  group('Poll notifications', () => {
    const res = http.get(`${BASE_URL}/api/notifications`, {
      tags: { name: 'poll_notifications' },
    })
    check(res, { 'notif 200': (r) => r.status === 200 })
  })

  group('Poll presence', () => {
    const res = http.get(`${BASE_URL}/api/teknisi/presence`, {
      tags: { name: 'poll_presence' },
    })
    check(res, { 'presence ok': (r) => r.status === 200 || r.status === 204 })
  })

  group('Poll chat conversations', () => {
    const res = http.get(`${BASE_URL}/api/chat/conversations`, {
      tags: { name: 'poll_chat' },
    })
    check(res, { 'chat 200': (r) => r.status === 200 })
  })

  group('Poll teknisi remote pending', () => {
    const res = http.get(`${BASE_URL}/api/teknisi/remote`, {
      tags: { name: 'poll_remote_pending' },
    })
    check(res, { 'remote 200': (r) => r.status === 200 })
  })

  sleep(thinkTimeLong())
}
