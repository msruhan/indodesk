'use client'

import Link from 'next/link'
import { Navbar, Footer } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from '@/lib/icons'
import { SUPPORT_EMAIL } from '@/lib/legal-content'

type Props = {
  title: string
  updatedLabel?: string
  children: React.ReactNode
}

export function LegalPageShell({ title, updatedLabel, children }: Props) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-28">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Beranda
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">
            {title}
          </h1>
          {updatedLabel ? (
            <p className="mt-2 text-sm text-surface-500">Terakhir diperbarui: {updatedLabel}</p>
          ) : null}
        </header>

        {children}
      </main>

      <Footer />
      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}

export function LegalPointsList({ points }: { points: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-5">
      {points.map((point, index) => (
        <li
          key={point.title}
          className="rounded-2xl border border-surface-200/80 bg-white/90 p-4 shadow-soft-xs sm:p-5"
        >
          <p className="text-sm font-semibold text-ink">
            {index + 1}. {point.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-surface-600">{point.body}</p>
        </li>
      ))}
    </ol>
  )
}

export function KontakSupportCard() {
  return (
    <div className="rounded-2xl border border-primary-200/70 bg-gradient-to-br from-white to-primary-50/40 p-6 shadow-soft-xs sm:p-8">
      <p className="text-sm leading-relaxed text-surface-600">
        Ada pertanyaan seputar akun, transaksi, atau layanan Bantoo?
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-4 inline-block text-lg font-semibold text-primary-700 transition-colors hover:text-primary-800"
      >
        {SUPPORT_EMAIL}
      </a>
      <p className="mt-3 text-sm text-surface-500">Respon 1–2 hari kerja.</p>
      <div className="mt-6">
        <Button variant="outline" size="sm" asChild>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Kirim email</a>
        </Button>
      </div>
    </div>
  )
}
