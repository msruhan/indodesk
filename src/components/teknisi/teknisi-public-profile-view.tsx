'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  animate,
  type MotionValue,
} from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { KonsultasiBookingDialog } from '@/components/teknisi/konsultasi-booking-dialog'
import { InspectionBookingDialog } from '@/components/inspection/inspection-booking-dialog'
import type { InspectionMode } from '@prisma/client'
import { TeknisiDigitalIdCard } from '@/components/teknisi/teknisi-digital-id-card'
import { TeknisiReviewsSection } from '@/components/teknisi/teknisi-reviews-section'
import { InspectionBadge } from '@/components/teknisi/inspection-badge'
import { useChat } from '@/contexts/chat-context'
import { openTeknisiChat } from '@/lib/open-teknisi-chat'
import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import { resolvePortfolioIcon, type TeknisiPortfolioItemDto } from '@/lib/teknisi-portfolio'
import type { TeknisiCertificationItemDto } from '@/lib/teknisi-certification'
import type { TeknisiConsultationService } from '@/lib/konsultasi-services'
import { allProfileSkills } from '@/lib/teknisi-profile-content'
import { getProfileSummaryFields } from '@/lib/teknisi-profile-display'
import { formatOperatingHoursLines } from '@/lib/store-operating-hours'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Heart,
  Laptop,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Radio,
  RefreshCw,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from '@/lib/icons'

const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const compactNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toLocaleString('id-ID')

const ease = [0.22, 1, 0.36, 1] as const
const fadeUp = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }
const fadeRight = { hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } } }

type Props = { teknisiId: string }

