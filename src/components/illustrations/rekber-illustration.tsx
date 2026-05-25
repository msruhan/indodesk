'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Vault,
  CheckCircle,
  Lock,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { AdminAvatar, TeknisiAvatar, UserAvatar } from './avatars'

type Props = { className?: string }

/* Path strings — keep visuals & motion in sync. */
const ARC_USER_TO_VAULT = 'M 90 215 Q 145 110 200 95'
const ARC_VAULT_TO_TEKNISI = 'M 200 95 Q 255 110 310 215'

/* Cycle timing.
   Total cycle = 5s. Bill travel = 1.6s.
   First half: User → Vault. Second half: Vault → Teknisi.

   Per cycle, each bill animates with:
     - travel:   keyTimes 0 → 0.32 → 1, keyPoints 0 → 1 → 1
       (move along path in first 32% of cycle = 1.6s, then stay at end)
     - opacity:  0 → 1 (fade in) → 1 → 0 (fade out) → 0
*/
const CYCLE = 5
const TRAVEL = 1.6
const TRAVEL_RATIO = TRAVEL / CYCLE // 0.32
const STAGGER = 0.45
const PACKETS_PER_ARC = 3

const TRAVEL_KEY_TIMES = `0;${TRAVEL_RATIO};1`
const TRAVEL_KEY_POINTS = '0;1;1'
const OPACITY_VALUES = '0;1;1;0;0'
const OPACITY_KEY_TIMES = `0;0.04;${TRAVEL_RATIO - 0.04};${TRAVEL_RATIO};1`

/**
 * Rekber (Escrow) Illustration.
 * Money flows User → Admin Vault → Teknisi, looping forever.
 *
 * Path-following bills use native SVG SMIL `<animateMotion>` (reliable
 * across browsers, unlike CSS `offsetPath` with framer-motion).
 */
