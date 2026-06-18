'use client'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useFeatureFlags } from '@/contexts/feature-flags-context'

type GoogleAuthDividerProps = {
  callbackUrl?: string
  className?: string
}

export function GoogleAuthDivider({ callbackUrl, className }: GoogleAuthDividerProps) {
  const { flags, loading } = useFeatureFlags()

  if (loading || !flags.googleAuthEnabled) return null

  return (
    <div className={className ?? 'mt-4 space-y-3'}>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-200" />
        <span className="text-[11px] font-medium text-surface-500">atau</span>
        <div className="h-px flex-1 bg-surface-200" />
      </div>
      <GoogleSignInButton callbackUrl={callbackUrl} />
    </div>
  )
}
