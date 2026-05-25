'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Wallet, Plus, X, Sparkles, Shield, CreditCard } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatIdrAbs } from '@/lib/admin-saldo'

export type DepositTarget = {
  id: string
  name: string
  email: string
  role: 'USER' | 'TEKNISI' | 'ADMIN'
  balance: string
}

const PRESETS = [50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000]

export function AdminDepositModal({
  target,
  onClose,
  onSuccess,
}: {
  target: DepositTarget
  onClose: () => void
  onSuccess: (info: { amount: number; newBalance: string }) => void
}) {
  const [amount, setAmount] = useState<number>(0)
  const [method, setMethod] = useState<'manual' | 'gateway-sim'>('manual')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = parseFloat(target.balance)
  const previewBalance = balance + (Number.isFinite(amount) ? amount : 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!amount || amount <= 0) {
      setError('Masukkan jumlah deposit yang valid')
      return
    }
    if (!Number.isInteger(amount)) {
      setError('Jumlah harus berupa bilangan bulat (Rp)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: target.id,
          amount,
          method,
          note,
          reference,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal melakukan deposit')
        return
      }
      onSuccess({ amount, newBalance: json.data.balance })
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-surface-200/70 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-surface-200/70 bg-gradient-to-br from-primary-50 via-white to-accent-50/40 p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft-md">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-700">
                Deposit Saldo
              </p>
              <h2 className="truncate text-lg font-semibold text-ink">{target.name}</h2>
              <p className="truncate text-xs text-surface-500">
                {target.email} · {target.role === 'TEKNISI' ? 'Teknisi' : 'User'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/60 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-500">
                Saldo saat ini
              </p>
              <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">{formatIdrAbs(balance)}</p>
            </div>
            <div className="rounded-xl border border-primary-200/70 bg-primary-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700">
                Setelah deposit
              </p>
              <p className="mt-0.5 text-sm font-bold text-primary-700 tabular-nums">{formatIdrAbs(previewBalance)}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Method */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-600">
              Metode Deposit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'manual', label: 'Manual', icon: Shield, desc: 'Diinput admin' },
                { id: 'gateway-sim', label: 'Payment Gateway', icon: CreditCard, desc: 'Simulasi PG' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id as typeof method)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all',
                    method === id
                      ? 'border-primary-500 bg-primary-50/60 shadow-soft-sm'
                      : 'border-surface-200/80 bg-white hover:border-primary-300',
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <Icon className={cn('h-4 w-4', method === id ? 'text-primary-700' : 'text-surface-500')} />
                    <span className={cn('text-sm font-semibold', method === id ? 'text-primary-700' : 'text-ink')}>
                      {label}
                    </span>
                  </div>
                  <span className="text-[11px] text-surface-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-600">
              Jumlah (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-surface-500">Rp</span>
              <Input
                type="number"
                min={0}
                step={1000}
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="pl-10 text-base font-semibold tabular-nums"
                placeholder="0"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    amount === preset
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-primary-200 hover:text-primary-700',
                  )}
                >
                  +{formatIdrAbs(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-600">
              Catatan / Alasan
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Contoh: Top up saldo via transfer BCA, bonus referral, refund manual…"
              className="w-full rounded-xl border border-surface-200/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-surface-400 shadow-soft-xs focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-surface-500">
              <Sparkles className="h-3 w-3" />
              Catatan akan tercatat di ledger sebagai bukti audit-trail.
            </p>
          </div>

          {/* Reference (only when gateway sim) */}
          {method === 'gateway-sim' && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-600">
                Nomor Referensi PG
              </label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Mis. VA-12345 / TRX-99887766"
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="px-2 py-1 text-[10px]">
              <Plus className="h-3 w-3" />
              Akan ditambahkan ke saldo {target.name}
            </Badge>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-9"
                disabled={loading || !amount}
              >
                {loading ? 'Memproses…' : `Deposit ${amount > 0 ? formatIdrAbs(amount) : ''}`.trim()}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
