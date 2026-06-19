'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { PageHero } from '@/components/shared/page-hero'
import { buildServiceTabs } from '@/lib/section-tab-config'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { canAccessInspectionService } from '@/lib/platform-settings-shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare, Laptop, MapPin, Video } from '@/lib/icons'

const steps = [
  {
    title: 'Buat permintaan',
    desc: 'Isi detail barang (dari marketplace mana pun) dan pilih teknisi terverifikasi.',
  },
  {
    title: 'Inspeksi dilakukan',
    desc: 'Online: dipandu via chat/video. Offline: teknisi datang ke lokasi.',
  },
  {
    title: 'Terima laporan',
    desc: 'Checklist, foto, dan rekomendasi layak beli sebelum Anda transfer uang.',
  },
]

export default function InspeksiLandingPage() {
  const router = useRouter()
  const { status } = useSession()
  const { user, isLoading: authLoading } = useAuth()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const allowed = canAccessInspectionService(role, flags)
  const guardLoading = authLoading || flagsLoading
  const tabs = buildServiceTabs(role, flags)

  const isAuthed = status === 'authenticated'
  const ctaHref = isAuthed ? '/user/inspeksi/baru' : '/login?callbackUrl=/user/inspeksi/baru'

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <p className="text-sm text-surface-500">Memeriksa akses…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-surface-50">
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <section className="relative flex min-h-[60vh] items-center justify-center px-4 lg:pt-28">
          <div className="max-w-md rounded-2xl border border-surface-200/70 bg-white/90 p-8 text-center shadow-soft-md backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-ink">
              Layanan Inspeksi tidak tersedia
            </h2>
            <p className="mt-2 text-sm text-surface-600">
              Menu Inspeksi Pra-Beli sedang dinonaktifkan oleh admin. Silakan cek kembali nanti.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button variant="primary" size="sm" onClick={() => router.push('/')}>
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </section>
        <MobileSafeAreaSpacer />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <PageHero
        sectionTabs={{ tabs, layoutId: 'service-section-tab' }}
        badge={{ icon: CheckSquare, label: 'Inspeksi Pra-Beli' }}
        title={
          <>
            Beli HP & Laptop dengan
            <span className="block">
              <span className="gradient-text-static">percaya diri</span>
            </span>
          </>
        }
        description="Jasa inspeksi dari teknisi terverifikasi Bantoo — untuk barang dari marketplace kami atau platform lain (OLX, Tokopedia, dll)."
        right={
          <Button asChild className="bg-gradient-to-r from-primary-600 to-accent-500">
            <Link href={ctaHref}>Mulai inspeksi</Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-primary-100">
            <CardContent className="flex gap-4 p-5">
              <Video className="h-8 w-8 shrink-0 text-primary-600" />
              <div>
                <h3 className="font-semibold text-ink">Inspeksi online</h3>
                <p className="mt-1 text-sm text-surface-600">
                  Teknisi memandu Anda mengecek unit lewat video call. Cocok untuk luar kota atau
                  deal cepat.
                </p>
                <p className="mt-2 text-xs font-medium text-primary-700">Mulai Rp 75.000</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent-100">
            <CardContent className="flex gap-4 p-5">
              <MapPin className="h-8 w-8 shrink-0 text-accent-600" />
              <div>
                <h3 className="font-semibold text-ink">Inspeksi offline</h3>
                <p className="mt-1 text-sm text-surface-600">
                  Teknisi datang ke lokasi untuk pemeriksaan fisik menyeluruh sebelum transaksi.
                </p>
                <p className="mt-2 text-xs font-medium text-primary-700">Mulai Rp 200.000</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-ink">Cara kerja</h3>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-sm text-surface-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-dashed border-primary-200 bg-primary-50/40">
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Laptop className="mt-0.5 h-6 w-6 text-primary-600" />
              <div>
                <p className="font-semibold text-ink">Sudah punya target barang?</p>
                <p className="text-sm text-surface-600">
                  Login untuk memesan inspeksi dan lacak laporan di dashboard Anda.
                </p>
              </div>
            </div>
            <Button asChild variant="primary">
              <Link href={ctaHref}>Pesan inspeksi sekarang</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
