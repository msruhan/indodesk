import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api-auth'
import {
  setGoogleRegisterIntentCookie,
  type GoogleRegisterRole,
} from '@/lib/auth/google-register-cookie'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'
import {
  isTeknisiRegistrationOpen,
  isUserRegistrationOpen,
  teknisiRegistrationClosedMessage,
  userRegistrationClosedMessage,
} from '@/lib/registration-control-server'

const bodySchema = z.object({
  role: z.enum(['USER', 'TEKNISI']),
})

export async function POST(req: Request) {
  if (!isGoogleAuthEnabled) {
    return apiError('Login Google belum dikonfigurasi', 503)
  }

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Role pendaftaran tidak valid', 400)
    }

    const role = parsed.data.role as GoogleRegisterRole

    if (role === 'USER' && !(await isUserRegistrationOpen())) {
      return apiError(userRegistrationClosedMessage(), 403)
    }
    if (role === 'TEKNISI' && !(await isTeknisiRegistrationOpen())) {
      return apiError(teknisiRegistrationClosedMessage(), 403)
    }

    await setGoogleRegisterIntentCookie(role)
    return apiSuccess({ ok: true })
  } catch (error) {
    console.error('[GOOGLE_REGISTER_INTENT]', error)
    return NextResponse.json({ success: false, error: 'Gagal memulai pendaftaran Google' }, { status: 500 })
  }
}