export function RekberIllustration({ className }: Props) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-amber-200/60',
        'bg-gradient-to-br from-white via-amber-50/30 to-primary-50/40',
        className,
      )}
    >
      {/* Ambient glows */}
      <motion.div
        aria-hidden
        className="absolute -left-12 top-1/3 h-52 w-52 rounded-full bg-primary-300/30 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-12 top-1/4 h-52 w-52 rounded-full bg-amber-300/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="rekber-arc-1" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="rekber-arc-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Static arcs */}
        <motion.path
          d={ARC_USER_TO_VAULT}
          stroke="url(#rekber-arc-1)"
          strokeWidth="2"
          strokeDasharray="5 6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d={ARC_VAULT_TO_TEKNISI}
          stroke="url(#rekber-arc-2)"
          strokeWidth="2"
          strokeDasharray="5 6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Stream of bills: User → Vault */}
        {Array.from({ length: PACKETS_PER_ARC }).map((_, i) => (
          <SmilMoneyBill
            key={`u2v-${i}`}
            path={ARC_USER_TO_VAULT}
            tone="held"
            delay={i * STAGGER}
          />
        ))}

        {/* Stream of bills: Vault → Teknisi (released) */}
        {Array.from({ length: PACKETS_PER_ARC }).map((_, i) => (
          <SmilMoneyBill
            key={`v2t-${i}`}
            path={ARC_VAULT_TO_TEKNISI}
            tone="released"
            delay={CYCLE / 2 + i * STAGGER}
          />
        ))}

        {/* Sparkle trail: User → Vault */}
        {Array.from({ length: 5 }).map((_, i) => (
          <SmilSparkleDot
            key={`spark-u2v-${i}`}
            path={ARC_USER_TO_VAULT}
            color="#fbbf24"
            delay={i * 0.2}
          />
        ))}

        {/* Sparkle trail: Vault → Teknisi */}
        {Array.from({ length: 5 }).map((_, i) => (
          <SmilSparkleDot
            key={`spark-v2t-${i}`}
            path={ARC_VAULT_TO_TEKNISI}
            color="#22d3ee"
            delay={CYCLE / 2 + i * 0.2}
          />
        ))}
      </svg>

      {/* USER node */}
      <motion.div
        className="absolute"
        style={{ left: '13%', bottom: '14%' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <NodeBlock label="User" color="primary">
          <UserAvatar size={56} online />
        </NodeBlock>
      </motion.div>

      {/* TEKNISI node */}
      <motion.div
        className="absolute"
        style={{ right: '13%', bottom: '14%' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <NodeBlock
          label="Teknisi"
          color="cyan"
          flashAt={(CYCLE / 2 + TRAVEL) / CYCLE}
          cycle={CYCLE}
          celebrate
        >
          <TeknisiAvatar size={56} online />
        </NodeBlock>
      </motion.div>

      {/* ADMIN VAULT */}
      <motion.div
        className="absolute left-1/2 top-[6%] -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.7, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <AdminAvatar size={48} online />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-amber-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-md">
              Admin
            </span>
          </div>

          <VaultReceiver cycle={CYCLE} travel={TRAVEL} />

          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.16em] text-amber-700 shadow-soft-xs ring-1 ring-inset ring-amber-200">
            Escrow Vault
          </span>
        </div>
      </motion.div>

      {/* Status pill cycling */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <CyclingStatus />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   SmilMoneyBill — bill that flows along an SVG path using SMIL.
   ------------------------------------------------------------------------- */
function SmilMoneyBill({
  path,
  tone,
  delay,
}: {
  path: string
  tone: 'held' | 'released'
  delay: number
}) {
  const fill = tone === 'held' ? '#10b981' : '#06b6d4'
  const stroke = tone === 'held' ? '#065f46' : '#155e75'
  const shadow =
    tone === 'held'
      ? 'drop-shadow(0 4px 10px rgba(16,185,129,0.55))'
      : 'drop-shadow(0 4px 10px rgba(6,182,212,0.55))'
  const begin = `${delay}s`

  return (
    <g style={{ filter: shadow }} opacity={0}>
      <rect x="-15" y="-9" width="30" height="18" rx="3" fill={fill} stroke={stroke} strokeWidth="0.6" />
      <rect x="-13" y="-7" width="26" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />
      <circle cx="0" cy="0" r="4.2" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <text
        x="0"
        y="2.5"
        fontSize="6.5"
        fontWeight="900"
        textAnchor="middle"
        fill="white"
        fontFamily="ui-sans-serif, system-ui"
      >
        Rp
      </text>
      <text x="-12" y="-4" fontSize="3.5" fontWeight="800" fill="rgba(255,255,255,0.85)">
        100
      </text>
      <text x="12" y="7" fontSize="3.5" fontWeight="800" fill="rgba(255,255,255,0.85)" textAnchor="end">
        100
      </text>

      {/* SMIL motion — moves along the arc, then waits at the end */}
      <animateMotion
        dur={`${CYCLE}s`}
        begin={begin}
        repeatCount="indefinite"
        path={path}
        rotate="0"
        calcMode="linear"
        keyTimes={TRAVEL_KEY_TIMES}
        keyPoints={TRAVEL_KEY_POINTS}
      />

      {/* SMIL opacity — fade in at start, hold, fade out near arrival */}
      <animate
        attributeName="opacity"
        dur={`${CYCLE}s`}
        begin={begin}
        repeatCount="indefinite"
        values={OPACITY_VALUES}
        keyTimes={OPACITY_KEY_TIMES}
      />
    </g>
  )
}

/* ---------------------------------------------------------------------------
   SmilSparkleDot — tiny coin trail, also using SMIL.
   ------------------------------------------------------------------------- */
function SmilSparkleDot({
  path,
  color,
  delay,
}: {
  path: string
  color: string
  delay: number
}) {
  const begin = `${delay}s`
  return (
    <g style={{ filter: `drop-shadow(0 0 4px ${color})` }} opacity={0}>
      <circle r="1.6" fill={color} />
      <animateMotion
        dur={`${CYCLE}s`}
        begin={begin}
        repeatCount="indefinite"
        path={path}
        rotate="0"
        calcMode="linear"
        keyTimes={TRAVEL_KEY_TIMES}
        keyPoints={TRAVEL_KEY_POINTS}
      />
      <animate
        attributeName="opacity"
        dur={`${CYCLE}s`}
        begin={begin}
        repeatCount="indefinite"
        values={OPACITY_VALUES}
        keyTimes={OPACITY_KEY_TIMES}
      />
    </g>
  )
}

/* ---------------------------------------------------------------------------
   VaultReceiver — flashes when bills arrive / are released.
   ------------------------------------------------------------------------- */
function VaultReceiver({ cycle, travel }: { cycle: number; travel: number }) {
  const arrivalAt = travel / cycle
  const releaseAt = 0.5

  return (
    <div className="relative">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute inset-0 rounded-2xl border-2 border-amber-300"
          animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Arrival flash (green) */}
      <motion.span
        aria-hidden
        className="absolute -inset-1 rounded-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.55) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0, 0, 0.9, 0, 0],
          scale: [0.7, 0.7, 1.25, 1.4, 1.4],
        }}
        transition={{
          duration: cycle,
          times: [0, Math.max(0, arrivalAt - 0.04), arrivalAt, Math.min(1, arrivalAt + 0.18), 1],
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Release flash (cyan) */}
      <motion.span
        aria-hidden
        className="absolute -inset-1 rounded-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(6,182,212,0.55) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0, 0, 0.85, 0, 0],
          scale: [0.7, 0.7, 1.2, 1.4, 1.4],
        }}
        transition={{
          duration: cycle,
          times: [0, releaseAt - 0.04, releaseAt, Math.min(1, releaseAt + 0.18), 1],
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      <motion.div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-[0_14px_30px_-10px_rgba(245,158,11,0.6)]"
        animate={{ scale: [1, 1, 1.08, 1, 1, 1.08, 1] }}
        transition={{
          duration: cycle,
          times: [
            0,
            Math.max(0, arrivalAt - 0.04),
            arrivalAt,
            Math.min(1, arrivalAt + 0.15),
            Math.max(0, releaseAt - 0.04),
            releaseAt,
            1,
          ],
          repeat: Infinity,
          ease: 'easeOut',
        }}
      >
        <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-amber-300/60 via-transparent to-transparent" />
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformPerspective: 600 }}
        >
          <Vault className="h-6 w-6 text-white drop-shadow-md" weight="fill" />
        </motion.div>

        <motion.div
          className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white shadow"
          animate={{ rotate: [0, 0, -25, 12, -8, 0, 0] }}
          transition={{
            duration: cycle,
            times: [
              0,
              Math.max(0, arrivalAt - 0.04),
              arrivalAt,
              Math.min(1, arrivalAt + 0.08),
              Math.min(1, arrivalAt + 0.16),
              Math.min(1, arrivalAt + 0.24),
              1,
            ],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Lock className="h-2.5 w-2.5 text-amber-600" weight="fill" />
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   NodeBlock — avatar + role chip with optional flash + sparkle burst.
   ------------------------------------------------------------------------- */
function NodeBlock({
  children,
  label,
  color,
  flashAt,
  cycle,
  celebrate = false,
}: {
  children: React.ReactNode
  label: string
  color: 'primary' | 'cyan' | 'amber'
  flashAt?: number
  cycle?: number
  celebrate?: boolean
}) {
  const ringClass =
    color === 'primary'
      ? 'ring-primary-200/70 bg-primary-50/40'
      : color === 'cyan'
        ? 'ring-cyan-200/70 bg-cyan-50/40'
        : 'ring-amber-200/70 bg-amber-50/40'
  const labelClass =
    color === 'primary'
      ? 'text-primary-700 ring-primary-200'
      : color === 'cyan'
        ? 'text-cyan-700 ring-cyan-200'
        : 'text-amber-700 ring-amber-200'
  const flashColor =
    color === 'primary'
      ? 'rgba(16,185,129,0.55)'
      : color === 'cyan'
        ? 'rgba(6,182,212,0.55)'
        : 'rgba(245,158,11,0.55)'

  const useFlash = flashAt !== undefined && cycle !== undefined

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn('relative rounded-full p-1 ring-1 ring-inset', ringClass)}>
        {children}

        {useFlash && (
          <motion.span
            aria-hidden
            className="absolute -inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${flashColor} 0%, transparent 70%)`,
            }}
            animate={{
              opacity: [0, 0, 0.9, 0, 0],
              scale: [0.85, 0.85, 1.25, 1.4, 1.4],
            }}
            transition={{
              duration: cycle!,
              times: [0, Math.max(0, flashAt! - 0.05), flashAt!, Math.min(1, flashAt! + 0.18), 1],
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {celebrate &&
          useFlash &&
          [0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * Math.PI * 2
            return (
              <motion.span
                key={i}
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.span
                  className="h-1 w-1 rounded-full bg-amber-400"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.9))' }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: [0, Math.cos(angle) * 36],
                    y: [0, Math.sin(angle) * 36],
                    opacity: [0, 0, 1, 0],
                    scale: [0, 0, 1.4, 0.6],
                  }}
                  transition={{
                    duration: cycle!,
                    times: [0, Math.max(0, flashAt! - 0.04), flashAt! + 0.05, Math.min(1, flashAt! + 0.28)],
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </motion.span>
            )
          })}
      </div>
      <span
        className={cn(
          'rounded-full bg-white/95 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.16em] shadow-soft-xs ring-1 ring-inset',
          labelClass,
        )}
      >
        {label}
      </span>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   CyclingStatus — escrow lifecycle pill
   ------------------------------------------------------------------------- */
const STATUSES = [
  { label: 'Dana ditahan', icon: Lock, color: 'amber' as const },
  { label: 'Dana dilepas', icon: CheckCircle, color: 'emerald' as const },
  { label: 'Transaksi aman', icon: ShieldCheck, color: 'cyan' as const },
]

const COLOR_CLASSES: Record<
  'amber' | 'emerald' | 'cyan',
  { ring: string; text: string; icon: string; bg: string }
> = {
  amber: {
    ring: 'ring-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    bg: 'bg-amber-50/95',
  },
  emerald: {
    ring: 'ring-primary-200',
    text: 'text-primary-700',
    icon: 'text-primary-600',
    bg: 'bg-primary-50/95',
  },
  cyan: {
    ring: 'ring-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-600',
    bg: 'bg-cyan-50/95',
  },
}

function CyclingStatus() {
  return (
    <div className="relative inline-flex h-7 items-center justify-center overflow-hidden">
      {STATUSES.map((status, i) => {
        const cls = COLOR_CLASSES[status.color]
        return (
          <motion.div
            key={status.label}
            className={cn(
              'absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] shadow-soft-xs ring-1 ring-inset',
              cls.bg,
              cls.text,
              cls.ring,
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [10, 0, 0, -10],
            }}
            transition={{
              duration: 5.4,
              times: [0, 0.1, 0.32, 0.42],
              delay: i * 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <status.icon className={cn('h-3 w-3', cls.icon)} weight="fill" />
            {status.label}
          </motion.div>
        )
      })}
    </div>
  )
}
