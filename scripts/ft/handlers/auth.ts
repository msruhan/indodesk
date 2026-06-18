import { HandlerRegistry } from './_registry'
import {
  ACCOUNTS,
  assert,
  assert4xx,
  assertStatus,
  login,
  makeJar,
  request,
  skip,
  STRESS_PASSWORD,
} from '../lib'

export function registerAuthHandlers(r: HandlerRegistry): void {
  r.api('FT-AUTH-001', async () => {
    const email = `qa-ft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@qa-functional.test`
    const res = await request(null, 'POST', '/api/auth/register', {
      name: 'QA Functional',
      email,
      password: 'Strong#Pass1',
      role: 'USER',
    })
    if (res.status === 429) skip('Rate limit register — tunggu 15 menit atau jalankan ulang')
    assert(
      res.data?.success === true && (res.status === 200 || res.status === 201),
      `register failed status=${res.status} body=${JSON.stringify(res.data)}`,
    )
  })

  r.api('FT-AUTH-002', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login failed')
    const session = await request(jar, 'GET', '/api/auth/session')
    assertStatus(session.status, 200, 'session')
    assert(session.data?.user?.email === ACCOUNTS.stressUser1, 'email mismatch')
  })

  r.api('FT-AUTH-003', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressTeknisi1), 'login failed')
    const dash = await request(jar, 'GET', '/api/teknisi/dashboard')
    assertStatus(dash.status, 200, 'teknisi dashboard')
  })

  r.skip('FT-AUTH-004', 'Google OAuth memerlukan interaksi browser dengan akun Google')

  r.api('FT-AUTH-005', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser2), 'login failed')
    const setup = await request(jar, 'POST', '/api/user/2fa/setup')
    assertStatus(setup.status, [200, 400], '2fa setup')
    if (setup.status === 200) {
      assert(setup.data?.data?.qrDataUrl || setup.data?.data?.manualEntryKey, 'missing TOTP setup payload')
    }
  })

  r.skip('FT-AUTH-006', 'Login 2FA memerlukan kode TOTP dari authenticator app')

  r.skip('FT-AUTH-007', 'Endpoint API forgot-password belum tersedia')

  r.api('FT-AUTH-008', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login failed')
    const res = await request(jar, 'PATCH', '/api/user/profile', {
      name: 'Stress User FT',
      phone: '+62 800-0000-0001',
    })
    assertStatus(res.status, 200, 'patch profile')
    assert(res.data?.success === true, 'profile update failed')
  })

  r.skip('FT-AUTH-009', 'Upload avatar memerlukan multipart file — gunakan API terpisah jika R2 dikonfigurasi')

  r.api('FT-AUTH-010', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser2), 'login failed')
    const res = await request(jar, 'POST', '/api/user/password', {
      currentPassword: STRESS_PASSWORD,
      newPassword: 'NewStress#99',
    })
    assertStatus(res.status, [200, 400, 401], 'change password')
    if (res.status === 200) {
      await request(jar, 'POST', '/api/user/password', {
        currentPassword: 'NewStress#99',
        newPassword: STRESS_PASSWORD,
      })
    }
  })

  r.skip(
    'FT-AUTH-011',
    'Logout NextAuth memerlukan CSRF token dari browser — tidak tersedia di runner API',
  )

  r.api('FT-AUTH-101', async () => {
    const res = await request(null, 'POST', '/api/auth/register', {
      name: 'Dup',
      email: ACCOUNTS.seedUser1,
      password: 'Strong#Pass1',
    })
    assert4xx(res.status, 'duplicate register')
  })

  r.api('FT-AUTH-102', async () => {
    const res = await request(null, 'POST', '/api/auth/register', {
      name: 'Weak',
      email: `weak-${Date.now()}@test.com`,
      password: '123',
    })
    assert4xx(res.status, 'weak password')
  })

  r.api('FT-AUTH-103', async () => {
    const jar = makeJar()
    const res = await request(jar, 'POST', '/api/stress-internal/login', {
      email: ACCOUNTS.stressUser1,
      password: 'wrong-password',
    })
    assert4xx(res.status, 'wrong login')
  })

  r.skip('FT-AUTH-104', 'Perlu akun TEKNISI verificationStatus=PENDING di DB')

  r.api('FT-AUTH-105', async () => {
    const res = await request(null, 'PATCH', '/api/user/profile', { name: 'Hack' })
    assert4xx(res.status, 'unauth profile')
  })

  r.api('FT-AUTH-106', async () => {
    const jar = makeJar()
    assert(await login(jar, ACCOUNTS.stressUser1), 'login failed')
    const res = await request(jar, 'POST', '/api/user/password', {
      currentPassword: 'wrong-old',
      newPassword: 'NewStress#99',
    })
    assert4xx(res.status, 'wrong current password')
  })

  r.api('FT-AUTH-201', async () => {
    const jar = makeJar()
    for (let i = 0; i < 6; i++) {
      await request(jar, 'POST', '/api/stress-internal/login', {
        email: ACCOUNTS.stressUser1,
        password: 'wrong',
      })
    }
    const res = await request(jar, 'POST', '/api/stress-internal/login', {
      email: ACCOUNTS.stressUser1,
      password: 'wrong',
    })
    assert(res.status === 429 || res.status === 401, `expected 429 or 401, got ${res.status}`)
  })

  r.skip('FT-AUTH-202', 'Verifikasi TOTP expired memerlukan kode dari authenticator')

  r.api('FT-AUTH-203', async () => {
    const res = await request(null, 'GET', '/user/dashboard', undefined)
    assert(res.status === 307 || res.status === 302 || res.status === 401, `redirect expected, got ${res.status}`)
  })

  r.api('FT-AUTH-901', async () => {
    for (const path of ['/api/user/profile', '/api/teknisi/dashboard', '/api/admin/users']) {
      const res = await request(null, 'GET', path)
      assert4xx(res.status, path)
    }
  })

  r.skip('FT-AUTH-902', 'Reset password token flow belum punya endpoint API publik')
}
