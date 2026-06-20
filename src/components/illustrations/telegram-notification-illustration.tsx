'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Bell, PaperPlaneTilt, ShoppingCart, Wrench } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { TeknisiAvatar } from './avatars'

type Props = { className?: string }

type NotifItem = {
  id: string
  icon: 'order' | 'konsultasi' | 'inspeksi'
  title: string
  subtitle: string
  tone: string
}

const NOTIFICATIONS: NotifItem[] = [
  {
    id: 'order',
    icon: 'order',
    title: 'Pesanan marketplace baru',
    subtitle: 'ORD-0241 · Xiaomi 17 Pro',
    tone: 'from-emerald-500/15 to-emerald-50 border-emerald-200/80',
  },
  {
    id: 'konsultasi',
    icon: 'konsultasi',
    title: 'Request konsultasi',
    subtitle: 'Budi · Remote diagnosa HP',
    tone: 'from-primary-500/15 to-primary-50 border-primary-200/80',
  },
  {
    id: 'inspeksi',
    icon: 'inspeksi',
    title: 'Request inspeksi',
    subtitle: 'iPhone 13 · Mode offline',
    tone: 'from-cyan-500/15 to-cyan-50 border-cyan-200/80',
  },
]

const CYCLE_MS = 2800

function NotifIcon({ type }: { type: NotifItem['icon'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0'
  if (type === 'order') return <ShoppingCart className={cls} weight="fill" />
  if (type === 'konsultasi') return <Bell className={cls} weight="fill" />
  return <Wrench className={cls} weight="fill" />
}

/**
 * Animasi notifikasi Telegram ke teknisi — pesanan, konsultasi, inspeksi.
 */
export function TelegramNotificationIllustration({ className }: Props) {
  const reduced = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(1)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (reduced) return
    const tick = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= NOTIFICATIONS.length) {
          setPulse(true)
          setTimeout(() => setPulse(false), 600)
          return 1
        }
        setPulse(true)
        setTimeout(() => setPulse(false), 600)
        return c + 1
      })
    }, CYCLE_MS)
    return () => clearInterval(tick)
  }, [reduced])

  const visible = NOTIFICATIONS.slice(0, reduced ? NOTIFICATIONS.length : visibleCount)

  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-sky-200/70',
        'bg-gradient-to-br from-white via-sky-50/40 to-primary-50/30',
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="absolute -left-10 top-8 h-48 w-48 rounded-full bg-sky-300/35 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-8 bottom-4 h-44 w-44 rounded-full bg-primary-300/25 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* Bot → teknisi signal */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        fill="none"
        aria-hidden
      >
        <motion.path
          d="M 72 88 Q 160 60 280 120"
          stroke="url(#tg-signal)"
          strokeWidth="1.8"
          strokeDasharray="4 6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="tg-signal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {!reduced &&
          [0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              r="3"
              fill="#0ea5e9"
              animate={{ offsetDistance: ['0%', '100%'] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.65,
              }}
              style={{
                offsetPath: 'path("M 72 88 Q 160 60 280 120")',
                filter: 'drop-shadow(0 0 5px rgba(14,165,233,0.8))',
              }}
            />
          ))}
      </svg>

      {/* Bantoo bot badge */}
      <motion.div
        className="absolute left-[8%] top-[14%] flex items-center gap-2 rounded-2xl border border-sky-200/80 bg-white/90 px-3 py-2 shadow-soft-sm backdrop-blur-sm"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-white">
          <PaperPlaneTilt className="h-4 w-4" weight="fill" />
        </span>
        <div>
          <p className="text-[10px] font-bold text-ink">Bantoo Bot</p>
          <p className="text-[9px] text-surface-500">Mengirim alert…</p>
        </div>
      </motion.div>

      {/* Phone + teknisi */}
      <div className="absolute inset-x-0 bottom-[8%] top-[22%] flex items-end justify-center gap-4 px-[10%]">
        <motion.div
          animate={pulse ? { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] } : { scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <TeknisiAvatar size={52} online animated />
          <p className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-cyan-800">
            Teknisi
          </p>
        </motion.div>

        <motion.div
          className="relative w-[min(52%,200px)] rounded-[1.35rem] border-[3px] border-surface-800 bg-surface-900 p-1 shadow-soft-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="overflow-hidden rounded-[1.05rem] bg-[#17212b]">
            {/* Telegram header */}
            <div className="flex items-center gap-2 border-b border-white/5 bg-[#232e3c] px-2.5 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-sky-500">
                <PaperPlaneTilt className="h-3.5 w-3.5 text-white" weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-white">Bantoo Bot</p>
                <p className="text-[8px] text-sky-300">online</p>
              </div>
              <motion.span
                className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white"
                animate={{ scale: pulse ? [1, 1.2, 1] : 1 }}
              >
                {visible.length}
              </motion.span>
            </div>

            {/* Chat area */}
            <div className="flex min-h-[140px] flex-col gap-1.5 p-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((n, index) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: 24, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 28,
                      delay: index === visible.length - 1 ? 0 : 0,
                    }}
                    className={cn(
                      'rounded-xl border bg-gradient-to-br p-2 text-left shadow-sm',
                      n.tone,
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-sky-700">
                        <NotifIcon type={n.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold leading-tight text-ink">{n.title}</p>
                        <p className="mt-0.5 text-[8px] leading-snug text-surface-600">
                          {n.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Phone notch */}
          <div className="absolute left-1/2 top-1 h-1 w-10 -translate-x-1/2 rounded-full bg-surface-700" />
        </motion.div>
      </div>

      {/* Live badge */}
      <motion.div
        className="absolute right-[8%] top-[12%] inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 shadow-soft-xs"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live
      </motion.div>
    </div>
  )
}
