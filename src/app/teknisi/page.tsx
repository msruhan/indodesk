'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import type { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { buildServiceTabs } from '@/lib/section-tab-config'
import { useFeatureFlags } from '@/contexts/feature-flags-context'
import { useAuth } from '@/contexts/auth-context'
import { canAccessCariTeknisi } from '@/lib/platform-settings-shared'
import { PageHero } from '@/components/shared/page-hero'
import {
  SpotlightCard,
  staggerContainerFast,
  viewportRevealNoBlur,
} from '@/components/motion'
import { cn } from '@/lib/utils'
import { teknisiProfilePath } from '@/lib/teknisi-profile-slug'
import { openTeknisiChat } from '@/lib/open-teknisi-chat'
import type { PublicTeknisiDto } from '@/lib/teknisi-public'
import { TEKNISI_BADGE_DISPLAY, type TeknisiBadgeTier } from '@/lib/teknisi-badge'
import { useChat } from '@/contexts/chat-context'
import {
  Search,
  Star,
  MessageCircle,
  Radio,
  CheckCircle,
  Award,
  Users,
} from '@/lib/icons'
import { InspectionBadge } from '@/components/teknisi/inspection-badge'
import { FilterGroupSheet } from '@/components/ui/filter-group-sheet'

const badgeConfig: Record<
  TeknisiBadgeTier,
  { label: string; tone: 'info' | 'success' | 'warning'; icon: typeof Award }
> = {
  newbie: { label: TEKNISI_BADGE_DISPLAY.newbie.shortLabel, tone: 'info', icon: Award },
  verified: { label: TEKNISI_BADGE_DISPLAY.verified.shortLabel, tone: 'success', icon: CheckCircle },
  'top-teknisi': { label: TEKNISI_BADGE_DISPLAY['top-teknisi'].shortLabel, tone: 'warning', icon: Award },
}

type SortKey = 'relevance' | 'rating' | 'price-low' | 'price-high'
type OnlineFilter = 'online' | 'offline' | 'all'
type InspectionFilter = 'all' | 'inspection'

const onlineFilterOptions = [
  { id: 'online' as const, label: 'Online' },
  { id: 'offline' as const, label: 'Offline' },
  { id: 'all' as const, label: 'Semua' },
]

const inspectionFilterOptions = [
  { id: 'all' as const, label: 'Semua teknisi' },
  { id: 'inspection' as const, label: 'Bisa inspeksi' },
]

