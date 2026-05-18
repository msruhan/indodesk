'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Laptop, MessageCircle, Store, Wallet } from '@/lib/icons'

const heroActionBtn =
  'h-8 gap-1.5 border-0 px-3.5 text-xs font-semibold shadow-soft-md transition-[background-color,transform] hover:-translate-y-px'

type TeknisiWelcomeCardProps = {
  name?: string
}

export function TeknisiWelcomeCard({ name = 'Teknisi' }: TeknisiWelcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-5 text-white shadow-glow-primary sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%)] bg-[length:20px_20px] opacity-30"
      />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
          Selamat datang kembali
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          Halo, {name}! 👋
        </h2>
        <p className="mt-1 text-[13px] text-white/80">
          Berikut ringkasan performa layanan, konsultasi, dan aktivitas Anda.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/teknisi/konsultasi">
            <Button
              size="sm"
              className={cn(heroActionBtn, 'bg-white text-primary-800 hover:bg-primary-50')}
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary-600" />
              Konsultasi
            </Button>
          </Link>
          <Link href="/teknisi/remote">
            <Button
              size="sm"
              className={cn(
                heroActionBtn,
                'bg-cyan-50 text-cyan-950 ring-1 ring-inset ring-cyan-200/80 hover:bg-cyan-100',
              )}
            >
              <Laptop className="h-3.5 w-3.5 text-cyan-700" />
              Remote
            </Button>
          </Link>
          <Link href="/teknisi/saldo">
            <Button
              size="sm"
              className={cn(
                heroActionBtn,
                'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200/80 hover:bg-amber-100',
              )}
            >
              <Wallet className="h-3.5 w-3.5 text-amber-700" />
              Kelola Saldo
            </Button>
          </Link>
          <Link href="/teknisi/toko">
            <Button
              size="sm"
              className={cn(
                heroActionBtn,
                'bg-white/15 text-white ring-1 ring-inset ring-white/25 hover:bg-white/25',
              )}
            >
              <Store className="h-3.5 w-3.5" />
              Toko
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
