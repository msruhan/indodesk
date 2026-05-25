import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations/auth'
import { extractRequestContext, logAccountEvent } from '@/lib/activity-log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limit: 10 registrations per 15 minutes per IP
  const ip = getClientIp(req)
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    )
  }

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

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 409 },
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
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    // Create wallet for the new user
    await prisma.wallet.create({
      data: { userId: user.id, balance: 0 },
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

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
