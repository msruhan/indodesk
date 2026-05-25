'use client'

import { motion } from 'framer-motion'
import { Cursor, ShieldCheck, Lightning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { TeknisiAvatar, UserAvatar } from './avatars'

type Props = { className?: string }

/**
 * Remote Online Illustration — refined.
 * User device on the left, teknisi device on the right, both topped with
 * cute avatars. A live cursor glides along an animated arc between them
 * with traveling data packets.
 */
export function RemoteOnlineIllustration({ className }: Props) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-surface-200/70',
        'bg-gradient-to-br from-white via-primary-50/40 to-cyan-50/30',
        className,
      )}
    >
      {/* Ambient blobs */}
      <motion.div
        aria-hidden
        className="absolute -left-16 -top-12 h-56 w-56 rounded-full bg-primary-300/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-cyan-300/30 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Subtle masked grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,118,110,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 50%, black 60%, transparent 100%)',
        }}
      />

      {/* SVG — connection arc + traveling packets */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="remote-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 110 175 Q 200 120 290 175"
          stroke="url(#remote-line)"
          strokeWidth="1.8"
          strokeDasharray="4 6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            r="3"
            fill="#10b981"
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.7,
            }}
            style={{
              offsetPath: 'path("M 110 175 Q 200 120 290 175")',
              filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.7))',
            }}
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
          />
        ))}
      </svg>

      {/* USER side (left) */}
      <motion.div
        className="absolute left-[6%] top-[18%] w-[40%]"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.6 },
          x: { duration: 0.6 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <DeviceCard
          avatar={<UserAvatar size={36} online />}
          name="Andi"
          role="User"
          tone="primary"
          activity={
            <div className="space-y-1">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-primary-300 to-primary-100"
                initial={{ width: '40%' }}
                animate={{ width: ['40%', '80%', '60%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="h-1.5 w-3/5 rounded-full bg-surface-100" />
              <div className="h-1.5 w-4/5 rounded-full bg-surface-100" />
            </div>
          }
        />
      </motion.div>

      {/* TEKNISI side (right) */}
      <motion.div
        className="absolute right-[6%] top-[18%] w-[40%]"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0, y: [0, 6, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.2 },
          x: { duration: 0.6, delay: 0.2 },
          y: { duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
        }}
      >
        <DeviceCard
          avatar={<TeknisiAvatar size={36} online />}
          name="Ahmad"
          role="Teknisi"
          tone="cyan"
          activity={
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[7px] text-primary-600">$</span>
                <motion.div
                  className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-100"
                  initial={{ width: '30%' }}
                  animate={{ width: ['30%', '70%', '50%', '90%'] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.4,
                  }}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[7px] text-primary-600">$</span>
                <div className="h-1.5 w-2/3 rounded-full bg-surface-100" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[7px] text-primary-600">$</span>
                <motion.div
                  className="h-1.5 w-3 rounded-full bg-cyan-400"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </div>
          }
        />
      </motion.div>

      {/* Live cursor traveling across */}
      <motion.div
        className="absolute z-10"
        style={{ top: '47%' }}
        initial={{ left: '14%', opacity: 0 }}
        animate={{
          left: ['14%', '82%', '82%', '14%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.4, 0.6, 1],
        }}
      >
        <div className="relative">
          <Cursor
            className="h-5 w-5 text-primary-700 drop-shadow-md"
            weight="fill"
          />
          <span className="absolute left-5 top-3 whitespace-nowrap rounded-md bg-primary-700 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md">
            Teknisi
          </span>
        </div>
      </motion.div>

      {/* Bottom status bar */}
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between rounded-xl border border-surface-200/80 bg-white/90 px-3 py-2 shadow-soft-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-700">
            Sesi Remote Aktif
          </span>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-surface-600">
            <ShieldCheck className="h-3 w-3 text-primary-600" weight="fill" />
            Encrypted
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-surface-600">
            <Lightning className="h-3 w-3 text-amber-500" weight="fill" />
            Low latency
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   DeviceCard — avatar header + screen activity preview
   ------------------------------------------------------------------------- */
function DeviceCard({
  avatar,
  name,
  role,
  tone,
  activity,
}: {
  avatar: React.ReactNode
  name: string
  role: string
  tone: 'primary' | 'cyan'
  activity: React.ReactNode
}) {
  const isPrimary = tone === 'primary'
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white/95 shadow-[0_18px_40px_-18px_rgba(15,118,110,0.35)] backdrop-blur-sm',
        isPrimary ? 'border-primary-200/80' : 'border-cyan-200/80',
      )}
    >
      {/* Header — avatar + name */}
      <div
        className={cn(
          'flex items-center gap-2 px-2.5 py-2',
          isPrimary
            ? 'bg-gradient-to-r from-primary-50 to-white'
            : 'bg-gradient-to-r from-cyan-50 to-white',
        )}
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold leading-tight text-ink">
            {name}
          </p>
          <p
            className={cn(
              'truncate text-[8.5px] font-bold uppercase leading-tight tracking-[0.14em]',
              isPrimary ? 'text-primary-700' : 'text-cyan-700',
            )}
          >
            {role}
          </p>
        </div>
        {/* Screen-share dot */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]',
            isPrimary
              ? 'bg-primary-100 text-primary-700'
              : 'bg-cyan-100 text-cyan-700',
          )}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          Live
        </span>
      </div>

      {/* Window controls */}
      <div className="border-t border-surface-100 bg-gradient-to-br from-surface-50 to-white p-2.5">
        <div className="mb-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isPrimary ? 'bg-primary-400' : 'bg-cyan-400',
            )}
          />
        </div>
        {activity}
      </div>
    </div>
  )
}