export function TeknisiPublicProfileView({ teknisiId }: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openChatWithPeer } = useChat()
  const [teknisi, setTeknisi] = useState<PublicTeknisiDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<TeknisiConsultationService | null>(null)
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('ONLINE')
  const [inspectionLockMode, setInspectionLockMode] = useState(false)
  const [inspectionSuccessId, setInspectionSuccessId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -50])
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.98])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const detailRes = await fetch(`/api/teknisi/${teknisiId}`)
        const detailJson = await detailRes.json()
        if (cancelled) return
        if (!detailRes.ok || !detailJson.success) {
          setError(detailJson.error ?? 'Teknisi tidak ditemukan')
          setTeknisi(null)
          return
        }
        setTeknisi(detailJson.data)
      } catch {
        if (!cancelled) setError('Gagal memuat profil teknisi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [teknisiId])

  const openBooking = (svc?: TeknisiConsultationService) => {
    if (svc?.kind === 'inspection-online' || svc?.kind === 'inspection-offline') {
      if (status !== 'authenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/teknisi/${teknisiId}`)}`)
        return
      }
      setInspectionMode(svc.kind === 'inspection-online' ? 'ONLINE' : 'OFFLINE')
      setInspectionLockMode(true)
      setInspectionOpen(true)
      return
    }

    setSelectedService(svc ?? null)
    setBookingOpen(true)
  }

  const handleOpenChat = () => {
    if (!teknisi) return
    openTeknisiChat({
      teknisiUserId: teknisi.id,
      isAuthenticated: status === 'authenticated',
      role: (session?.user?.role as UserRole | undefined) ?? 'USER',
      openChatWithPeer,
      navigate: router.push,
    })
  }

  const handleShare = async () => {
    const url = typeof window === 'undefined' ? '' : window.location.href
    if (!url) return
    try {
      if (navigator.share && teknisi) {
        await navigator.share({ title: `Profil ${teknisi.name}`, url })
        return
      }
      await navigator.clipboard?.writeText(url)
    } catch {
      // optional
    }
  }

  const profileSkills = useMemo(
    () =>
      teknisi
        ? allProfileSkills(teknisi.specialty, teknisi.secondarySkills)
        : [],
    [teknisi],
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-surface-50 via-white to-primary-50/40">
      <AmbientOrbs />

      <div className="hidden lg:block">
        <Navbar />
      </div>

      <section className="relative overflow-hidden pb-12 lg:pt-28">
        <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8">
          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <Card className="mx-auto max-w-md">
              <CardContent className="py-10 text-center">
                <Wrench className="mx-auto mb-3 h-8 w-8 text-surface-400" />
                <p className="text-sm font-medium text-ink">{error}</p>
                <Link href="/teknisi" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
                  Lihat teknisi lain
                </Link>
              </CardContent>
            </Card>
          )}

          {teknisi && !loading && (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid items-start gap-6 lg:grid-cols-[1fr_380px]"
            >
              {/* LEFT COLUMN — flows continuously, no gap */}
              <div className="min-w-0 space-y-6">
                <motion.div variants={fadeUp} style={{ y: heroY, scale: heroScale }}>
                  <ProfileHero
                    teknisi={teknisi}
                    saved={saved}
                    onSave={() => setSaved((value) => !value)}
                    onShare={() => void handleShare()}
                    onChat={handleOpenChat}
                    onBook={() => openBooking()}
                  />
                </motion.div>

                <motion.div variants={fadeUp}>
                  <AboutSection teknisi={teknisi} />
                </motion.div>

                <motion.div variants={fadeUp}>
                  <SkillsConstellation skills={profileSkills} />
                </motion.div>

                <motion.div variants={fadeUp}>
                  <PerformanceLedger teknisi={teknisi} />
                </motion.div>

                {teknisi.services.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <ServicesMenu services={teknisi.services} onSelect={openBooking} />
                  </motion.div>
                )}

                {teknisi.portfolio.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <SectionCard eyebrow="Bukti Karya" title="Portofolio & Highlight Kasus">
                      <div className="grid gap-3 md:grid-cols-3">
                        {teknisi.portfolio.map((item, idx) => (
                          <PortfolioCard key={`${item.title}-${idx}`} item={item} idx={idx} />
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                <motion.div variants={fadeUp}>
                  <TeknisiReviewsSection teknisi={teknisi} />
                </motion.div>
              </div>

              {/* RIGHT SIDEBAR — sticky stack */}
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <motion.div variants={fadeRight}>
                  <BookingSummary teknisi={teknisi} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <TeknisiDigitalIdCard teknisi={teknisi} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <TrustPanel teknisi={teknisi} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <AvailabilityPanel teknisi={teknisi} />
                </motion.div>
                {teknisi.certifications.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <CertificationsPanel certifications={teknisi.certifications} />
                  </motion.div>
                )}
                {teknisi.linkedStore && (
                  <motion.div variants={fadeUp}>
                    <LinkedStoreCard teknisi={teknisi} />
                  </motion.div>
                )}
              </aside>
            </motion.div>
          )}
        </div>
      </section>

      <div className="lg:hidden">
        <BottomNav />
        <MobileSafeAreaSpacer />
      </div>

      {teknisi && (
        <KonsultasiBookingDialog
          teknisi={teknisi}
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          initialService={selectedService}
        />
      )}

      {teknisi && (
        <InspectionBookingDialog
          teknisi={teknisi}
          open={inspectionOpen}
          onClose={() => setInspectionOpen(false)}
          initialMode={inspectionMode}
          lockMode={inspectionLockMode}
          onSuccess={(orderId) => setInspectionSuccessId(orderId)}
        />
      )}

      {inspectionSuccessId && (
        <div className="fixed bottom-24 left-4 right-4 z-[90] mx-auto max-w-md rounded-2xl border border-primary-200 bg-white p-4 shadow-soft-lg sm:bottom-8">
          <p className="text-sm font-semibold text-ink">Permintaan inspeksi berhasil!</p>
          <p className="mt-1 text-xs text-surface-500">Anda tetap di halaman profil teknisi.</p>
          <motion.div className="mt-3 flex gap-2">
            <Link
              href={`/user/inspeksi/${inspectionSuccessId}`}
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'flex-1 justify-center')}
            >
              Lihat permintaan
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={() => setInspectionSuccessId(null)}>
              Tutup
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ============================================================================
   AMBIENT ORBS
   ========================================================================== */
function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 top-20 h-[28rem] w-[28rem] rounded-full bg-primary-300/30 blur-[120px]"
        animate={{ x: [0, 50, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-32 top-72 h-[28rem] w-[28rem] rounded-full bg-accent-300/30 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-[100px]"
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* ============================================================================
   LOADING SKELETON
   ========================================================================== */
function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="h-[460px] animate-pulse rounded-3xl bg-gradient-to-br from-white to-surface-100/80 shadow-soft-sm" />
      <div className="h-[460px] animate-pulse rounded-3xl bg-gradient-to-br from-white to-surface-100/80 shadow-soft-sm" />
    </div>
  )
}

/* ============================================================================
   FLOATING SPARKLES — for hero cover
   ========================================================================== */
function FloatingSparkles() {
  const items = [
    { top: '18%', left: '12%', delay: 0, size: 14 },
    { top: '60%', left: '30%', delay: 1.4, size: 11 },
    { top: '32%', left: '68%', delay: 2.6, size: 13 },
    { top: '70%', left: '85%', delay: 0.7, size: 10 },
    { top: '15%', left: '50%', delay: 1.9, size: 12 },
  ]
  return (
    <>
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute text-white/70"
          style={{ top: s.top, left: s.left }}
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.25, 0.8], rotate: [0, 180, 360] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        >
          <Sparkles style={{ width: s.size, height: s.size }} weight="fill" />
        </motion.div>
      ))}
    </>
  )
}

/* ============================================================================
   ABOUT SECTION
   ========================================================================== */
