'use client'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import type { GoogleRegisterRole } from '@/lib/auth/google-register-cookie'

type GoogleRegisterDividerProps = {
  role: GoogleRegisterRole
  callbackUrl?: string
  className?: string
}

export function GoogleRegisterDivider({ role, callbackUrl, className }: GoogleRegisterDividerProps) {
  const { flags, loading } = useFeatureFlags()

  if (loading || !flags.googleAuthEnabled) return null

  return (
    <div className={className ?? 'space-y-3'}>
      <GoogleSignInButton callbackUrl={callbackUrl} registerRole={role} />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-200" />
        <span className="text-[11px] font-medium text-surface-500">atau isi formulir</span>
        <div className="h-px flex-1 bg-surface-200" />
      </div>
    </div>
  )
}
