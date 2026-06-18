import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations/auth'
import { extractRequestContext, logAccountEvent } from '@/lib/activity-log'
import { sendEmailVerification } from '@/lib/email-verification'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'

export async function POST(req: Request) {
  // Rate limit: 10 registrations per 15 minutes per IP
  const ip = getClientIp(req)
  const rl = await withRateLimit(req, ['auth', 'register', ip], RATE_LIMITS.auth)
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { name, email, password } = parsed.data
    const role = 'USER' as const

    // Check if email already exists (anti-enumeration: same response shape)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message:
            'Jika email belum terdaftar, akun telah dibuat. Periksa inbox untuk verifikasi email.',
        },
        { status: 201 },
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: false,
        wallet: { create: { balance: 0 } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    const ctx = extractRequestContext(req)
    void logAccountEvent({
      action: 'account.register',
      severity: 'SUCCESS',
      summary: `Akun baru terdaftar: ${user.name} (${user.role})`,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      target: { type: 'user', id: user.id, label: user.email },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { role: user.role },
    })

    void sendEmailVerification(user.id, user.email).catch((e) => {
      console.error('[REGISTER_SEND_VERIFICATION]', e)
    })

    return NextResponse.json(
      {
        success: true,
        message:
          'Jika email belum terdaftar, akun telah dibuat. Periksa inbox untuk verifikasi email.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
