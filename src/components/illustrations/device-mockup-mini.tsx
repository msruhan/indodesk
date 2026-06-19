'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type PhoneMockupModel = 'iphone-12' | 'iphone-11' | 'android'

type Props = {
  model?: PhoneMockupModel
  className?: string
  /** Subtle float when illustration is in view */
  animate?: boolean
  delay?: number
  /** Card benchmark — ukuran tetap, tampilan lebih bersih */
  variant?: 'default' | 'card'
}

const MODELS: Record<
  PhoneMockupModel,
  {
    bezel: string
    bezelEdge: string
    screen: string
    screenGlow?: string
    notch: 'classic' | 'pill'
    buttonSide: string
  }
> = {
  'iphone-12': {
    bezel:
      'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]',
    bezelEdge: 'border-slate-300/80',
    screen: 'bg-gradient-to-br from-sky-400 via-primary-500 to-emerald-500',
    screenGlow: 'from-primary-400/30 via-transparent to-emerald-400/20',
    notch: 'pill',
    buttonSide: 'bg-slate-400/80',
  },
  'iphone-11': {
    bezel:
      'bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]',
    bezelEdge: 'border-neutral-600/70',
    screen: 'bg-gradient-to-br from-violet-700 via-purple-800 to-neutral-900',
    screenGlow: 'from-violet-500/20 via-transparent to-purple-600/15',
    notch: 'classic',
    buttonSide: 'bg-neutral-600/80',
  },
  android: {
    bezel:
      'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]',
    bezelEdge: 'border-neutral-700/70',
    screen: 'bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700',
    screenGlow: 'from-cyan-400/25 via-transparent to-teal-500/15',
    notch: 'pill',
    buttonSide: 'bg-neutral-600/80',
  },
}

/** Proporsi iPhone ~ 9 : 19.5 */
const CARD_PHONE_CLASS = 'h-[4.75rem] w-[2.2rem] sm:h-[5.25rem] sm:w-[2.45rem]'

function PhoneNotch({ type }: { type: 'classic' | 'pill' }) {
  if (type === 'pill') {
    return (
      <div className="absolute left-1/2 top-[5px] z-10 h-[5px] w-[18px] -translate-x-1/2 rounded-full bg-black/90 sm:top-1.5 sm:h-1.5 sm:w-5" />
    )
  }
  return (
    <div className="absolute left-1/2 top-[4px] z-10 h-[7px] w-[14px] -translate-x-1/2 rounded-b-md bg-black sm:top-1 sm:h-2 sm:w-4" />
  )
}

function CardPhoneBody({ cfg }: { cfg: (typeof MODELS)[PhoneMockupModel] }) {
  return (
    <>
      <span className={cn('absolute -right-px top-[24%] h-3 w-[1.5px] rounded-l-full', cfg.buttonSide)} />
      <span className={cn('absolute -left-px top-[20%] h-2 w-[1.5px] rounded-r-full', cfg.buttonSide)} />
      <span className={cn('absolute -left-px top-[32%] h-2.5 w-[1.5px] rounded-r-full', cfg.buttonSide)} />

      <div
        className={cn(
          'relative h-full w-full rounded-[11px] border-[1.5px] p-[2px] sm:rounded-[12px]',
          cfg.bezel,
          cfg.bezelEdge,
        )}
      >
        <div className={cn('relative h-full w-full overflow-hidden rounded-[9px] sm:rounded-[10px]', cfg.screen)}>
          <div
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-br',
              cfg.screenGlow ?? 'from-white/10 via-transparent to-black/20',
            )}
          />
          <PhoneNotch type={cfg.notch} />
          <div className="absolute inset-x-2 top-3 h-8 rounded-md bg-white/10 ring-1 ring-inset ring-white/15 sm:top-3.5 sm:h-9" />
          <div className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-white/50 sm:bottom-2.5" />
        </div>
      </div>

      <div className="absolute -bottom-1 left-1/2 h-1 w-[70%] -translate-x-1/2 rounded-full bg-black/10 blur-[2px]" />
    </>
  )
}

