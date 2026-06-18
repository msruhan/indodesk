'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTopup } from '@/contexts/topup-context'
import { ArrowRight, Clock, FileText, Headphones } from '@/lib/icons'
import { formatIDR } from '@/lib/topup-utils'

export default function CekTransaksiPage() {
  const router = useRouter()
  const { history, getOrder } = useTopup()
  const [code, setCode] = useState('')
  const [pollToken, setPollToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Masukkan kode order')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const stored = getOrder(trimmed)
      const token = pollToken.trim() || stored?.pollToken
      const query = token ? `?token=${encodeURIComponent(token)}` : ''
      const res = await fetch(`/api/topup/orders/${encodeURIComponent(trimmed)}${query}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(
          json.code === 'TOPUP_POLL_FORBIDDEN'
            ? 'Akses ditolak. Login sebagai pemilik order atau masukkan kode akses dari halaman order.'
            : (json.error ?? 'Kode order tidak ditemukan'),
        )
        return
      }
      const dest = token
        ? `/topup/order/${trimmed}?token=${encodeURIComponent(token)}`
        : `/topup/order/${trimmed}`
      router.push(dest)
    } catch {
      setError('Gagal memeriksa order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-12 pt-5 sm:px-6 lg:pt-28">
        <Link href="/topup" className="mb-3 inline-flex items-center gap-1 text-[12px] text-surface-500 hover:text-ink">
          ← Kembali ke top up
        </Link>

        <section className="rounded-2xl border border-surface-200/70 bg-white p-5 shadow-soft-sm sm:p-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 text-[11px] font-medium text-primary-700">
            <FileText className="h-3 w-3" />
            Lookup order
          </span>
          <h1 className="mt-3 text-balance text-xl font-semibold tracking-tightest text-ink sm:text-2xl">
            Cek status transaksi
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-surface-600">
            Masukkan kode order (contoh TT-XXXXXX-2026) untuk melihat status fulfillment dari database.
          </p>

          <form onSubmit={(e) => void submit(e)} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                placeholder="TT-XXXXXX-2026"
                className="h-11 font-mono uppercase tracking-wide"
                autoComplete="off"
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-[11px] text-rose-600"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="flex-1">
              <Input
                value={pollToken}
                onChange={(e) => {
                  setPollToken(e.target.value)
                  setError(null)
                }}
                placeholder="Kode akses (opsional jika sudah login)"
                className="h-11 font-mono text-sm"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="h-11 sm:flex-shrink-0"
              disabled={loading}
            >
              {loading ? 'Memeriksa…' : 'Cek status'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-3 text-[11px] text-surface-500">
            <Headphones className="mr-1 inline h-3 w-3 align-text-top text-primary-600" />
            Kode hilang? Hubungi customer service kami via chat — siap 24 jam.
          </p>
        </section>

        {history.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-surface-600">
              <Clock className="h-3 w-3" />
              Transaksi terakhir di perangkat ini
            </h2>
            <ul className="space-y-2">
              {history.slice(0, 5).map((entry) => (
                <li key={entry.orderCode}>
                  <Link
                    href={
                      entry.pollToken
                        ? `/topup/order/${entry.orderCode}?token=${encodeURIComponent(entry.pollToken)}`
                        : `/topup/order/${entry.orderCode}`
                    }
                    className="flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-white px-3 py-2.5 transition-all hover:border-primary-300 hover:shadow-soft-xs"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12px] font-bold text-ink">{entry.orderCode}</p>
                      <p className="truncate text-[11px] text-surface-500">
                        {entry.productName} · {entry.denominationLabel}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-primary-700 tabular-nums">
                        {formatIDR(entry.total)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-surface-500">
                        {entry.status === 'completed' ? 'selesai' : entry.status === 'failed' ? 'gagal' : 'proses'}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
