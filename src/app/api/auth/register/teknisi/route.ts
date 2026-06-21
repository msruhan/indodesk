import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { extractRequestContext, logAccountEvent } from '@/lib/activity-log'
import { getClientIp, RATE_LIMITS, withRateLimit, rateLimitResponse } from '@/lib/rate-limit-store'
import {
  buildApplicationData,
  teknisiRegisterSchema,
} from '@/lib/teknisi-registration'
import { sendEmailVerification } from '@/lib/email-verification'
import {
  COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE,
  isComingSoonEnabled,
} from '@/lib/coming-soon-server'

export async function POST(req: Request) {
  if (await isComingSoonEnabled()) {
    return NextResponse.json(
      { success: false, error: COMING_SOON_ADMIN_ONLY_LOGIN_MESSAGE, code: 'COMING_SOON' },
      { status: 503 },
    )
  }

  const ip = getClientIp(req)
  const rl = await withRateLimit(req, ['auth', 'register-teknisi', ip], RATE_LIMITS.auth)
  if (!rl.allowed) {
    return rateLimitResponse(rl)
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
        {
          success: true,
          message:
            'Jika email belum terdaftar, pendaftaran teknisi telah diterima. Periksa inbox untuk verifikasi.',
        },
        { status: 201 },
      )
    }

    const hashedPassword = await hash(data.password, 12)
    const applicationData = buildApplicationData(data)
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: hashedPassword,
        role: 'TEKNISI',
        phone,
        isActive: false,
        wallet: { create: { balance: 0 } },
        teknisiProfile: {
          create: {
            specialty: [],
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

    void sendEmailVerification(user.id, user.email).catch((e) => {
      console.error('[REGISTER_TEKNISI_SEND_VERIFICATION]', e)
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          message:
            'Pendaftaran berhasil. Kami telah mengirim email verifikasi — klik tautan di inbox Anda. Setelah email dikonfirmasi, tim admin akan meninjau aplikasi Anda.',
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
