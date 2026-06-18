'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, X } from '@/lib/icons'
import { formatIdr } from '@/lib/wallet-transactions'
import { cn } from '@/lib/utils'

const PRESETS = [50000, 100000, 250000, 500000]
const OTP_COOLDOWN_SEC = 60

type WalletWithdrawModalProps = {
  onClose: () => void
  onSuccess?: () => void
}

export function WalletWithdrawModal({ onClose, onSuccess }: WalletWithdrawModalProps) {
  const { wallet, refreshWallet } = useWallet()
  const balance = wallet ? parseFloat(wallet.balance) : 0

  const [amount, setAmount] = useState(100000)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [totp, setTotp] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [note, setNote] = useState('')
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [otpLoading, setOtpLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const load2fa = useCallback(async () => {
    try {
      const res = await fetch('/api/user/2fa')
      const json = await res.json()
      if (json.success) setTwoFaEnabled(Boolean(json.data?.enabled))
    } catch {
      setTwoFaEnabled(false)
    }
  }, [])

  useEffect(() => {
    void load2fa()
  }, [load2fa])

  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  const requestEmailOtp = async () => {
    setOtpLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wallet/withdraw/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal mengirim OTP email')
        return
      }
      setOtpSentTo(json.data.maskedEmail as string)
      setOtpCooldown(OTP_COOLDOWN_SEC)
      if (!json.data.smtpConfigured) {
        setError(
          'SMTP belum dikonfigurasi di Admin → Profil. Kode OTP ada di log server.',
        )
      }
    } catch {
      setError('Gagal mengirim OTP email')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    if (amount > balance) {
      setError('Saldo tidak cukup')
      setLoading(false)
      return
    }

    if (!emailOtp.trim()) {
      setError('Kode OTP email wajib diisi. Klik "Kirim OTP" terlebih dahulu.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          emailOtp: emailOtp.trim(),
          totp: twoFaEnabled ? totp.trim() : undefined,
          confirmPassword: twoFaEnabled ? undefined : confirmPassword,
          note: note.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal mengajukan penarikan')
        return
      }
      setSuccess(true)
      await refreshWallet()
      onSuccess?.()
    } catch {
      setError('Gagal mengajukan penarikan')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    amount > 0 &&
    bankName.trim() &&
    accountNumber.trim() &&
    accountHolder.trim() &&
    emailOtp.trim().length === 6 &&
    (twoFaEnabled ? totp.trim().length >= 6 : confirmPassword.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Tarik Saldo</h3>
            <p className="mt-0.5 text-xs text-surface-500">
              Verifikasi OTP email + MFA. Diproses dalam 1×24 jam.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Download className="h-6 w-6 text-primary-700" />
            </div>
            <p className="text-sm font-medium text-ink">Pengajuan penarikan berhasil</p>
            <p className="text-xs text-surface-500">
              Tim kami akan transfer ke rekening Anda maksimal 1×24 jam.
            </p>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Tutup
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-surface-600">
              Saldo tersedia: <span className="font-semibold text-ink">{formatIdr(balance)}</span>
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Jumlah</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      amount === p
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
                    )}
                  >
                    {formatIdr(p)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Bank</label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">No. rekening</label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Atas nama</label>
              <Input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama pemilik rekening"
              />
            </div>

            <div className="rounded-xl border border-surface-200 bg-surface-50/60 p-3 space-y-3">
              <p className="text-xs font-semibold text-ink">Verifikasi keamanan</p>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-surface-600">OTP Email</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    disabled={otpLoading || otpCooldown > 0}
                    onClick={() => void requestEmailOtp()}
                  >
                    {otpLoading
                      ? 'Mengirim…'
                      : otpCooldown > 0
                        ? `Kirim ulang (${otpCooldown}s)`
                        : 'Kirim OTP'}
                  </Button>
                </div>
                {otpSentTo && (
                  <p className="mb-1 text-[10px] text-primary-700">Dikirim ke {otpSentTo}</p>
                )}
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit dari email"
                />
              </div>

              {twoFaEnabled ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">
                    Kode MFA (authenticator)
                  </label>
                  <Input
                    inputMode="numeric"
                    maxLength={8}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\s/g, '').slice(0, 8))}
                    placeholder="6 digit dari aplikasi MFA"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">
                    Password akun
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password"
                  />
                  <p className="mt-1 text-[10px] text-surface-500">
                    Aktifkan MFA di Pengaturan Akun untuk verifikasi lebih aman.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                Catatan (opsional)
              </label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk admin" />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
            )}

            <Button
              variant="primary"
              className="w-full"
              disabled={loading || !canSubmit}
              onClick={() => void handleSubmit()}
            >
              {loading ? 'Mengajukan…' : 'Ajukan penarikan'}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