const sortFilterOptions = [
  { id: 'relevance' as const, label: 'Relevansi' },
  { id: 'rating' as const, label: 'Rating' },
  { id: 'price-low' as const, label: 'Harga terendah' },
  { id: 'price-high' as const, label: 'Harga tertinggi' },
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
  const router = useRouter()
  const { data: session, status } = useSession()
  const { user, isLoading: authLoading } = useAuth()
  const { openChatWithPeer } = useChat()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const role = (user?.role as 'ADMIN' | 'TEKNISI' | 'USER' | undefined) ?? null
  const allowed = canAccessCariTeknisi(role, flags)
  const guardLoading = authLoading || flagsLoading
  const tabs = buildServiceTabs(role, flags)
  const [teknisiList, setTeknisiList] = useState<PublicTeknisiDto[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineFilter, setOnlineFilter] = useState<OnlineFilter>('online')
  const [inspectionFilter, setInspectionFilter] = useState<InspectionFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('relevance')

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/teknisi')
        const json = (await res.json()) as { success?: boolean; data?: PublicTeknisiDto[] }
        if (json.success && json.data) {
          setTeknisiList(json.data)
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingList(false)
      }
    })()
  }, [])

  const handleOpenChat = (teknisiUserId: string) => {
    openTeknisiChat({
      teknisiUserId,
      isAuthenticated: status === 'authenticated',
      role: (session?.user?.role as UserRole | undefined) ?? 'USER',
      openChatWithPeer,
      navigate: router.push,
    })
  }

  const filteredTeknisi = teknisiList
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesOnline =
        onlineFilter === 'all' ||
        (onlineFilter === 'online' ? t.isOnline : !t.isOnline)
      const matchesInspection =
        inspectionFilter === 'all' || (inspectionFilter === 'inspection' && t.providesInspection)
      return matchesSearch && matchesOnline && matchesInspection
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

  const onlineCount = teknisiList.filter((t) => t.isOnline).length

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <p className="text-sm text-surface-500">Memeriksa akses…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-surface-50">
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <section className="relative flex min-h-[60vh] items-center justify-center px-4 lg:pt-28">
          <div className="max-w-md rounded-2xl border border-surface-200/70 bg-white/90 p-8 text-center shadow-soft-md backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Cari Teknisi tidak tersedia</h2>
            <p className="mt-2 text-sm text-surface-600">
              Halaman daftar teknisi sedang dinonaktifkan oleh admin.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button variant="primary" size="sm" onClick={() => router.push('/')}>
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </section>
        <MobileSafeAreaSpacer />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs, layoutId: 'service-section-tab' }}
        badge={{ icon: Radio, label: 'Teknisi online' }}
        title={
          <>
            Daftar teknisi handphone,
            <span className="block">
              <span className="gradient-text-static">konsultasi cepat</span> & terpercaya.
            </span>
          </>
        }
        description="Konsultasi langsung dengan teknisi berpengalaman. Filter teknisi online dan urutkan sesuai kebutuhan."
        right={
          <div className="flex items-center gap-2 text-[12px] text-surface-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
            <span className="font-medium">
              <span className="text-ink tabular-nums">{onlineCount}</span> online
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Search + filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
              <Input
                type="text"
                placeholder="Cari teknisi atau spesialisasi…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-11"
              />
            </div>
            <FilterGroupSheet
              groups={[
                {
                  id: 'online',
                  label: 'Status',
                  value: onlineFilter,
                  onChange: (value) => setOnlineFilter(value as OnlineFilter),
                  options: onlineFilterOptions,
                },
                {
                  id: 'inspection',
                  label: 'Inspeksi',
                  value: inspectionFilter,
                  onChange: (value) => setInspectionFilter(value as InspectionFilter),
                  options: inspectionFilterOptions,
                },
                {
                  id: 'sort',
                  label: 'Urutkan',
                  value: sortBy,
                  onChange: (value) => setSortBy(value as SortKey),
                  options: sortFilterOptions,
                },
              ]}
              onReset={() => {
                setOnlineFilter('online')
                setInspectionFilter('all')
                setSortBy('relevance')
              }}
            />
          </div>

          <div className="text-sm font-medium text-surface-700">
            Menampilkan <span className="font-bold text-primary-600">{filteredTeknisi.length}</span> teknisi
          </div>
        </div>
      </PageHero>

      <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">

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
                  <SpotlightCard
                    tone="primary"
                    disableSpotlight
                    className="flex h-full flex-col p-3 sm:p-4 [&_[data-slot=teknisi-cta]]:relative [&_[data-slot=teknisi-cta]]:z-20"
                  >
                    {/* Header: avatar + name + rating */}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            t.image ??
                            `https://i.pravatar.cc/150?u=${encodeURIComponent(t.userId)}`
                          }
                          alt={t.name}
                          className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-soft-xs ring-1 ring-surface-200/70"
                          loading="lazy"
                        />
                        {t.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-primary-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-semibold leading-tight text-ink line-clamp-1">
                          {t.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-surface-500">
                          <Star weight="fill" className="h-2.5 w-2.5 flex-shrink-0 text-amber-400" />
                          <span className="font-semibold text-ink tabular-nums">{t.rating.toFixed(1)}</span>
                          <span>({t.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge row — primary status + optional inspection capability */}
                    <div className="mb-2 flex flex-wrap items-center gap-1">
                      <Badge variant={cfg.tone} className="px-1.5 py-0.5 text-[9px]">
                        <cfg.icon className="h-2.5 w-2.5" />
                        <span className="ml-0.5">{cfg.label}</span>
                      </Badge>
                      {t.providesInspection && <InspectionBadge size="xs" animated={false} />}
                    </div>

                    {/* Specialty chips */}
                    <div className="mb-2 flex flex-wrap gap-1">
                      {visibleSpecs.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-surface-700"
                        >
                          {spec}
                        </span>
                      ))}
                      {overflowSpecs > 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary-700 ring-1 ring-inset ring-primary-200/70">
                          +{overflowSpecs}
                        </span>
                      )}
                    </div>

                    {/* Compact stats — single line */}
                    <div className="mb-2 flex items-center gap-3 text-[10px] text-surface-500">
                      <span className="tabular-nums"><span className="font-semibold text-ink">{compactNumber(t.totalKonsultasi)}</span> sesi</span>
                      <span className="tabular-nums"><span className="font-semibold text-ink">{compactNumber(t.totalView)}</span> dilihat</span>
                    </div>

                    {/* Price + CTA pinned to bottom */}
                    <div className="mt-auto">
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-surface-500">
                          Mulai
                        </span>
                        <span className="text-[14px] font-bold tracking-tight text-primary-700 tabular-nums">
                          {formatPrice(t.price)}
                        </span>
                      </div>

                      <div data-slot="teknisi-cta" className="relative z-20 flex gap-1.5">
                        <Button
                          asChild
                          variant="primary"
                          size="sm"
                          className="h-8 min-h-8 flex-1 px-2 text-[11px]"
                        >
                          <Link
                            href={teknisiProfilePath(t.profileSlug, t.userId)}
                            prefetch
                            className="inline-flex w-full items-center justify-center"
                          >
                            Lihat Profil
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="h-8 w-8 flex-shrink-0"
                          aria-label={`Chat dengan ${t.name}`}
                          onClick={() => handleOpenChat(t.userId)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>

        {loadingList && (
          <p className="py-12 text-center text-sm text-surface-500">Memuat daftar teknisi...</p>
        )}

        {/* Empty state */}
        {!loadingList && filteredTeknisi.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <Search className="h-6 w-6 text-ink-muted" strokeWidth={2} aria-hidden />
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
