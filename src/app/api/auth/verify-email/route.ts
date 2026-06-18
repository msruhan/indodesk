import { NextResponse } from 'next/server'
import { confirmEmailVerification } from '@/lib/email-verification'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')?.trim()
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?verify=missing`)
  }

  const result = await confirmEmailVerification(token)
  if (!result.ok) {
    return NextResponse.redirect(`${baseUrl}/login?verify=invalid`)
  }

  if (result.role === 'TEKNISI') {
    return NextResponse.redirect(`${baseUrl}/login?verify=teknisi_pending`)
  }

  return NextResponse.redirect(`${baseUrl}/login?verify=success`)
}
