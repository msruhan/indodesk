'use client'

import { motion } from 'framer-motion'

type TeknisiWelcomeCardProps = {
  name?: string
}

export function TeknisiWelcomeCard({ name = 'Teknisi' }: TeknisiWelcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-white via-primary-50/90 to-emerald-50 p-5 shadow-soft-sm sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-white/90 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl"
      />

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-700/80">
          Selamat datang kembali
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Halo,{' '}
          <span className="gradient-text font-bold">{name}</span>!
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-surface-600">
          Berikut ringkasan performa layanan, konsultasi, dan aktivitas Anda.
        </p>
      </div>
    </motion.div>
  )
}
