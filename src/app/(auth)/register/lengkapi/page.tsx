import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuroraBackground } from '@/components/motion'
import { User } from '@/lib/icons'
import { isComingSoonEnabled } from '@/lib/coming-soon-server'
import { COMING_SOON_LOGIN_BLOCKED_MESSAGE } from '@/lib/coming-soon-shared'

export default async function RegisterUserLengkapiPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'USER') {
    redirect('/register?error=google_register_expired')
  }

  const comingSoon = await isComingSoonEnabled()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AuroraBackground intensity="vivid" />
      <div className="relative w-full max-w-md">
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <User className="h-7 w-7 text-emerald-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Pendaftaran Berhasil</CardTitle>
            <CardDescription className="text-surface-600">
              Akun Google Anda sudah terhubung ke Bantoo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-surface-50/60 p-4 text-sm">
              <p className="font-medium text-ink">{session.user.name}</p>
              <p className="mt-1 text-surface-600">{session.user.email}</p>
            </div>

            {comingSoon ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Mode Coming Soon aktif</p>
                <p className="mt-1 leading-relaxed">{COMING_SOON_LOGIN_BLOCKED_MESSAGE}</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-surface-600">
                Anda sudah bisa masuk dan mulai menggunakan marketplace, konsultasi, dan layanan
                Bantoo.
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-8">
            {!comingSoon ? (
              <Link href="/user/dashboard" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  Ke dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  Ke halaman login
                </Button>
              </Link>
            )}
            <Link href="/" className="text-center text-sm text-surface-500 hover:text-ink">
              ← Kembali ke beranda
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
