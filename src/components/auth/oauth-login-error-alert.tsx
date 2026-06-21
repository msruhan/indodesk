'use client'

import Link from 'next/link'
import type { OAuthLoginErrorDetails } from '@/lib/auth/login-oauth-errors'

type OAuthLoginErrorAlertProps = {
  details: OAuthLoginErrorDetails
}

export function OAuthLoginErrorAlert({ details }: OAuthLoginErrorAlertProps) {
  return (
    <div
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
      role="alert"
    >
      <p className="font-semibold text-rose-800">{details.title}</p>
      <p className="mt-1 leading-relaxed text-rose-700">{details.message}</p>
      {details.showRegisterLinks && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/register"
            className="inline-flex items-center rounded-full border border-rose-300 bg-white px-3 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
          >
            Daftar user
          </Link>
          <Link
            href="/register/teknisi"
            className="inline-flex items-center rounded-full border border-rose-300 bg-white px-3 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
          >
            Daftar teknisi
          </Link>
        </div>
      )}
    </div>
  )
}
