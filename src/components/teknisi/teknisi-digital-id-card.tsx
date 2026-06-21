'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  buildTeknisiCardNumber,
  buildTeknisiCardValidity,
  type TeknisiDigitalIdSource,
} from '@/lib/teknisi-digital-id'
import {
  Award,
  CheckCircle,
  RefreshCw,
  Shield,
  Sparkles,
} from '@/lib/icons'

const BANTOO_CARD_ICON = '/icon/iconbantoo.png'

export function TeknisiDigitalIdCard({ teknisi }: { teknisi: TeknisiDigitalIdSource }) {
  const ref = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glowX = useMotionValue(0.5)
  const glowY = useMotionValue(0.5)
  const sRotX = useSpring(rotateX, { stiffness: 220, damping: 18 })
  const sRotY = useSpring(rotateY, { stiffness: 220, damping: 18 })

  const idNumber = useMemo(() => buildTeknisiCardNumber(teknisi.id), [teknisi.id])

  const { memberSince, validThruLabel, validRangeLabel } = useMemo(
    () => buildTeknisiCardValidity(teknisi.memberSinceAt),
    [teknisi.memberSinceAt],
  )

  const holoBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) =>
      `conic-gradient(from ${(gx as number) * 360}deg at ${(gx as number) * 100}% ${(gy as number) * 100}%, rgba(255,255,255,0.0) 0deg, rgba(255,255,255,0.35) 40deg, rgba(110,231,183,0.35) 90deg, rgba(255,255,255,0.0) 180deg, rgba(165,243,252,0.4) 270deg, rgba(255,255,255,0) 360deg)`,
  )

  return (
    <div className="rounded-2xl border border-surface-200/70 bg-white p-3 shadow-soft-sm sm:rounded-3xl sm:p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5 sm:items-end">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-700 sm:text-[10px] sm:tracking-[0.16em]">
            Digital ID
          </p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-ink sm:mt-1 sm:text-xl md:text-2xl">
            Teknisi Card
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-surface-200/70 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-surface-600 transition-colors hover:border-primary-200 hover:text-primary-700 sm:px-2.5 sm:py-1 sm:text-[10px]"
        >
          <RefreshCw className="h-3 w-3" />
          Flip
        </button>
      </div>

      {/* Card stage */}
      <div className="relative" style={{ perspective: 1400 }}>
        <motion.div
          ref={ref}
          onMouseMove={(e) => {
            const rect = ref.current?.getBoundingClientRect()
            if (!rect) return
            const px = (e.clientX - rect.left) / rect.width
            const py = (e.clientY - rect.top) / rect.height
            rotateY.set((px - 0.5) * 18)
            rotateX.set(-(py - 0.5) * 18)
            glowX.set(px)
            glowY.set(py)
          }}
          onMouseLeave={() => { rotateX.set(0); rotateY.set(0) }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            rotateX: sRotX,
            rotateY: flipped ? 180 : sRotY,
            transformStyle: 'preserve-3d',
            transformPerspective: 1400,
          }}
          className="relative aspect-[1.586/1] w-full"
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <CardFront
              teknisi={teknisi}
              idNumber={idNumber}
              memberSince={memberSince}
              validThruLabel={validThruLabel}
              holoBg={holoBg}
            />
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardBack
              teknisi={teknisi}
              idNumber={idNumber}
              validRangeLabel={validRangeLabel}
            />
          </div>
        </motion.div>

        {/* Floor reflection */}
        <div className="pointer-events-none mx-6 mt-2 h-6 rounded-[50%] bg-gradient-to-b from-primary-500/20 to-transparent blur-md" />
      </div>

      <div className="mt-3 hidden items-center justify-center gap-1.5 text-[10px] font-medium text-surface-500 sm:mt-4 sm:flex">
        <Sparkles className="h-3 w-3 text-primary-600" weight="fill" />
        <span>Dipersembahkan oleh Bantoo · Hover untuk efek 3D</span>
      </div>
    </div>
  )
}

/* ============================================================================
   ID CARD — FRONT
   ========================================================================== */
