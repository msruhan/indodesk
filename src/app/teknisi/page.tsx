'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import {
  AnimatedNumber,
  SpotlightCard,
  staggerContainerFast,
  viewportRevealNoBlur,
} from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  Search,
  Star,
  MessageCircle,
  Radio,
  CheckCircle,
  Award,
} from '@/lib/icons'

interface Teknisi {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  badge: 'newbie' | 'verified' | 'top-teknisi'
  specialty: string[]
  price: number
}

const mockTeknisi: Teknisi[] = [
  { id: '1', name: 'Ahmad Hidayat', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.9, reviewCount: 234, totalKonsultasi: 567, totalView: 1234, badge: 'top-teknisi', specialty: ['Unlock', 'Flashing', 'Root'], price: 50000 },
  { id: '2', name: 'Budi Santoso', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.7, reviewCount: 189, totalKonsultasi: 342, totalView: 892, badge: 'verified', specialty: ['Hardware Repair', 'Screen Replacement'], price: 75000 },
  { id: '3', name: 'Siti Nurhaliza', avatar: '/api/placeholder/80/80', isOnline: false, rating: 4.8, reviewCount: 156, totalKonsultasi: 289, totalView: 654, badge: 'verified', specialty: ['Software', 'Virus Removal'], price: 45000 },
  { id: '4', name: 'Rudi Hartono', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.5, reviewCount: 98, totalKonsultasi: 145, totalView: 321, badge: 'newbie', specialty: ['Basic Repair'], price: 35000 },
  { id: '5', name: 'Dewi Lestari', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.9, reviewCount: 312, totalKonsultasi: 678, totalView: 1890, badge: 'top-teknisi', specialty: ['Data Recovery', 'Backup'], price: 80000 },
  { id: '6', name: 'Eko Prasetyo', avatar: '/api/placeholder/80/80', isOnline: false, rating: 4.6, reviewCount: 201, totalKonsultasi: 398, totalView: 987, badge: 'verified', specialty: ['Water Damage', 'Board Repair'], price: 95000 },
  { id: '7', name: 'Fajar Pratama', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.8, reviewCount: 178, totalKonsultasi: 412, totalView: 1056, badge: 'verified', specialty: ['Unlock', 'Software'], price: 60000 },
  { id: '8', name: 'Maya Sari', avatar: '/api/placeholder/80/80', isOnline: true, rating: 4.7, reviewCount: 142, totalKonsultasi: 256, totalView: 743, badge: 'verified', specialty: ['Screen Replacement'], price: 65000 },
]

const badgeConfig = {
  newbie: { label: 'Newbie', tone: 'info' as const, icon: Award },
  verified: { label: 'Verified', tone: 'success' as const, icon: CheckCircle },
  'top-teknisi': { label: 'Top', tone: 'warning' as const, icon: Award },
}

type SortKey = 'relevance' | 'rating' | 'price-low' | 'price-high'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Relevansi' },
  { value: 'rating', label: 'Rating' },
  { value: 'price-low', label: 'Harga ↑' },
  { value: 'price-high', label: 'Harga ↓' },
]

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const compactNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toString()

