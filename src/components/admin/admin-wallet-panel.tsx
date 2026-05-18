'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, X, TrendingUp, TrendingDown } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface WalletUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'TEKNISI'
  balance: string
  updatedAt: string
}

function AdjustBalanceModal({
  user,
  onClose,
  onSuccess,
}: {
  user: WalletUser | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'ADD' | 'DEDUCT'>('ADD')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) return null

  const handleSubmit = async () => {
    if (!amount || !reason.trim()) {
      setError('Jumlah dan alasan harus diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount,
          type,
          reason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Gagal menyesuaikan saldo')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
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
            <h3 className="text-lg font-semibold text-ink">Sesuaikan Saldo</h3>
            <p className="mt-0.5 text-xs text-surface-500">{user.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink">Tipe Transaksi</label>
            <div className="flex gap-2">
              {[
                { id: 'ADD', label: 'Tambah Saldo', icon: TrendingUp },
                { id: 'DEDUCT', label: 'Kurangi Saldo', icon: TrendingDown },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setType(id as typeof type)}
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-lg border-2 p-2 transition-all',
                    type === id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300',
                  )}
                >
                  <Icon className={cn('h-4 w-4', type === id ? 'text-primary-600' : 'text-surface-400')} />
                  <span className={cn('text-xs font-medium', type === id ? 'text-primary-700' : 'text-ink')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-ink">Jumlah (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-500">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-10 pr-3 text-sm font-medium text-ink placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-ink">Alasan</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Bonus referral, Refund order, dll"
              className="h-20 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-ink placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={loading || !amount}
              onClick={handleSubmit}
            >
              {loading ? 'Memproses...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AdminWalletPanel() {
  const [q, setQ] = useState('')
  const [wallets, setWallets] = useState<WalletUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null)

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/wallet')
      const data = await res.json()
      if (data.success) {
        setWallets(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch wallets:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const filtered = wallets.filter(
    (w) =>
      !q.trim() ||
      w.name.toLowerCase().includes(q.toLowerCase()) ||
      w.email.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari user atau email..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat...' : `${filtered.length} user dengan wallet`}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {/* Wallet List */}
      {!loading && (
        <div className="space-y-2">
          {filtered.map((wallet, idx) => {
            const balance = parseFloat(wallet.balance)
            const formattedBalance = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(balance)

            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-sm font-bold text-primary-700">
                        {wallet.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink">{wallet.name}</p>
                          <Badge
                            variant={wallet.role === 'TEKNISI' ? 'info' : 'default'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {wallet.role === 'TEKNISI' ? 'Teknisi' : 'User'}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-surface-500">{wallet.email}</p>
                        <p className="mt-1 text-[12px] font-semibold text-primary-700">{formattedBalance}</p>
                      </div>
                      <button
                        type="button"
                        title="Sesuaikan Saldo"
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-400 hover:bg-primary-50 hover:text-primary-600"
                        onClick={() => setSelectedUser(wallet)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-ink">Tidak ada user ditemukan</p>
              <p className="mt-1 text-xs text-surface-500">Coba ubah pencarian Anda</p>
            </div>
          )}
        </div>
      )}

      {/* Adjust Balance Modal */}
      <AnimatePresence>
        {selectedUser && (
          <AdjustBalanceModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSuccess={fetchWallets}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