function AboutSection({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const summary = getProfileSummaryFields(teknisi)
  const summaryCards = [
    { label: 'Issue handled', value: summary.issuesHandled },
    { label: 'Brand focus', value: summary.brandFocus },
    { label: 'Work approach', value: summary.workApproach },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))
  const scopeItems = [
    ...teknisi.serviceScope,
    ...(teknisi.languages.length > 0
      ? [`Bahasa: ${teknisi.languages.join(', ')}`]
      : []),
  ]

  return (
    <SectionCard eyebrow="Profil Profesional" title="Tentang Teknisi">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          {teknisi.description ? (
            <p className="text-sm leading-relaxed text-surface-600">{teknisi.description}</p>
          ) : (
            <p className="text-sm leading-relaxed text-surface-500">
              {teknisi.specialty.length > 0
                ? `${teknisi.name} adalah teknisi spesialis ${teknisi.specialty.join(', ')}.`
                : `${teknisi.name} belum melengkapi deskripsi profil.`}
            </p>
          )}
          {summaryCards.length > 0 && (
            <div className="grid gap-3">
              {summaryCards.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-surface-200/70 bg-gradient-to-br from-surface-50/80 to-white p-4 transition-shadow hover:shadow-soft-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-700">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-ink">{item.value}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {scopeItems.length > 0 && (
          <motion.div
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-5 shadow-soft-xs"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 opacity-20 blur-2xl" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">
              Service Scope
            </p>
            <div className="relative mt-4 space-y-3">
              {scopeItems.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + idx * 0.06 }}
                  className="flex gap-2 text-sm text-surface-700"
                >
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </SectionCard>
  )
}

/* ============================================================================
   PROFILE HERO
   ========================================================================== */
function ProfileHero({
  teknisi,
  saved,
  onSave,
  onShare,
  onChat,
  onBook,
}: {
  teknisi: PublicTeknisiDetailDto
  saved: boolean
  onSave: () => void
  onShare: () => void
  onChat: () => void
  onBook: () => void
}) {
  const { tagline } = getProfileSummaryFields(teknisi)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_24px_70px_-24px_rgba(16,185,129,0.3)] backdrop-blur-xl">
      {/* Cover — foto banner atau fallback mesh */}
      <div className="relative min-h-[230px] overflow-hidden p-5 sm:p-7">
        {teknisi.coverImage ? (
          <>
            <img
              src={teknisi.coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/45 via-transparent to-black/40 mix-blend-overlay" />
          </>
        ) : (
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.95), transparent 55%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.9), transparent 55%), linear-gradient(135deg,#022c22 0%,#047857 48%,#022c22 100%)',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {!teknisi.coverImage && (
          <>
            <motion.div
              className="absolute h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl"
              animate={{ x: [0, 80, 40, 0], y: [0, 30, 60, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-0 h-72 w-72 rounded-full bg-primary-950/50 blur-3xl"
              animate={{ x: [0, -60, 0], y: [0, 50, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            <FloatingSparkles />
          </>
        )}

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Top row — status online/offline */}
        <div className="relative flex flex-wrap items-start justify-end gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Badge className="border-white/20 bg-white/15 text-white backdrop-blur-md">
              {teknisi.isOnline ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-300" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-surface-300" />
              )}
              {teknisi.isOnline ? 'Online sekarang' : 'Offline'}
            </Badge>
          </motion.div>
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-7">
        <div className="flex flex-col gap-5">
          <div className="-mt-16 flex items-end justify-between gap-4">
            <MagneticAvatar teknisi={teknisi} />
            <div className="hidden flex-wrap justify-end gap-2 sm:flex">
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onSave}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), saved && 'border-rose-300 bg-rose-50 text-red-600')}
                aria-label="Simpan profil"
              >
                <Heart className="h-4 w-4" weight={saved ? 'fill' : 'duotone'} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onShare}
                className={buttonVariants({ variant: 'outline', size: 'icon' })}
                aria-label="Bagikan profil"
              >
                <Share2 className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease }}
                  className="text-3xl font-black tracking-tight text-ink sm:text-4xl"
                >
                  {teknisi.name}
                </motion.h1>
                {teknisi.isVerified && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 220 }}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/90 px-2.5 py-1 text-xs font-black tracking-tight text-amber-800 shadow-[0_1px_6px_-1px_rgba(217,119,6,0.3)]">
                      <CheckCircle className="h-3.5 w-3.5 text-amber-600" weight="fill" />
                      Verified
                    </span>
                  </motion.div>
                )}
                {teknisi.providesInspection && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring', stiffness: 220 }}
                  >
                    <InspectionBadge size="md" animated />
                  </motion.div>
                )}
              </div>
              {tagline && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-2 max-w-2xl text-sm leading-relaxed text-surface-600"
                >
                  {tagline}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-surface-600"
              >
                {teknisi.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    {teknisi.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" weight="fill" />
                  <strong className="text-ink">{teknisi.platformStats.averageRating || '—'}</strong>{' '}
                  {teknisi.platformStats.reviewCount} review
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-primary-600" />
                  <strong className="text-ink">{compactNumber(teknisi.totalKonsultasi)}</strong> konsultasi
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
              className="flex flex-wrap gap-2 lg:justify-end"
            >
              <ShimmerButton onClick={onChat} variant="primary">
                <MessageCircle className="h-4 w-4" />
                Chat Now
              </ShimmerButton>
              <Button variant="outline" onClick={onBook}>
                <Calendar className="h-4 w-4" />
                Book Consultation
              </Button>
              <button
                type="button"
                onClick={onSave}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), saved && 'text-red-600', 'sm:hidden')}
                aria-label="Simpan profil"
              >
                <Heart className="h-4 w-4" weight={saved ? 'fill' : 'duotone'} />
              </button>
              <button type="button" onClick={onShare} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'sm:hidden')} aria-label="Bagikan profil">
                <Share2 className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   MAGNETIC AVATAR
   ========================================================================== */
function MagneticAvatar({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 150, damping: 14 })
  const sy = useSpring(y, { stiffness: 150, damping: 14 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left - rect.width / 2) * 0.18)
        y.set((e.clientY - rect.top - rect.height / 2) * 0.18)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{ x: sx, y: sy }}
      initial={{ opacity: 0, y: 30, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 14 }}
      className="relative flex-shrink-0"
    >
      {/* Animated rotating conic ring */}
      <motion.div
        className="absolute -inset-2 rounded-[2.2rem]"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, rgba(16,185,129,0.75), rgba(0,0,0,0.9), rgba(5,150,105,0.7), rgba(2,44,34,0.95), rgba(16,185,129,0.75))',
          filter: 'blur(10px)',
        }}
      />

      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-primary-500 to-primary-950 text-5xl font-black text-white shadow-2xl">
        {teknisi.image ? (
          <img src={teknisi.image} alt={teknisi.name} className="h-full w-full object-cover" />
        ) : (
          teknisi.name.charAt(0)
        )}
      </div>

      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-primary-500 shadow-soft-md">
        <CheckCircle className="h-4 w-4 text-white" weight="fill" />
      </span>
    </motion.div>
  )
}

