/**
 * Auth helper untuk k6 — login pakai endpoint internal stress mode.
 *
 * Endpoint /api/stress-internal/login bypass CSRF flow dan langsung
 * panggil signIn server-side. Cookie session di-set di response,
 * cookie jar k6 otomatis simpan untuk request berikutnya.
 */

import http from 'k6/http'
import { check } from 'k6'

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/stress-internal/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'stress_login' },
    },
  )

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
  })

  if (!ok) return null
  return http.cookieJar()
}

export function pickStressUser(vuId) {
  const userIdx = ((vuId - 1) % 30) + 1
  return {
    email: `stress-user-${userIdx}@indoteknizi.test`,
    password: 'StressTest123!',
  }
}

export function pickStressTeknisi(vuId) {
  const teknisiIdx = ((vuId - 1) % 20) + 1
  return {
    email: `stress-teknisi-${teknisiIdx}@indoteknizi.test`,
    password: 'StressTest123!',
  }
}
