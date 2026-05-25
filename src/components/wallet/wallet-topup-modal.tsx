'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { CreditCard, X } from '@/lib/icons'
import { cn } from '@/lib/utils'

const PRESETS = [50000, 100000, 250000, 500000, 1000000]

type WalletTopupModalProps = {
  onClose: () => void
  onSuccess?: () => void
  title?: string
}

export function WalletTopupModal({
  onClose,
  onSuccess,
  title = 'Topup Saldo',
}: WalletTopupModalProps) {
  const { topup } = useWallet()
  const [step, setStep] = useState<'amount' | 'method' | 'confirm'>('amount')
  const [amount, setAmount] = useState(50000)
  const [method, setMethod] = useState<'GATEWAY' | 'PAYPAL' | 'TRANSFER'>('GATEWAY')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const result = await topup(amount, method, {
      bankName,
      accountName,
    })

    if (result.success) {
      onSuccess?.()
      onClose()
    } else {
      setError(result.error || 'Gagal membuat topup request')
    }

    setLoading(false)
  }

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
        className="w-full max-w-md rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-0.5 text-xs text-surface-500">
              {step === 'amount' && 'Pilih jumlah topup'}
              {step === 'method' && 'Pilih metode pembayaran'}
              {step === 'confirm' && 'Konfirmasi topup Anda'}
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

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        {step === 'amount' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">Jumlah Topup</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(10000, parseInt(e.target.value, 10) || 0))}
                  className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-10 pr-3 text-sm font-medium text-ink placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-ink">Preset Amount</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      amount === preset
                        ? 'bg-primary-600 text-white'
                        : 'border border-surface-200 bg-white text-surface-600 hover:border-primary-300 hover:bg-primary-50',
                    )}
                  >
                    {(preset / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep('method')} className="w-full" variant="primary" size="sm">
              Lanjutkan
            </Button>
          </div>
        )}

        {step === 'method' && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              {[
                { id: 'GATEWAY', label: 'Payment Gateway', desc: 'Kartu kredit, debit, e-wallet' },
                { id: 'PAYPAL', label: 'PayPal', desc: 'Pembayaran via PayPal' },
                { id: 'TRANSFER', label: 'Transfer Bank', desc: 'Transfer langsung ke rekening admin' },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMethod(id as typeof method)
                    setStep('confirm')
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all',
                    method === id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300',
                  )}
                >
                  <CreditCard
                    className={cn('h-5 w-5', method === id ? 'text-primary-600' : 'text-surface-400')}
                  />
                  <div className="text-left">
                    <p className={cn('text-sm font-medium', method === id ? 'text-primary-700' : 'text-ink')}>
                      {label}
                    </p>
                    <p className="text-xs text-surface-500">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {method === 'TRANSFER' && (
              <div className="space-y-2 rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-900">Informasi Transfer</p>
                <div className="space-y-1 text-xs text-amber-800">
                  <p>Bank: BCA</p>
                  <p>Nomor Rekening: 1234567890</p>
                  <p>Atas Nama: PT IndoTeknizi</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setStep('amount')} className="flex-1" variant="outline" size="sm">
                Kembali
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1" variant="primary" size="sm">
                Lanjutkan
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-surface-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600">Jumlah Topup</span>
                <span className="font-semibold text-ink">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600">Metode</span>
                <span className="font-semibold text-ink">
                  {method === 'GATEWAY' && 'Payment Gateway'}
                  {method === 'PAYPAL' && 'PayPal'}
                  {method === 'TRANSFER' && 'Transfer Bank'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep('method')} className="flex-1" variant="outline" size="sm">
                Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Konfirmasi Topup'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