export default function TeknisiListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOnline, setFilterOnline] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('relevance')

  const filteredTeknisi = mockTeknisi
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesOnline = !filterOnline || t.isOnline
      return matchesSearch && matchesOnline
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        default:
          // relevance: online first, then rating
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
          return b.rating - a.rating
      }
    })

  const onlineCount = mockTeknisi.filter((t) => t.isOnline).length

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Header — desktop only (mobile gets a tighter inline header) */}
      <div className="hidden border-b border-surface-200/60 bg-white/70 backdrop-blur-md lg:block lg:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="mb-2 text-3xl font-semibold tracking-tightest text-ink lg:text-4xl">
            Daftar Teknisi Online
          </h1>
          <p className="text-surface-600">
            Konsultasi langsung dengan teknisi handphone berpengalaman.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        {/* Mobile heading */}
        <div className="mb-4 lg:hidden">
          <h1 className="text-2xl font-semibold tracking-tightest text-ink">
            Daftar Teknisi
          </h1>
          <p className="mt-1 text-sm text-surface-600">
            Konsultasi langsung dengan teknisi berpengalaman.
          </p>
        </div>

        {/* Search + filter row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              type="text"
              placeholder="Cari teknisi atau spesialisasi…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-11"
            />
          </div>
          <button
            onClick={() => setFilterOnline(!filterOnline)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all duration-300 ease-out-expo',
              filterOnline
                ? 'border border-transparent bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow-primary hover:shadow-glow-primary-lg'
                : 'border border-surface-200/80 bg-white/80 text-surface-700 backdrop-blur-md hover:border-surface-300 hover:text-ink',
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-70',
                  filterOnline ? 'animate-ping bg-white' : 'bg-primary-400',
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  filterOnline ? 'bg-white' : 'bg-primary-500',
                )}
              />
            </span>
            <Radio className="h-4 w-4" />
            Hanya Online
          </button>
        </div>

        {/* Status + sort */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
            <span className="font-medium text-surface-700">
              <span className="text-ink tabular-nums">{onlineCount}</span> teknisi online sekarang
              <span className="text-surface-400"> · {filteredTeknisi.length} hasil</span>
            </span>
          </div>

          {/* Sort segmented control */}
          <div className="relative inline-flex h-9 items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
            {sortOptions.map((opt) => {
              const active = sortBy === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    'relative z-10 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-300',
                    active ? 'text-ink' : 'text-surface-500 hover:text-ink',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="teknisi-sort-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-white shadow-soft-xs ring-1 ring-inset ring-surface-200/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid — 2 / 2 / 3 / 4 / 4 — 8 cards visible on lg+ as 4×2 */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
        >
          {filteredTeknisi.map((t) => {
            const cfg = badgeConfig[t.badge]
            const visibleSpecs = t.specialty.slice(0, 2)
            const overflowSpecs = t.specialty.length - visibleSpecs.length

            return (
              <motion.div key={t.id} variants={viewportRevealNoBlur} className="min-w-0">
                <Link
                  href={`/teknisi/${t.id}`}
                  className="block focus:outline-none focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2"
                >
                  <SpotlightCard tone="primary" className="flex h-full flex-col p-4">
                    {/* Header: avatar + identity + badge */}
                    <div className="mb-3 flex items-start gap-2.5">
                      <div className="relative flex-shrink-0">
                        <img
                          src={`https://i.pravatar.cc/150?img=${parseInt(t.id)}`}
                          alt={t.name}
                          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-soft-xs ring-1 ring-surface-200/70"
                          loading="lazy"
                        />
                        {t.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500 shadow-soft-xs" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold tracking-tight-lg text-ink transition-colors group-hover/spot:text-primary-700">
                          {t.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
                          <Star
                            weight="fill"
                            className="h-3 w-3 flex-shrink-0 text-amber-400"
                          />
                          <span className="font-semibold text-ink tabular-nums">
                            {t.rating.toFixed(1)}
                          </span>
                          <span className="truncate">· {t.reviewCount} ulasan</span>
                        </div>
                      </div>
                      <Badge variant={cfg.tone} className="flex-shrink-0 px-1.5 py-0.5 text-[10px]">
                        <cfg.icon className="h-2.5 w-2.5" />
                        <span className="ml-0.5">{cfg.label}</span>
                      </Badge>
                    </div>

                    {/* Specialty chips */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {visibleSpecs.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-surface-700 backdrop-blur-sm"
                        >
                          {spec}
                        </span>
                      ))}
                      {overflowSpecs > 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 ring-1 ring-inset ring-primary-200/70">
                          +{overflowSpecs}
                        </span>
                      )}
                    </div>

                    {/* Stat strip */}
                    <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-surface-200/60 bg-gradient-to-br from-surface-50/60 to-white p-2.5">
                      <div className="text-center">
                        <AnimatedNumber
                          value={t.totalKonsultasi}
                          className="block text-sm font-semibold text-ink tabular-nums"
                        />
                        <p className="text-[10px] uppercase tracking-[0.14em] text-surface-500">
                          Konsultasi
                        </p>
                      </div>
                      <div className="border-l border-surface-200/70 text-center">
                        <span className="block text-sm font-semibold text-ink tabular-nums">
                          {compactNumber(t.totalView)}
                        </span>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-surface-500">
                          Dilihat
                        </p>
                      </div>
                    </div>

                    {/* Price + CTA pinned to bottom */}
                    <div className="mt-auto">
                      <div className="mb-2.5 flex items-baseline justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-surface-500">
                          Mulai dari
                        </span>
                        <span className="text-base font-semibold tracking-tight-lg text-primary-700 tabular-nums">
                          {formatPrice(t.price)}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <Button
                          variant={t.isOnline ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={!t.isOnline}
                          className={cn(
                            'h-9 flex-1 px-3 text-xs',
                            !t.isOnline && 'cursor-not-allowed text-surface-500',
                          )}
                        >
                          {t.isOnline ? 'Konsultasi' : 'Offline'}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="h-9 w-9 flex-shrink-0"
                          aria-label="Chat"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Empty state */}
        {filteredTeknisi.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <Search className="h-6 w-6 text-surface-400" />
            </div>
            <p className="text-sm font-medium text-ink">Belum ada teknisi yang cocok</p>
            <p className="mt-1 text-sm text-surface-500">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          </div>
        )}
      </div>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