function DefaultPhoneBody({ cfg }: { cfg: (typeof MODELS)[PhoneMockupModel] }) {
  return (
    <>
      <span
        className={cn(
          'absolute -right-[2px] top-[22%] h-[14%] w-[2px] rounded-l-full',
          cfg.buttonSide,
        )}
      />
      <span
        className={cn(
          'absolute -left-[2px] top-[18%] h-[8%] w-[2px] rounded-r-full',
          cfg.buttonSide,
        )}
      />
      <span
        className={cn(
          'absolute -left-[2px] top-[30%] h-[12%] w-[2px] rounded-r-full',
          cfg.buttonSide,
        )}
      />

      <div
        className={cn(
          'relative h-full w-full rounded-[14px] border p-[2.5px] sm:rounded-[16px] sm:p-[3px]',
          cfg.bezel,
          cfg.bezelEdge,
        )}
      >
        <div className={cn('relative h-full w-full overflow-hidden rounded-[11px] sm:rounded-[13px]', cfg.screen)}>
          <div
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-br',
              cfg.screenGlow ?? 'from-white/10 via-transparent to-black/20',
            )}
          />

          {cfg.notch === 'classic' ? (
            <div className="absolute left-1/2 top-[3px] z-10 flex -translate-x-1/2 items-center gap-[3px] rounded-full bg-black px-[5px] py-[2px] sm:top-1 sm:px-1.5 sm:py-0.5">
              <span className="h-[3px] w-[3px] rounded-full bg-neutral-700 sm:h-1 sm:w-1" />
              <span className="h-[2.5px] w-[2.5px] rounded-full bg-neutral-800 sm:h-[3px] sm:w-[3px]" />
            </div>
          ) : (
            <div className="absolute left-1/2 top-[5px] z-10 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10 sm:top-1.5 sm:h-1.5 sm:w-1.5" />
          )}

          <div className="relative z-[1] flex items-center justify-between px-[6px] pt-[10px] sm:px-2 sm:pt-3">
            <span className="text-[5px] font-bold text-white/90 sm:text-[6px]">9:41</span>
            <div className="flex items-center gap-[2px]">
              <span className="h-[3px] w-[5px] rounded-[1px] bg-white/70 sm:h-1 sm:w-1.5" />
              <span className="h-[3px] w-[3px] rounded-full bg-white/70 sm:h-1 sm:w-1" />
              <span className="h-[3px] w-[6px] rounded-[1px] bg-white/90 sm:h-1 sm:w-2" />
            </div>
          </div>

          <div className="absolute inset-x-[5px] bottom-[14px] top-[22px] sm:inset-x-1.5 sm:bottom-4 sm:top-7">
            <div className="mb-[3px] h-[4px] w-[55%] rounded-full bg-white/25 sm:mb-1 sm:h-1" />
            <div className="grid grid-cols-2 gap-[3px] sm:gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[3px] bg-white/15 ring-1 ring-inset ring-white/10 sm:rounded sm:ring-white/15"
                />
              ))}
            </div>
            <div className="mt-[3px] space-y-[2px] sm:mt-1 sm:space-y-0.5">
              <div className="h-[3px] w-full rounded-full bg-white/20 sm:h-1" />
              <div className="h-[3px] w-2/3 rounded-full bg-white/15 sm:h-1" />
            </div>
          </div>

          <div className="absolute bottom-[3px] left-1/2 h-[2px] w-[28%] -translate-x-1/2 rounded-full bg-white/60 sm:bottom-1 sm:h-0.5" />
        </div>
      </div>

      <div className="absolute -bottom-[6%] left-1/2 h-[6px] w-[70%] -translate-x-1/2 rounded-full bg-black/15 blur-[3px] sm:h-2 sm:blur-sm" />
    </>
  )
}

/**
 * Compact phone mockup for illustration cards — CSS-only, no image assets.
 */
export function MiniPhoneMockup({
  model = 'iphone-12',
  className,
  animate = false,
  delay = 0,
  variant = 'default',
}: Props) {
  const cfg = MODELS[model]
  const isCard = variant === 'card'

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <motion.div
        className={cn('relative', isCard ? CARD_PHONE_CLASS : 'h-[82%] w-[44%] min-w-[52px] max-w-[72px]')}
        initial={animate ? { opacity: 0, scale: 0.92 } : undefined}
        animate={
          animate
            ? isCard
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: 1,
                  y: [0, -3, 0],
                  scale: 1,
                }
            : undefined
        }
        transition={
          animate
            ? isCard
              ? { opacity: { delay, duration: 0.45 }, scale: { delay, type: 'spring', stiffness: 300, damping: 24 } }
              : {
                  opacity: { delay, duration: 0.5 },
                  scale: { delay, type: 'spring', stiffness: 280, damping: 22 },
                  y: { delay: delay + 0.5, duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }
            : undefined
        }
      >
        {isCard ? <CardPhoneBody cfg={cfg} /> : <DefaultPhoneBody cfg={cfg} />}
      </motion.div>
    </div>
  )
}
