import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { extractRequestContext, logAccountEvent } from '@/lib/activity-log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import {
  buildApplicationData,
  teknisiRegisterSchema,
} from '@/lib/teknisi-registration'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`register-teknisi:${ip}`, RATE_LIMITS.auth)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    )
  }

  try {
    const body = await req.json()
    const parsed = teknisiRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const data = parsed.data
    const email = data.email.toLowerCase().trim()
    const phone = data.phone.replace(/\s/g, '')

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 409 },
      )
    }

    const hashedPassword = await hash(data.password, 12)
    const applicationData = buildApplicationData(data)
    const specialty = data.specialty.map((s) => s.trim()).filter(Boolean)

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: hashedPassword,
        role: 'TEKNISI',
        phone,
        wallet: { create: { balance: 0 } },
        teknisiProfile: {
          create: {
            specialty,
            experience: data.experience.trim(),
            location: data.location.trim(),
            description: data.motivation.trim(),
            isVerified: false,
            verificationStatus: 'PENDING',
            applicationData: applicationData as object,
          },
        },
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
      summary: `Pendaftaran teknisi baru (menunggu approval): ${user.name}`,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      target: { type: 'user', id: user.id, label: user.email },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { role: user.role, verificationStatus: 'PENDING' },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          message:
            'Pendaftaran berhasil. Tim admin akan meninjau aplikasi Anda. Anda dapat login setelah disetujui.',
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[REGISTER_TEKNISI]', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
