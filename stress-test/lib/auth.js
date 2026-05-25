/**
 * Auth helper untuk k6 — login dan dapatkan session cookie NextAuth.
 *
 * NextAuth credentials login flow:
 * 1. GET CSRF token dari /api/auth/csrf
 * 2. POST credentials ke /api/auth/callback/credentials dengan csrf token
 * 3. Cookie session di-set di response (auto-stored di cookie jar k6)
 */

import http from 'k6/http'
import { check } from 'k6'

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export function login(email, password) {
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`)
  const csrfToken = csrfRes.json('csrfToken')
  if (!csrfToken) return null

  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      email,
      password,
      csrfToken,
      callbackUrl: BASE_URL,
      json: 'true',
    },
    {
      redirects: 0,
      tags: { name: 'auth_login' },
    },
  )

  const ok = check(loginRes, {
    'login returns 200 or 302': (r) => r.status === 200 || r.status === 302,
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
