'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  MagnifyingGlass,
  Check,
  Star,
  DeviceMobile,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { TeknisiAvatar, UserAvatar } from './avatars'

type Props = { className?: string }

const checklistItems = [
  'Kondisi fisik',
  'Layar & touch',
  'Baterai',
  'Kamera & speaker',
]

/**
 * Inspection Illustration — refined.
 * User (left) requests an inspection of a phone. The teknisi (right) scans
 * the device and produces a verified report with checklist + rating.
 */
export function InspectionIllustration({ className }: Props) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-teal-200/70',
        'bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/40',
        className,
      )}
    >
      {/* Ambient blobs */}
      <motion.div
        aria-hidden
        className="absolute -left-12 -top-16 h-56 w-56 rounded-full bg-teal-300/40 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-cyan-300/40 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* Concentric scanning rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/50"
          style={{ width: 240, height: 240 }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.1, 1.5], opacity: [0.6, 0.25, 0] }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* USER (top-left) — requests inspection */}
      <motion.div
        className="absolute left-[5%] top-[7%] flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative">
          <UserAvatar size={42} online />
          {/* Speech bubble */}
          <motion.div
            className="absolute left-[110%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl rounded-bl-sm border border-surface-200/80 bg-white px-2 py-1 shadow-soft-xs"
            initial={{ opacity: 0, scale: 0.85, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[9px] font-semibold leading-tight text-ink">
              Cek dulu HP-nya?
            </p>
          </motion.div>
        </div>
        <span className="rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-primary-700 shadow-soft-xs ring-1 ring-inset ring-primary-200">
          User
        </span>
      </motion.div>

      {/* TEKNISI (bottom-right) — performs inspection */}
      <motion.div
        className="absolute bottom-[12%] right-[5%] flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="relative">
          <TeknisiAvatar size={42} online />
          {/* Magnifier orbiting */}
          <motion.div
            aria-hidden
            className="absolute -left-3 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-teal-300 bg-white shadow-md"
            animate={{
              x: [0, -3, 3, 0],
              y: [0, 3, -2, 0],
              rotate: [0, -10, 10, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MagnifyingGlass className="h-3 w-3 text-teal-700" weight="bold" />
          </motion.div>
        </div>
        <span className="rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-cyan-700 shadow-soft-xs ring-1 ring-inset ring-cyan-200">
          Teknisi
        </span>
      </motion.div>

      {/* DEVICE (centered) — being inspected */}
      <motion.div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotateY: [-6, 6, -6], rotateX: [2, -2, 2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformPerspective: 800 }}
      >
        <div className="relative">
          {/* Phone shell */}
          <div className="relative h-[170px] w-[100px] rounded-[22px] border border-surface-300/70 bg-gradient-to-br from-surface-900 to-surface-950 p-1.5 shadow-[0_24px_48px_-16px_rgba(13,148,136,0.45)]">
            <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-teal-500 via-cyan-500 to-primary-600">
              {/* Notch */}
              <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/40" />

              {/* Inner mock screen */}
              <div className="absolute inset-2 top-4 rounded-xl bg-white/95 p-2">
                <div className="mb-1.5 h-1 w-8 rounded-full bg-teal-200" />
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-full bg-surface-100" />
                  <div className="h-1 w-3/4 rounded-full bg-surface-100" />
                  <div className="h-1 w-2/3 rounded-full bg-surface-100" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-md bg-gradient-to-br from-teal-100 to-cyan-100"
                    />
                  ))}
                </div>
              </div>

              {/* Soft scanning beam */}
              <motion.div
                aria-hidden
                className="absolute inset-x-0 h-12"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(1px)',
                }}
                initial={{ top: '-15%' }}
                animate={{ top: ['-15%', '105%'] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.4,
                }}
              />
              <motion.div
                aria-hidden
                className="absolute inset-x-0 h-[2px] bg-white shadow-[0_0_18px_4px_rgba(255,255,255,0.8)]"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%'] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.4,
                }}
              />
            </div>
          </div>

          {/* Verified badge below */}
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1], y: [10, 0, 0] }}
            transition={{
              duration: 0.8,
              delay: 1.4,
              ease: [0.16, 1, 0.3, 1],
              repeat: Infinity,
              repeatDelay: 2.2,
            }}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_18px_-4px_rgba(13,148,136,0.5)]">
              <ShieldCheck className="h-3 w-3" weight="fill" />
              Verified
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* CHECKLIST card (top-right) */}
      <motion.div
        className="absolute right-3 top-3 w-[40%] sm:right-4 sm:top-4 sm:w-[36%]"
        initial={{ opacity: 0, y: -10, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <div className="rounded-2xl border border-teal-200/80 bg-white/90 p-2.5 shadow-[0_18px_40px_-18px_rgba(13,148,136,0.4)] backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
              <ShieldCheck className="h-3 w-3" weight="fill" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-teal-700">
              Checklist
            </p>
          </div>
          <ul className="space-y-1.5">
            {checklistItems.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-center gap-1.5 text-[10px]"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 1, 0.3] }}
                transition={{
                  duration: 5,
                  delay: i * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <motion.span
                  className="inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full"
                  initial={{ backgroundColor: 'rgb(241,245,249)' }}
                  animate={{
                    backgroundColor: [
                      'rgb(241,245,249)',
                      'rgb(20,184,166)',
                      'rgb(20,184,166)',
                      'rgb(241,245,249)',
                    ],
                  }}
                  transition={{
                    duration: 5,
                    delay: i * 0.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Check className="h-2 w-2 text-white" weight="bold" />
                </motion.span>
                <span className="truncate font-semibold text-ink">{item}</span>
              </motion.li>
            ))}
          </ul>
          {/* Score */}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-teal-50/70 px-2 py-1">
            <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-teal-700">
              Skor
            </span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 1.6 + i * 0.1,
                    type: 'spring',
                    stiffness: 320,
                  }}
                >
                  <Star className="h-2.5 w-2.5 text-amber-400" weight="fill" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tag bottom-left */}
      <div className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full border border-teal-200/70 bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 shadow-soft-xs backdrop-blur-sm">
        <DeviceMobile className="h-2.5 w-2.5" weight="fill" />
        HP / Laptop
      </div>
    </div>
  )
}
