import { NextResponse } from 'next/server'
import { isStressTestMode } from '@/lib/stress-mode'
import { signIn } from '@/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/stress-internal/login
 * Body: { email, password }
 *
 * Bypass CSRF flow — langsung pakai server-side signIn dari NextAuth.
 * Aktif HANYA saat STRESS_TEST_MODE=true. Return 404 di production.
 *
 * Email harus berakhiran @indoteknizi.test untuk extra safety.
 */
export async function POST(req: Request) {
  if (!isStressTestMode()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'email & password required' }, { status: 400 })
  }

  // Extra safety: hanya boleh login user dengan email @indoteknizi.test
  if (!email.endsWith('@indoteknizi.test')) {
    return NextResponse.json(
      { error: 'only stress test accounts allowed' },
      { status: 403 },
    )
  }

  try {
    // signIn akan set session cookie di response otomatis
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'login failed' },
      { status: 401 },
    )
  }
}
