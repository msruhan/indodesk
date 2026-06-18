'use client'

import { Input } from '@/components/ui/input'

type Props = {
  confirmPassword: string
  totp: string
  onConfirmPasswordChange: (value: string) => void
  onTotpChange: (value: string) => void
  twoFactorEnabled?: boolean
  className?: string
}

/** Re-authentication fields for sensitive admin actions. */
export function AdminStepUpFields({
  confirmPassword,
  totp,
  onConfirmPasswordChange,
  onTotpChange,
  twoFactorEnabled = false,
  className,
}: Props) {
  return (
    <div className={className ?? 'space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4'}>
      <p className="text-sm font-medium text-amber-900">Konfirmasi identitas admin</p>
      {twoFactorEnabled ? (
        <div>
          <label className="mb-1 block text-sm text-surface-700">Kode 2FA</label>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 digit dari authenticator"
            value={totp}
            onChange={(e) => onTotpChange(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm text-surface-700">Password admin</label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password login Anda"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