/* ============================================================================
   ANIMATED COUNTER
   ========================================================================== */
function AnimatedNumber({ value, decimal = false, suffix = '' }: { value: number; decimal?: boolean; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionValue = useMotionValue(0)
  const rounded: MotionValue<string> = useTransform(motionValue, (latest) => {
    if (decimal) return latest.toFixed(1)
    const v = Math.round(latest)
    return v >= 1000 ? compactNumber(v) : v.toString()
  })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [inView, value, motionValue])

  const [text, setText] = useState(decimal ? '0.0' : '0')
  useEffect(() => rounded.on('change', (v) => setText(v)), [rounded])

  return (
    <span ref={ref} className="tabular-nums">
      {text}
      {suffix}
    </span>
  )
}

/* ============================================================================
   BOOKING SUMMARY (sidebar)
   ========================================================================== */
function BookingSummary({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_70px_-24px_rgba(16,185,129,0.4)]">
      {/* Animated header */}
      <div className="relative overflow-hidden p-6 text-white">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.55), transparent 50%), linear-gradient(135deg,#064e3b 0%,#047857 52%,#065f46 100%)',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <motion.div
          className="absolute right-6 top-6"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-6 w-6 text-white/40" weight="fill" />
        </motion.div>

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-100">Starting Price</p>
          <p className="mt-3 text-4xl font-black tracking-tight tabular-nums">{formatPrice(teknisi.price)}</p>
          <p className="mt-1 text-[12px] text-primary-100">per sesi konsultasi profesional</p>
        </div>
      </div>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">Booking Summary</p>
        <div className="mt-4 space-y-2.5">
          {[
            { icon: Package, label: 'Service type', value: 'Chat consultation + optional remote' },
            { icon: Radio, label: 'Availability', value: teknisi.isOnline ? 'Online sekarang' : 'Terima booking terjadwal' },
            { icon: Lock, label: 'Secure transaction', value: 'Pembayaran aman via saldo platform' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.06 }}
              whileHover={{ x: 2 }}
              className="group flex gap-3 rounded-2xl border border-surface-200/70 bg-gradient-to-br from-surface-50/60 to-white p-3 transition-shadow hover:shadow-soft-xs"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-surface-500">{item.label}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-ink">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 flex items-center justify-center gap-1 text-center text-[11px] text-surface-500">
          <CreditCard className="h-3.5 w-3.5 text-primary-600" />
          Dana ditahan platform sampai sesi diproses.
        </p>
      </div>
    </div>
  )
}

/* ============================================================================
   SECTION CARD
   ========================================================================== */
function SectionCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-surface-200/70 bg-white p-5 shadow-soft-sm sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ============================================================================
   PORTFOLIO CARD — 3D tilt
   ========================================================================== */
