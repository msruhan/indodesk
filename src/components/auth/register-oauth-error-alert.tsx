'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  registerOAuthErrorDetails,
  type RegisterOAuthErrorDetails,
} from '@/lib/auth/register-oauth-errors'

function RegisterOAuthErrorAlertInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [details, setDetails] = useState<RegisterOAuthErrorDetails | null>(null)

  useEffect(() => {
    const code = searchParams.get('error')
    const parsed = registerOAuthErrorDetails(code)
    if (!parsed) return

    setDetails(parsed)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('error')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  if (!details) return null

  return (
    <div
      className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
      role="alert"
    >
      <p className="font-semibold text-rose-800">{details.title}</p>
      <p className="mt-1 leading-relaxed text-rose-700">{details.message}</p>
      {details.showLoginLink && (
        <Link
          href="/login"
          className="mt-3 inline-flex items-center rounded-full border border-rose-300 bg-white px-3 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
        >
          Ke halaman login
        </Link>
      )}
      {details.showLengkapiLink && (
        <Link
          href="/register/teknisi/lengkapi"
          className="mt-3 inline-flex items-center rounded-full border border-primary-300 bg-white px-3 py-1 text-[11px] font-semibold text-primary-800 hover:bg-primary-50"
        >
          Lengkapi profil teknisi
        </Link>
      )}
    </div>
  )
}

export function RegisterOAuthErrorAlert() {
  return (
    <Suspense fallback={null}>
      <RegisterOAuthErrorAlertInner />
    </Suspense>
  )
}
