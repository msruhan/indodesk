'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  buildIndodeskConnectLink,
  buildIndodeskPasswordLink,
  openIndodeskDeepLink,
} from '@/lib/indodesk-deeplink'
import { Copy, ExternalLink, Laptop, Lock, Shield } from '@/lib/icons'

type Props = {
  remoteId: string
  remoteOtp: string | null
  device?: string | null
  clientOs?: string | null
  role: 'user' | 'teknisi'
  compact?: boolean
  awaitingConfirmation?: boolean
  confirmDeadlineAt?: string | null
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    const { toast } = await import('sonner')
    toast.success(`${label} disalin`)
  } catch {
    const { toast } = await import('sonner')
    toast.error(`Gagal menyalin ${label}`)
  }
}

export function IndodeskRemotePanel({
  remoteId,
  remoteOtp,
  device,
  clientOs,
  role,
  compact = false,
  awaitingConfirmation = false,
  confirmDeadlineAt,
}: Props) {
  const canConnect = role === 'teknisi' && remoteId && remoteOtp
  const canSetPassword = role === 'user' && remoteOtp

  return (
    <div
      className={cn(
        'rounded-lg border border-primary-100 bg-primary-50/50',
        compact ? 'space-y-1.5 p-2 text-[10px]' : 'space-y-2 p-3 text-xs',
      )}
    >
      <p className="font-medium text-primary-900">
        {role === 'teknisi' ? 'Koneksi IndoDesk' : 'Siapkan IndoDesk Anda'}
      </p>

      {(device || clientOs) && (
        <span className="flex items-center gap-1 text-surface-600">
          <Laptop className="h-3 w-3 shrink-0 text-surface-400" />
          {[device, clientOs].filter(Boolean).join(' · ')}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-1 font-mono text-surface-700">
        <Shield className="h-3 w-3 shrink-0 text-primary-600" />
        {remoteId}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[9px]"
          onClick={() => void copyText('ID', remoteId)}
        >
          <Copy className="h-3 w-3" />
          Salin
        </Button>
      </div>

      {remoteOtp ? (
        <>
          {awaitingConfirmation && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
              Masa garansi remote — konfirmasi layanan dalam 24 jam
              {confirmDeadlineAt
                ? ` (batas ${new Date(confirmDeadlineAt).toLocaleString('id-ID')})`
                : ''}
              .
            </p>
          )}
          <p className="text-surface-600">
            Buka IndoDesk dan masukkan OTP ini saat aplikasi dimulai.
          </p>
          <div className="flex flex-wrap items-center gap-1 font-mono text-primary-800">
            <Lock className="h-3 w-3 shrink-0" />
            OTP: {remoteOtp}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[9px]"
              onClick={() => void copyText('OTP', remoteOtp)}
            >
              <Copy className="h-3 w-3" />
              Salin
            </Button>
          </div>

          {canSetPassword && (
            <div className="space-y-1.5">
              <p className="text-surface-600">
                Set OTP ini sebagai password IndoDesk Anda, lalu biarkan aplikasi terbuka.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className={compact ? 'h-7 text-[10px]' : 'h-8 text-xs'}
                onClick={() => openIndodeskDeepLink(buildIndodeskPasswordLink(remoteOtp))}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Buka IndoDesk
              </Button>
            </div>
          )}

          {canConnect && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={compact ? 'h-7 w-full text-[10px]' : 'h-8 w-full text-xs'}
              onClick={() =>
                openIndodeskDeepLink(buildIndodeskConnectLink(remoteId, remoteOtp))
              }
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Hubungkan via IndoDesk
            </Button>
          )}
        </>
      ) : (
        <p className="text-surface-600">
          {role === 'teknisi'
            ? 'OTP akan muncul setelah Anda menekan Mulai.'
            : 'OTP akan muncul setelah teknisi memulai sesi.'}
        </p>
      )}
    </div>
  )
}