function PortfolioCard({
  item,
  idx,
}: {
  item: TeknisiPortfolioItemDto
  idx: number
}) {
  const Icon = resolvePortfolioIcon(item.icon)
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const sRotX = useSpring(rotateX, { stiffness: 220, damping: 18 })
  const sRotY = useSpring(rotateY, { stiffness: 220, damping: 18 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: 0.06 + idx * 0.08 }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        rotateY.set(px * 10)
        rotateX.set(-py * 10)
      }}
      onMouseLeave={() => { rotateX.set(0); rotateY.set(0) }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-surface-200/70 bg-white shadow-soft-xs transition-shadow hover:shadow-soft-md"
    >
      <div
        className={cn(
          'relative flex aspect-[4/3] items-center justify-center overflow-hidden',
          !item.imageUrl && cn('bg-gradient-to-br text-white', item.tone),
        )}
      >
        {item.imageUrl ? (
          <>
            <motion.img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />
          </>
        ) : (
          <>
            <motion.div
              className="absolute h-32 w-32 rounded-full bg-white/20 blur-2xl"
              animate={{ x: [-20, 20, -20], y: [-10, 15, -10] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              whileHover={{ scale: 1.15, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 180 }}
              className="relative"
              style={{ transform: 'translateZ(40px)' }}
            >
              <Icon className="h-14 w-14 drop-shadow-lg" />
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
          </>
        )}
      </div>
      <div className="p-4" style={{ transform: 'translateZ(20px)' }}>
        <p className="text-sm font-bold leading-snug text-ink">{item.title}</p>
        <p className="mt-1 text-[11px] font-medium text-surface-500">{item.meta}</p>
        <p className="mt-3 rounded-xl bg-gradient-to-br from-primary-50/60 to-surface-50 px-3 py-2 text-[12px] text-surface-700">{item.result}</p>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   TRUST PANEL
   ========================================================================== */
function TrustPanel({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const items = [
    { icon: UserCheck, text: 'Identitas teknisi terverifikasi' },
    { icon: Phone, text: 'Phone & email verified' },
    { icon: Calendar, text: `${teknisi.experience ?? '5 tahun'} aktif di layanan teknis` },
  ]
  return (
    <SectionCard eyebrow="Lapisan Kepercayaan" title="Kredibilitas">
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ x: 3 }}
            className="group flex items-center gap-3 rounded-2xl border border-surface-200/70 bg-gradient-to-br from-surface-50/60 to-white p-3 transition-shadow hover:shadow-soft-xs"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition-transform group-hover:scale-110 group-hover:rotate-6">
              <item.icon className="h-4 w-4" />
            </div>
            <p className="text-[13px] font-semibold text-surface-700">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ============================================================================
   AVAILABILITY PANEL
   ========================================================================== */
function AvailabilityPanel({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const schedule = formatOperatingHoursLines(teknisi.operatingHours).map((line) => {
    const parts = line.split(' · ')
    return [parts[0] ?? line, parts.slice(1).join(' · ') || '—'] as [string, string]
  })
  return (
    <SectionCard eyebrow="Jadwal" title="Ketersediaan">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50 via-emerald-50/40 to-primary-50 p-4 shadow-soft-xs">
        <motion.div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-300 opacity-30 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="relative flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {teknisi.isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />}
            <span className={cn('relative inline-flex h-3 w-3 rounded-full', teknisi.isOnline ? 'bg-primary-500' : 'bg-surface-400')} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{teknisi.isOnline ? 'Available today' : 'Booking tersedia'}</p>
            <p className="text-[12px] text-surface-600">
              Estimasi respons {teknisi.platformStats.responseTimeLabel} · WIB
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 divide-y divide-surface-100 rounded-2xl border border-surface-200/70 bg-white">
        {schedule.map(([day, time], idx) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + idx * 0.06 }}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="font-semibold text-ink">{day}</span>
            <span className="text-surface-600">{time}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-surface-500">
        Online hours dapat berubah mengikuti antrean konsultasi dan ketersediaan teknisi.
      </p>
    </SectionCard>
  )
}

/* ============================================================================
   CERTIFICATIONS PANEL
   ========================================================================== */
function CertificationsPanel({
  certifications,
}: {
  certifications: TeknisiCertificationItemDto[]
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  return (
    <>
      <SectionCard eyebrow="Kompetensi" title="Sertifikasi">
        <div className="space-y-2.5">
          {certifications.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: idx * 0.05 }}
              className="group overflow-hidden rounded-2xl border border-surface-200/70 bg-white transition-shadow hover:shadow-soft-xs"
            >
              {item.fileType === 'image' ? (
                <button
                  type="button"
                  onClick={() => setPreviewUrl(item.fileUrl)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ink opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Eye className="h-3 w-3" />
                      Perbesar
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <Award className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] font-semibold leading-snug text-ink">{item.title}</p>
                  </div>
                </button>
              ) : (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-50/80"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-primary-600">Buka PDF</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Tutup pratinjau"
            onClick={() => setPreviewUrl(null)}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Pratinjau sertifikasi"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

/* ============================================================================
   LINKED STORE CARD
   ========================================================================== */
function LinkedStoreCard({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const store = teknisi.linkedStore
  if (!store) return null

  return (
    <Link href={`/toko/${store.id}`} className="group block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-white shadow-soft-sm transition-shadow hover:shadow-[0_24px_60px_-24px_rgba(16,185,129,0.4)]"
      >
        {/* Cover photo + parallax tilt */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {store.coverImage ? (
            <motion.img
              src={store.coverImage}
              alt={store.name}
              className="absolute inset-0 h-full w-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            // Premium fallback — animated mesh
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.95), transparent 55%), radial-gradient(circle at 70% 70%, rgba(8,145,178,0.85), transparent 55%), linear-gradient(135deg,#022c22 0%,#047857 50%,#0e7490 100%)',
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Shop pattern overlay (always visible) */}
          <div
            className="absolute inset-0 opacity-15 mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

          {/* Eyebrow + verified */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Store className="h-3 w-3" weight="fill" />
              Official Store
            </span>
            {store.verified && (
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 240, delay: 0.2 }}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-950 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.6)]"
              >
                <CheckCircle className="h-2.5 w-2.5" weight="fill" />
                Verified
              </motion.span>
            )}
          </div>

          {/* Bottom — store name + city */}
          <div className="absolute inset-x-4 bottom-3">
            <h3 className="truncate text-lg font-black tracking-tight text-white drop-shadow-md sm:text-xl">
              {store.name}
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85">
              <MapPin className="h-3 w-3" weight="fill" />
              {store.city ?? 'Indonesia'}
            </p>
          </div>

          {/* Floating CTA badge */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-ink shadow-soft-md backdrop-blur-sm transition-all group-hover:bg-primary-600 group-hover:text-white"
          >
            Lihat toko
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </motion.div>
        </div>

        {/* Footer — stats row */}
        <div className="grid grid-cols-3 divide-x divide-surface-200/70 border-t border-surface-200/70">
          <div className="px-3 py-3 text-center">
            <p className="inline-flex items-center justify-center gap-1 text-[15px] font-black tabular-nums text-ink">
              <Star className="h-3.5 w-3.5 text-amber-500" weight="fill" />
              {store.rating.toFixed(1)}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-surface-500">
              Rating
            </p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-[15px] font-black tabular-nums text-ink">
              {compactNumber(store.reviewCount)}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-surface-500">
              Review
            </p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-[15px] font-black tabular-nums text-ink">
              {compactNumber(store.totalSold)}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-surface-500">
              Terjual
            </p>
          </div>
        </div>

        {/* Optional address strip */}
        {store.address && (
          <div className="border-t border-surface-200/70 bg-surface-50/50 px-4 py-2.5">
            <p className="line-clamp-1 text-[11px] text-surface-600">
              <MapPin className="mr-1 inline h-3 w-3 text-primary-600" weight="fill" />
              {store.address}
            </p>
          </div>
        )}
      </motion.div>
    </Link>
  )
}

/* ============================================================================
   SKILLS CONSTELLATION — radial / chip-on-arc layout (no boxy section)
   ========================================================================== */
function SkillsConstellation({ skills }: { skills: string[] }) {
  // Split skills into core (first 4) + rest
  const core = skills.slice(0, 4)
  const rest = skills.slice(4)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-gradient-to-br from-surface-50/40 via-white to-primary-50/30 p-6 shadow-soft-sm sm:p-8">
      {/* Decorative concentric arcs (background) */}
      <svg
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 opacity-50"
        viewBox="0 0 200 200"
        fill="none"
      >
        <defs>
          <linearGradient id="skill-arc-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 60, 80, 100, 120, 140, 160].map((r, i) => (
          <motion.circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            stroke="url(#skill-arc-grad)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        <motion.circle
          cx="100"
          cy="100"
          r="6"
          fill="#10b981"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Header — editorial */}
      <div className="relative flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
            Specialization
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">
            Skills & Expertise
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-surface-500">
            Total <span className="font-bold tabular-nums text-ink">{skills.length}</span> kompetensi
            terverifikasi.
          </p>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400 sm:inline">
          Mastery Map
        </span>
      </div>

      {/* CORE skills — large feature row with index + bar */}
      <div className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
        {core.map((skill, idx) => {
          const proficiency = 95 - idx * 4 // 95, 91, 87, 83
          return (
            <motion.div
              key={skill}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: idx * 0.07 }}
              whileHover={{ y: -2 }}
              className="group flex items-center gap-3 border-l-2 border-primary-600/30 bg-white/80 py-2 pl-3 pr-3 backdrop-blur-sm transition-all hover:border-primary-600 hover:bg-white"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-surface-400">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold tracking-tight text-ink">{skill}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-surface-200/60">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${proficiency}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.08, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-primary-600 to-emerald-500"
                    />
                  </div>
                  <span className="font-mono text-[9px] font-bold tabular-nums text-surface-500">
                    {proficiency}%
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* SECONDARY skills — typographic, no borders, no icons */}
      {rest.length > 0 && (
        <div className="relative mt-6">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-surface-400">
            <span className="h-px flex-1 bg-surface-200/80" />
            <span>Also fluent in</span>
            <span className="h-px flex-1 bg-surface-200/80" />
          </div>
          <p className="mt-3 text-[14px] leading-[2] text-surface-700">
            {rest.map((skill, idx) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, y: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className="inline cursor-default font-semibold tracking-tight text-ink/85 transition-colors hover:text-primary-700"
              >
                {skill}
                {idx < rest.length - 1 && (
                  <span className="mx-2 text-surface-300">·</span>
                )}
              </motion.span>
            ))}
          </p>
        </div>
      )}
    </div>
  )
}

/* ============================================================================
   LINKED STORE CARD (above)
   ========================================================================== */

/* ============================================================================
   SHIMMER BUTTON — animated shimmer + cursor glow
   ========================================================================== */
function ShimmerButton({
  onClick,
  children,
  variant = 'primary',
  fullWidth = false,
  size = 'default',
}: {
  onClick: () => void
  children: ReactNode
  variant?: 'primary' | 'outline'
  fullWidth?: boolean
  size?: 'default' | 'lg'
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const background = useTransform(
    [mouseX, mouseY],
    ([gx, gy]) => `radial-gradient(circle at ${gx as number}px ${gy as number}px, rgba(255,255,255,0.35), transparent 60%)`,
  )

  const heightCls = size === 'lg' ? 'h-12' : 'h-11'
  const isPrimary = variant === 'primary'

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-bold transition-shadow',
        heightCls,
        fullWidth && 'w-full',
        isPrimary
          ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] hover:shadow-[0_12px_32px_-8px_rgba(16,185,129,0.85)]'
          : 'border border-surface-200 bg-white text-ink hover:border-primary-200',
      )}
    >
      {isPrimary && (
        <motion.span
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.span className="pointer-events-none absolute inset-0" style={{ background }} />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  )
}

/* ============================================================================
   PERFORMANCE LEDGER — editorial replacement for the rainbow KPI grid
   ========================================================================== */
function PerformanceLedger({ teknisi }: { teknisi: PublicTeknisiDetailDto }) {
  const indicator = teknisi.platformStats.performanceIndicator

  const secondary: Array<{ label: string; value: string | number; numeric?: number; decimal?: boolean; suffix?: string; valueText?: string; benchmark?: string }> = [
    {
      label: 'Sesi selesai',
      numeric: teknisi.platformStats.completedSessions,
      value: teknisi.platformStats.completedSessions,
      benchmark: 'Konsultasi & remote',
    },
    {
      label: 'Completion rate',
      numeric: teknisi.platformStats.completionRatePercent,
      suffix: '%',
      value: `${teknisi.platformStats.completionRatePercent}%`,
      benchmark: 'Dari sesi konsultasi & remote',
    },
    {
      label: 'Response SLA',
      valueText: teknisi.platformStats.responseTimeLabel,
      value: teknisi.platformStats.responseTimeLabel,
      benchmark: 'Rata-rata waktu respons',
    },
    {
      label: 'Profile views',
      numeric: teknisi.totalView ?? 0,
      value: teknisi.totalView ?? 0,
      benchmark: 'Total kunjungan profil',
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-gradient-to-br from-white via-white to-primary-50/20 shadow-soft-sm">
      {/* Subtle radial accent */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />

      <div className="relative grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        {/* HERO METRIC — Rating, BIG */}
        <div className="relative border-b border-surface-200/70 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">Performance</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">Track Record</h2>
            </div>
            <span className="hidden rounded-full border border-surface-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-surface-500 sm:inline-block">
              Verified
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <p className="text-[88px] font-black leading-none tracking-tight text-ink sm:text-[112px]">
              {teknisi.platformStats.reviewCount > 0 ? (
                <AnimatedNumber value={teknisi.platformStats.averageRating} decimal />
              ) : (
                <span className="text-surface-300">—</span>
              )}
            </p>
            <div className="pb-2">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = teknisi.platformStats.averageRating >= i + 1
                  const half =
                    !filled &&
                    teknisi.platformStats.averageRating >= i + 0.5 &&
                    teknisi.platformStats.reviewCount > 0
                  return (
                    <motion.span
                      key={i}
                      initial={{ scale: 0, rotate: -45 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 240 }}
                    >
                      <Star
                        className={cn('h-4 w-4', !filled && !half && 'text-surface-200')}
                        weight={filled || half ? 'fill' : 'regular'}
                      />
                    </motion.span>
                  )
                })}
              </div>
              <p className="mt-1 text-[11px] font-medium text-surface-600">
                <span className="font-bold tabular-nums text-ink">{teknisi.platformStats.reviewCount}</span>{' '}
                {teknisi.platformStats.reviewCount === 1 ? 'verified review' : 'verified reviews'}
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-surface-600">
            Rata-rata dari ulasan terverifikasi di platform. Distribusi di bawah dihitung langsung dari setiap rating.
          </p>

          {/* Distribusi rating — dari data ulasan */}
          <div className="mt-6 space-y-1.5">
            {teknisi.platformStats.reviewCount === 0 ? (
              <p className="text-[12px] text-surface-500">Belum ada ulasan untuk menampilkan distribusi.</p>
            ) : (
              teknisi.platformStats.ratingDistribution
                .filter((row) => row.star >= 3)
                .map((row, idx) => (
                  <div key={row.star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-3 font-bold text-surface-700">{row.star}</span>
                    <Star className="h-2.5 w-2.5 text-amber-500" weight="fill" />
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-200/80">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.percent}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + idx * 0.08, duration: 0.9, ease }}
                        className="h-full rounded-full bg-ink"
                      />
                    </div>
                    <span className="w-8 text-right font-mono tabular-nums text-surface-500">
                      {row.percent}%
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* SECONDARY METRICS — list rows, no boxes/icons */}
        <div className="p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">Operational</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-400">Live</p>
          </div>

          <motion.div className="mt-5 rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/80 to-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-700">
              Indikator performa
            </p>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-2 flex items-end gap-2"
            >
              <p className="text-[52px] font-black leading-none tracking-tight text-ink sm:text-[64px]">
                {indicator.hasEnoughData && indicator.score != null ? (
                  <AnimatedNumber value={indicator.score} decimal />
                ) : (
                  <span className="text-surface-300">—</span>
                )}
              </p>
              {indicator.hasEnoughData && indicator.score != null && (
                <span className="pb-2 text-lg font-bold text-surface-400">/10</span>
              )}
            </motion.div>
            <p className="mt-2 text-[12px] leading-relaxed text-surface-600">{indicator.summary}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-surface-400">
              Tanpa rating ulasan · completion, respons, volume & engagement
            </p>
          </motion.div>

          <ul className="mt-5 divide-y divide-surface-200/70">
            {secondary.map((row, idx) => (
              <motion.li
                key={row.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-baseline justify-between gap-3 py-3 transition-colors hover:bg-primary-50/30"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{row.label}</p>
                  {row.benchmark && <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-surface-400">{row.benchmark}</p>}
                </div>
                <p className="text-right text-[20px] font-black tracking-tight text-ink">
                  {row.valueText
                    ? row.valueText
                    : row.numeric !== undefined
                      ? <AnimatedNumber value={row.numeric} decimal={row.decimal} suffix={row.suffix} />
                      : row.value}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   SERVICES MENU — editorial vertical list, no colored icon boxes
   ========================================================================== */
function ServicesMenu({
  services,
  onSelect,
}: {
  services: TeknisiConsultationService[]
  onSelect: (svc: TeknisiConsultationService) => void
}) {
  if (services.length === 0) return null

  const consultationServices = services.filter((s) => s.kind === 'consultation')
  const inspectionServices = services.filter((s) => s.kind !== 'consultation')
  const startingFromPrice = services[0]?.price ?? 0
  const hasInspection = inspectionServices.length > 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200/70 bg-white shadow-soft-sm">
      {/* Header bar */}
      <div className="flex items-end justify-between gap-4 border-b border-surface-200/70 bg-gradient-to-br from-white to-surface-50/60 px-6 py-5 sm:px-8 sm:py-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
            {hasInspection ? 'Layanan Konsultasi & Inspeksi' : 'Layanan Konsultasi'}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">Bandingkan & Pilih</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-surface-500">
            {hasInspection
              ? 'Konsultasi mencakup diagnosis & rekomendasi. Inspeksi mencakup pengecekan kondisi HP/Laptop sebelum beli.'
              : 'Setiap sesi mencakup diagnosis, rekomendasi solusi, dan estimasi risiko.'}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-surface-400">Tarif mulai</p>
          <p className="mt-0.5 text-[20px] font-black tabular-nums text-ink">
            {services[0] ? formatPrice(startingFromPrice) : '—'}
          </p>
        </div>
      </div>

      {/* Consultation rows */}
      {consultationServices.length > 0 && (
        <ul className="divide-y divide-surface-200/70">
          {consultationServices.map((svc, idx) => (
            <ServiceRow key={`c-${svc.name}-${idx}`} service={svc} idx={idx} onSelect={onSelect} />
          ))}
        </ul>
      )}

      {/* Inspection sub-section */}
      {hasInspection && (
        <div className="border-t border-teal-200/60 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30">
          <div className="flex items-center justify-between gap-3 px-6 pb-2 pt-5 sm:px-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_4px_10px_-4px_rgba(13,148,136,0.5)]">
                <Shield className="h-3.5 w-3.5" weight="fill" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                  Layanan Inspeksi
                </p>
                <p className="text-[11px] text-surface-500">
                  Bantu cek kondisi sebelum beli — barang dari mana saja.
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-teal-700 ring-1 ring-inset ring-teal-200 sm:inline-block">
              Baru
            </span>
          </div>
          <ul className="divide-y divide-teal-100/70">
            {inspectionServices.map((svc, idx) => (
              <InspectionServiceRow
                key={`i-${svc.name}-${idx}`}
                service={svc}
                idx={consultationServices.length + idx}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function InspectionServiceRow({
  service,
  idx,
  onSelect,
}: {
  service: TeknisiConsultationService
  idx: number
  onSelect: (svc: TeknisiConsultationService) => void
}) {
  const isOnline = service.kind === 'inspection-online'
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: 0.04 + idx * 0.06 }}
      className="group/row relative grid gap-4 px-6 py-5 transition-colors hover:bg-gradient-to-r hover:from-teal-50/60 hover:via-cyan-50/30 hover:to-transparent sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-8"
    >
      {/* Number + tipe pill */}
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
        <span className="font-mono text-[28px] font-black leading-none tracking-tight text-teal-700/15 transition-colors group-hover/row:text-teal-600">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.18em]',
            'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/80',
          )}
        >
          <Shield className="h-2.5 w-2.5" weight="fill" />
          Inspeksi
        </span>
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{service.name}</h3>
        <p className="mt-1 line-clamp-2 max-w-md text-[12.5px] leading-relaxed text-surface-600">
          {service.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-surface-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            {service.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            {isOnline ? 'Video call' : 'On-site'}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            Laporan kondisi
          </span>
        </div>
      </div>

      {/* Price + action */}
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <p className="text-right">
          <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-surface-400">Tarif</span>
          <span className="text-[18px] font-black tabular-nums tracking-tight text-ink">{formatPrice(service.price)}</span>
        </p>
        <button
          type="button"
          onClick={() => onSelect(service)}
          className="group/btn inline-flex items-center gap-1.5 text-[12px] font-bold tracking-tight text-teal-700 transition-colors hover:text-teal-800"
        >
          Pesan inspeksi
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-teal-200 bg-white transition-all group-hover/btn:border-teal-700 group-hover/btn:bg-teal-700 group-hover/btn:text-white">
            <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      {/* Left accent on hover (teal) */}
      <span className="pointer-events-none absolute inset-y-3 left-0 w-[2px] origin-bottom scale-y-0 bg-teal-600 transition-transform duration-300 group-hover/row:scale-y-100" />
    </motion.li>
  )
}

function ServiceRow({
  service,
  idx,
  onSelect,
}: {
  service: TeknisiConsultationService
  idx: number
  onSelect: (svc: TeknisiConsultationService) => void
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: 0.04 + idx * 0.06 }}
      className="group/row relative grid gap-4 px-6 py-5 transition-colors hover:bg-gradient-to-r hover:from-primary-50/40 hover:via-primary-50/20 hover:to-transparent sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-8"
    >
      {/* Number + popular indicator (no big icon box) */}
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
        <span className="font-mono text-[28px] font-black leading-none tracking-tight text-ink/15 transition-colors group-hover/row:text-primary-600">
          {String(idx + 1).padStart(2, '0')}
        </span>
        {service.popular && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.18em] text-amber-700">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Populer
          </span>
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{service.name}</h3>
        <p className="mt-1 line-clamp-2 max-w-md text-[12.5px] leading-relaxed text-surface-600">
          {service.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-surface-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            {service.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            Chat & remote
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-surface-400" />
            Garansi review
          </span>
        </div>
      </div>

      {/* Price + action */}
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <p className="text-right">
          <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-surface-400">Mulai dari</span>
          <span className="text-[18px] font-black tabular-nums tracking-tight text-ink">{formatPrice(service.price)}</span>
        </p>
        <button
          type="button"
          onClick={() => onSelect(service)}
          className="group/btn inline-flex items-center gap-1.5 text-[12px] font-bold tracking-tight text-primary-700 transition-colors hover:text-primary-800"
        >
          Pesan sesi
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary-200 bg-white transition-all group-hover/btn:border-primary-700 group-hover/btn:bg-primary-700 group-hover/btn:text-white">
            <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      {/* Left accent on hover */}
      <span className="pointer-events-none absolute inset-y-3 left-0 w-[2px] origin-bottom scale-y-0 bg-primary-600 transition-transform duration-300 group-hover/row:scale-y-100" />
    </motion.li>
  )
}