function CardFront({
  teknisi,
  idNumber,
  memberSince,
  validThruLabel,
  holoBg,
}: {
  teknisi: TeknisiDigitalIdSource
  idNumber: string
  memberSince: number
  validThruLabel: string
  holoBg: MotionValue<string>
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Base mesh gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.95), transparent 55%), radial-gradient(circle at 80% 70%, rgba(8,145,178,0.85), transparent 55%), linear-gradient(135deg,#022c22 0%,#064e3b 38%,#065f46 70%,#0f766e 100%)',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Holographic shimmer */}
      <motion.div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: holoBg }} />

      {/* Animated noise sweep */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 -inset-x-1/2 opacity-40"
        style={{
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
        }}
        animate={{ x: ['-10%', '110%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Embossed grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Decorative chip + curves */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 252" fill="none">
        <defs>
          <linearGradient id="cardArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M 0 200 Q 200 120 400 220" stroke="url(#cardArc)" strokeWidth="1" fill="none" />
        <path d="M -20 240 Q 200 160 420 250" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" fill="none" />
      </svg>

      {/* CONTENT */}
      <div className="relative flex h-full flex-col p-4 text-white sm:p-5" style={{ transform: 'translateZ(40px)' }}>
        {/* Header — logo + chip */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
              <Image
                src={BANTOO_CARD_ICON}
                alt="Bantoo"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-none">
              <p className="text-[7px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">Bantoo</p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">Verified Technician</p>
            </div>
          </div>

          {/* Chip */}
          <div className="relative h-7 w-9 overflow-hidden rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-inner">
            <div className="absolute inset-1 rounded-sm bg-gradient-to-br from-amber-200/60 to-amber-700/40" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Name + role */}
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Cardholder</p>
          <p className="mt-0.5 truncate text-[15px] font-black tracking-tight sm:text-base">{teknisi.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-emerald-100/90">
            {teknisi.specialty.slice(0, 2).join(' · ') || 'Teknisi profesional'}
          </p>
        </div>

        {/* ID number */}
        <div className="mt-2.5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Card Number</p>
          <p className="mt-0.5 font-mono text-[12px] font-bold tracking-[0.18em] sm:text-[13px]">{idNumber}</p>
        </div>

        {/* Footer — member since + valid until + tier */}
        <div className="mt-2.5 flex items-end justify-between">
          <div className="flex gap-3">
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Member</p>
              <p className="text-[10px] font-bold tabular-nums">{memberSince}</p>
            </div>
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Valid Thru</p>
              <p className="text-[10px] font-bold tabular-nums">{validThruLabel}</p>
            </div>
          </div>

          {/* Tier badge */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-amber-950 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.7)]"
          >
            <Award className="mr-1 inline h-2.5 w-2.5" weight="fill" />
            {teknisi.badge === 'top-teknisi' ? 'Elite' : teknisi.isVerified ? 'Pro' : 'Member'}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   ID CARD — BACK
   ========================================================================== */
function CardBack({
  teknisi,
  idNumber,
  validRangeLabel,
}: {
  teknisi: TeknisiDigitalIdSource
  idNumber: string
  validRangeLabel: string
}) {
  // Generate deterministic barcode pattern from idNumber (Code 128-like vertical bars)
  const barcodeBars = useMemo(() => {
    const seed = idNumber.replace(/[^A-Z0-9]/g, '')
    const bars: { w: number; black: boolean }[] = []
    for (let i = 0; i < 56; i += 1) {
      const code = seed.charCodeAt(i % seed.length)
      const w = (code % 3) + 1
      bars.push({ w, black: i % 2 === 0 })
    }
    return bars
  }, [idNumber])

  // Generate deterministic mini QR-like pixel matrix (12x12)
  const qrMatrix = useMemo(() => {
    const seed = idNumber.replace(/[^A-Z0-9]/g, '')
    const size = 12
    const grid: boolean[][] = []
    for (let r = 0; r < size; r += 1) {
      const row: boolean[] = []
      for (let c = 0; c < size; c += 1) {
        const code = seed.charCodeAt((r * size + c) % seed.length)
        row.push((code + r * 7 + c * 3) % 2 === 0)
      }
      grid.push(row)
    }
    return grid
  }, [idNumber])

  // Generate deterministic signature path from name
  const signaturePath = useMemo(() => {
    const seed = teknisi.name.charCodeAt(0) || 65
    const flow = (seed % 5) / 10
    return `M 4 22 C ${10 + flow * 4} ${4 + flow * 2}, ${20 - flow * 3} ${30 - flow * 2}, 30 18 S ${42 + flow} ${4 + flow}, 52 16 S ${66 - flow * 2} ${28 - flow}, 78 12 S ${94 + flow * 2} 22, 110 18`
  }, [teknisi.name])

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22]">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Glossy diagonal sheen */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 -inset-x-1/2 opacity-25"
        style={{
          background: 'linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)',
        }}
        animate={{ x: ['-10%', '110%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* MAGNETIC STRIPE — top, slim */}
      <div className="absolute inset-x-0 top-2 h-[10%] bg-gradient-to-b from-black via-neutral-900 to-black/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.5)]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      </div>

      {/* CONTENT — flex column, evenly distributed */}
      <div className="relative flex h-full flex-col px-3.5 pb-2.5 pt-[13%] text-white sm:px-4">
        {/* BARCODE — Code 128 style */}
        <div className="rounded-sm bg-white/95 px-2 py-1 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <div className="flex h-5 items-stretch gap-0">
            {barcodeBars.map((bar, idx) => (
              <span
                key={idx}
                style={{ width: `${bar.w}px`, flexShrink: 0 }}
                className={cn('h-full', bar.black ? 'bg-neutral-900' : 'bg-transparent')}
              />
            ))}
          </div>
          <p className="mt-0.5 text-center font-mono text-[6.5px] font-bold tracking-[0.32em] text-neutral-800">
            {idNumber}
          </p>
        </div>

        {/* SIGNATURE + QR ROW */}
        <div className="mt-2.5 flex items-stretch gap-3">
          {/* Inline signature — no white card */}
          <div className="relative flex flex-1 flex-col justify-between">
            {/* Top label */}
            <div className="flex items-center justify-between">
              <p className="text-[6.5px] font-bold uppercase tracking-[0.22em] text-emerald-200/70">
                Authorized Signature
              </p>
              <p className="font-mono text-[6.5px] font-semibold tracking-[0.16em] text-emerald-200/50">
                NO. {idNumber.slice(-7)}
              </p>
            </div>

            {/* Signature stroke — compact, white */}
            <div className="relative flex h-7 items-end px-1">
              <svg viewBox="0 0 116 22" className="h-5 w-full" preserveAspectRatio="xMidYMid meet">
                <motion.path
                  d={signaturePath}
                  fill="none"
                  stroke="rgba(255,255,255,0.92)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                />
                <motion.path
                  d="M 88 16 L 106 18"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 1.8 }}
                />
              </svg>
            </div>

            {/* Underline divider */}
            <div className="mt-0.5 border-t border-dashed border-white/20" />

            {/* Bottom name + cvv on dark card directly */}
            <div className="mt-1 flex items-center justify-between">
              <p className="truncate font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-white">
                {teknisi.name}
              </p>
              <p className="font-mono text-[7px] font-bold tracking-[0.16em] text-emerald-200/80">
                CVV{' '}
                {((idNumber.charCodeAt(idNumber.length - 1) || 0) % 900 + 100)
                  .toString()
                  .padStart(3, '0')}
              </p>
            </div>
          </div>

          {/* QR + hologram */}
          <div className="flex flex-col items-center justify-between gap-1">
            <div className="relative h-[58px] w-[58px] overflow-hidden rounded-sm bg-white p-1 shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
              <div className="grid h-full w-full grid-cols-12 grid-rows-12 gap-0">
                {qrMatrix.flat().map((black, idx) => (
                  <span key={idx} className={cn(black ? 'bg-neutral-900' : 'bg-white')} />
                ))}
              </div>
              <div className="absolute left-1 top-1 h-3 w-3 border-[1.5px] border-neutral-900 bg-white">
                <div className="m-[2px] h-[5px] w-[5px] bg-neutral-900" />
              </div>
              <div className="absolute right-1 top-1 h-3 w-3 border-[1.5px] border-neutral-900 bg-white">
                <div className="m-[2px] h-[5px] w-[5px] bg-neutral-900" />
              </div>
              <div className="absolute bottom-1 left-1 h-3 w-3 border-[1.5px] border-neutral-900 bg-white">
                <div className="m-[2px] h-[5px] w-[5px] bg-neutral-900" />
              </div>
            </div>

            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="relative h-4 w-4 overflow-hidden rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #f0abfc, #a5f3fc, #fde68a, #bbf7d0, #f0abfc)',
                boxShadow: '0 0 6px rgba(255,255,255,0.4), inset 0 0 3px rgba(0,0,0,0.2)',
              }}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/60 to-transparent" />
              <CheckCircle className="absolute inset-0 m-auto h-2.5 w-2.5 text-white drop-shadow" weight="fill" />
            </motion.div>
          </div>
        </div>


        {/* DISCLAIMER + AUTHENTIC STRIP — combined with breathing room */}
        <div className="mt-auto pb-1.5">
          <p className="text-[6.5px] leading-[1.5] text-emerald-100/70">
            <span className="font-bold uppercase tracking-[0.18em] text-emerald-200/90">Notice — </span>
            This card is issued by{' '}
            <span className="font-semibold text-white">Bantoo Indonesia</span> as proof of verified
            technician membership. It remains the sole property of{' '}
            <span className="font-semibold text-white">Bantoo</span>. Misuse or unauthorized
            transfer is prohibited.
          </p>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-1.5">
            <p className="font-mono text-[6.5px] uppercase tracking-[0.32em] text-emerald-200/40">
              VALID {validRangeLabel}
            </p>
            <div className="inline-flex items-center gap-0.5 rounded-sm bg-emerald-500/15 px-1 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-emerald-200">
              <Shield className="h-2 w-2" weight="fill" />
              Authentic
            </div>
            <p className="font-mono text-[6.5px] uppercase tracking-[0.32em] text-emerald-200/40">
              bantoo.in
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
