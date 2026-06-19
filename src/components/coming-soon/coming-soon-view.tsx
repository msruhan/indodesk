'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/brand/brand-logo'
import { AuroraBackground } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import {
  DEFAULT_COMING_SOON_CONFIG,
  getCountdownParts,
  type ComingSoonConfig,
} from '@/lib/coming-soon-shared'
import { SUPPORT_EMAIL } from '@/lib/legal-content'
import { cn } from '@/lib/utils'
import { Mail, Sparkles } from '@/lib/icons'

type ComingSoonViewProps = {
  initialConfig?: ComingSoonConfig
  supportEmail?: string
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

function CountdownUnit({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  const display = String(value).padStart(2, '0')

  return (
    <div
      className={cn(
        'group relative flex min-w-[4.5rem] flex-col items-center overflow-hidden rounded-2xl border px-3 py-4 sm:min-w-[5.5rem] sm:px-4 sm:py-5',
        accent
          ? 'border-primary-200/80 bg-gradient-to-b from-white/95 to-primary-50/60 shadow-glow-primary'
          : 'border-white/60 bg-white/75 shadow-soft backdrop-blur-md',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
      />
      <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink sm:text-4xl">
        {display}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-surface-500 sm:text-[11px]">
        {label}
      </span>
    </div>
  )
}

export function ComingSoonView({
  initialConfig = DEFAULT_COMING_SOON_CONFIG,
  supportEmail = SUPPORT_EMAIL,
}: ComingSoonViewProps) {
  const [config, setConfig] = useState(initialConfig)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    void fetch('/api/public/coming-soon')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setConfig(json.data)
      })
      .catch(() => {})
  }, [])

  const countdown = useMemo(
    () => getCountdownParts(config.launchAt, now),
    [config.launchAt, now],
  )

  const launchLabel = config.launchAt
    ? new Date(config.launchAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-surface-50">
      <AuroraBackground intensity="vivid" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_55%)]"
      />

      <header className="relative z-10 flex items-center justify-center px-6 pt-10 sm:pt-14">
        <BrandLogo
          variant="wordmark"
          size="default"
          wordmarkClassName="h-20 scale-[1.2] sm:h-24 sm:scale-[1.25] sm:max-w-[24rem]"
        />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:py-14">
        <motion.div
          className="flex flex-col items-center"
          initial="initial"
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
          }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <Badge variant="outline" className="border-primary-200/80 bg-white/70 px-3 py-1 text-primary-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Soft Launch
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            {config.headline}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-surface-600 sm:text-lg"
          >
            {config.message}
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 w-full"
          >
            {countdown.isComplete ? (
              <div className="mx-auto max-w-md rounded-2xl border border-primary-200/70 bg-white/80 px-6 py-5 shadow-soft backdrop-blur-md">
                <p className="text-sm font-semibold text-primary-700">Peluncuran hampir tiba</p>
                <p className="mt-1 text-sm text-surface-600">
                  Tim kami sedang menyelesaikan persiapan terakhir. Kembali lagi sebentar lagi.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <CountdownUnit label="Hari" value={countdown.days} accent />
                <CountdownUnit label="Jam" value={countdown.hours} />
                <CountdownUnit label="Menit" value={countdown.minutes} />
                <CountdownUnit label="Detik" value={countdown.seconds} />
              </div>
            )}
          </motion.div>

          {launchLabel ? (
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-sm text-surface-500"
            >
              Target peluncuran:{' '}
              <span className="font-medium text-surface-700">{launchLabel}</span>
            </motion.p>
          ) : null}

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface-400">
              Butuh bantuan?
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-surface-200/80 bg-white/80 px-5 py-2.5 text-sm font-medium text-ink shadow-soft transition hover:border-primary-200 hover:text-primary-700"
            >
              <Mail className="h-4 w-4 text-primary-600" />
              {supportEmail}
            </a>
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-surface-400">
        <p>© {new Date().getFullYear()} Bantoo · Marketplace & ekosistem teknisi HP</p>
      </footer>
    </div>
  )
}
