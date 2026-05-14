'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import {
  Award,
  Briefcase,
  Calendar,
  ChevronRight,
  CheckCircle,
  Clock,
  Eye,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
  Settings,
  Shield,
  Smartphone,
  Star,
  Store,
  ThumbsUp,
  TrendingUp,
  Unlock,
  Users,
  Wrench,
  Zap,
} from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
}

const hoverLift = {
  y: -4,
  scale: 1.01,
  transition: { duration: 0.22, ease },
}

/** Mock: toko milik teknisi (nanti dari API: stores oleh owner) */
const LINKED_STORE_BY_TEKNISI_ID: Record<
  string,
  { id: string; name: string; city: string; rating: number; reviewCount: number; verified: boolean }
> = {
  '1': {
    id: '1',
    name: 'HandPhone Center Jakarta',
    city: 'Jakarta',
    rating: 4.8,
    reviewCount: 456,
    verified: true,
  },
  '2': {
    id: '2',
    name: 'TechSolution Store',
    city: 'Jakarta',
    rating: 4.9,
    reviewCount: 289,
    verified: true,
  },
}

export default function TeknisiDetailPage() {
  const params = useParams()
  const teknisiId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? ''
  const linkedStore = teknisiId ? LINKED_STORE_BY_TEKNISI_ID[teknisiId] : undefined

  const teknisi = {
    id: params.id,
    name: 'Ahmad Hidayat',
    isOnline: true,
    rating: 4.9,
    reviewCount: 234,
    totalKonsultasi: 567,
    totalView: 1234,
    badge: 'top-teknisi' as const,
    specialty: [
      { name: 'Unlock', desc: 'iCloud, FRP, operator lock', icon: Unlock, color: 'from-blue-50 to-white text-blue-700' },
      { name: 'Flashing', desc: 'Reinstall OS dan recovery', icon: Smartphone, color: 'from-violet-50 to-white text-violet-700' },
      { name: 'Root', desc: 'Custom ROM dan akses sistem', icon: Settings, color: 'from-primary-50 to-white text-primary-700' },
      { name: 'Hardware', desc: 'Diagnosa komponen dan repair', icon: Wrench, color: 'from-amber-50 to-white text-amber-700' },
    ],
    experience: '8 tahun',
    location: 'Jakarta Selatan',
    price: 50000,
    responseTime: '< 5 menit',
    completionRate: 98,
    description:
      'Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, root, dan troubleshooting hardware berbagai brand. Sudah menangani lebih dari 500 konsultasi dengan rating 4.9 dan proses kerja yang transparan.',
    services: [
      { name: 'Konsultasi Unlock', price: 50000, duration: '30 menit', popular: true, scope: 'Analisa lock, estimasi risiko, dan rekomendasi langkah aman.' },
      { name: 'Remote Flashing', price: 150000, duration: '1-2 jam', popular: false, scope: 'Install ulang OS, recovery bootloop, dan optimasi performa.' },
      { name: 'Root & Custom ROM', price: 200000, duration: '2-3 jam', popular: false, scope: 'Unlock bootloader, root, custom ROM, dan konfigurasi awal.' },
      { name: 'Troubleshooting HW', price: 100000, duration: '1 jam', popular: true, scope: 'Diagnosa hardware jarak jauh sebelum lanjut service fisik.' },
    ],
    certifications: [
      { name: 'Certified Mobile Technician', issuer: 'Indonesia Mobile Tech', year: 2020 },
      { name: 'Advanced Flashing Specialist', issuer: 'Tech Academy', year: 2021 },
      { name: 'Hardware Repair Expert', issuer: 'Tech Academy', year: 2022 },
    ],
    achievements: [
      { title: 'Top Performer', desc: 'Bulan ini', icon: Award, color: 'bg-amber-50 text-amber-700' },
      { title: '100% Satisfaction', desc: '567 konsultasi', icon: ThumbsUp, color: 'bg-primary-50 text-primary-700' },
      { title: 'Fast Response', desc: '< 5 menit', icon: Zap, color: 'bg-blue-50 text-blue-700' },
    ],
    portfolio: [
      { id: 1, image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=520&q=85', title: 'iPhone Unlock', tag: 'Unlock' },
      { id: 2, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=520&q=85', title: 'Samsung Flash', tag: 'Flashing' },
      { id: 3, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=520&q=85', title: 'Custom ROM', tag: 'Root' },
      { id: 4, image: 'https://images.unsplash.com/photo-1598327105856-8c89d6b2a0b1?auto=format&fit=crop&w=520&q=85', title: 'HW Repair', tag: 'Hardware' },
    ],
    socialMedia: {
      instagram: '@ahmadhidayat_tech',
      facebook: 'Ahmad Hidayat Tech',
      linkedin: 'ahmad-hidayat-tech',
    },
    availability: { weekday: '09:00 - 21:00', weekend: '10:00 - 18:00' },
  }

  const reviews = [
    { id: 1, userName: 'Budi Santoso', rating: 5, comment: 'Sangat membantu. Masalah unlock iPhone selesai cepat dan dijelaskan tahapannya.', date: '3 hari lalu', service: 'Unlock', verified: true },
    { id: 2, userName: 'Siti Nurhaliza', rating: 5, comment: 'Profesional dan ramah. Proses flashing jelas, data penting dicek dulu.', date: '1 minggu lalu', service: 'Flashing', verified: true },
    { id: 3, userName: 'Rudi Hartono', rating: 4, comment: 'Hasilnya bagus, overall oke dan recommended untuk custom ROM.', date: '2 minggu lalu', service: 'Root', verified: false },
    { id: 4, userName: 'Dewi Lestari', rating: 5, comment: 'Pelayanan sangat memuaskan. Masalah hardware berhasil didiagnosa dengan rapi.', date: '3 minggu lalu', service: 'Hardware', verified: true },
  ]

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const metrics = [
    { label: 'Konsultasi', value: teknisi.totalKonsultasi, icon: MessageCircle },
    { label: 'Rating', value: teknisi.rating, icon: Star },
    { label: 'Views', value: teknisi.totalView.toLocaleString('id-ID'), icon: Eye },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7fbf8_44%,#f8fafc_100%)] text-black">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <section className="relative isolate h-36 overflow-hidden sm:h-40 lg:mt-16 lg:h-44">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#059669_0%,#10b981_45%,#67e8f9_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.36),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(255,255,255,0.24),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.13)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.13)_50%,rgba(255,255,255,0.13)_75%,transparent_75%)] bg-[length:28px_28px] opacity-40" />
      </section>

      <main className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-14">
        <div className="mb-5 text-xs font-medium text-white/86 lg:text-surface-500">
          <Link href="/teknisi" className="transition-colors hover:text-primary-600">Daftar Teknisi</Link>
          <span className="mx-2">/</span>
          <span>{teknisi.name}</span>
        </div>

        <motion.section
          variants={reveal}
          initial="hidden"
          animate="show"
          className="mb-6 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 p-4 shadow-soft-lg backdrop-blur-2xl sm:p-5"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative mx-auto flex-shrink-0 sm:mx-0">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-primary-200 to-accent-200 opacity-70 blur-lg" />
                <img
                  src={`https://i.pravatar.cc/220?img=${parseInt(teknisi.id as string) || 1}`}
                  alt={teknisi.name}
                  className="relative h-20 w-20 rounded-[1.45rem] border-4 border-white object-cover shadow-soft-lg sm:h-24 sm:w-24"
                />
                {teknisi.isOnline && (
                  <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full border-2 border-white bg-primary-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-soft-sm">
                    <Radio className="h-3 w-3" />
                    Online
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="warning">
                    <Award className="h-3.5 w-3.5" />
                    Top Teknisi
                  </Badge>
                  <Badge variant="success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">{teknisi.name}</h2>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-surface-600 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-3 py-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-black">{teknisi.rating}</strong> ({teknisi.reviewCount})
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    {teknisi.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-3 py-1.5">
                    <Briefcase className="h-4 w-4 text-primary-600" />
                    {teknisi.experience}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-surface-600">
                  {teknisi.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-3xl border border-surface-200/70 bg-surface-50/80 p-2">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="rounded-2xl bg-white px-3 py-3 text-center shadow-soft-xs">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-primary-600" />
                    <div className="text-base font-bold tabular-nums text-black">{metric.value}</div>
                    <div className="text-[11px] font-medium text-surface-500">{metric.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.section>

        {linkedStore && (
          <motion.section variants={reveal} initial="hidden" animate="show" className="mb-6">
            <Link
              href={`/toko/${linkedStore.id}`}
              className="group flex items-center gap-4 rounded-[1.75rem] border border-surface-200/70 bg-white p-4 shadow-soft-sm transition hover:border-primary-200 hover:shadow-soft-lg sm:gap-5 sm:p-5"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700 shadow-soft-xs ring-1 ring-primary-100">
                <Store className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Toko terkait</p>
                <h3 className="mt-0.5 truncate text-lg font-bold tracking-tight text-black transition-colors group-hover:text-primary-700">
                  {linkedStore.name}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary-600" />
                    {linkedStore.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <strong className="text-black">{linkedStore.rating}</strong>
                    <span className="text-surface-500">({linkedStore.reviewCount} ulasan)</span>
                  </span>
                  {linkedStore.verified && (
                    <Badge variant="success" className="px-2 py-0 text-[10px]">
                      <CheckCircle className="h-3 w-3" />
                      Verified store
                    </Badge>
                  )}
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700">
                <span className="hidden sm:inline">Lihat toko</span>
                <ChevronRight className="h-5 w-5 text-surface-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden />
              </span>
            </Link>
          </motion.section>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Spesialisasi</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Keahlian utama yang paling sering dibutuhkan</h2>
              </motion.div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {teknisi.specialty.map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.article
                      key={item.name}
                      variants={reveal}
                      whileHover={hoverLift}
                      className="relative overflow-hidden rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg"
                    >
                      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${item.color} opacity-80`} />
                      <div className="relative">
                        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white shadow-soft-sm">
                          <Icon className="h-5 w-5 text-primary-700" />
                        </div>
                        <h3 className="text-base font-bold text-black">{item.name}</h3>
                        <p className="mt-1.5 text-sm leading-5 text-surface-600">{item.desc}</p>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Jasa Online / Remote</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Paket layanan dengan scope yang jelas</h2>
                </div>
                <Badge variant="gradient" className="hidden sm:inline-flex">
                  <Clock className="h-3.5 w-3.5" />
                  Mulai {formatPrice(teknisi.price)}
                </Badge>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-2">
                {teknisi.services.map((service) => (
                  <motion.article
                    key={service.name}
                    variants={reveal}
                    whileHover={hoverLift}
                    className={`rounded-2xl border bg-white p-4 shadow-soft-sm transition-shadow hover:shadow-soft-lg ${
                      service.popular ? 'border-primary-200 ring-4 ring-primary-50' : 'border-surface-200/70'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-black">{service.name}</h3>
                          {service.popular && <Badge variant="success" className="px-2 py-0.5 text-[10px]">Popular</Badge>}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-surface-500">
                          <Clock className="h-3.5 w-3.5" />
                          {service.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold tabular-nums text-primary-700">{formatPrice(service.price)}</p>
                        <p className="text-[11px] font-medium text-surface-500">fixed start</p>
                      </div>
                    </div>
                    <p className="min-h-[44px] text-sm leading-5 text-surface-600">{service.scope}</p>
                    <Button variant={service.popular ? 'primary' : 'outline'} className="mt-4 w-full">
                      Pilih layanan
                    </Button>
                  </motion.article>
                ))}
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Portfolio</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Contoh pekerjaan dan kategori kasus</h2>
              </motion.div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {teknisi.portfolio.map((item) => (
                  <motion.article
                    key={item.id}
                    variants={reveal}
                    whileHover={hoverLift}
                    className="group overflow-hidden rounded-2xl border border-surface-200/70 bg-white p-2 shadow-soft-sm hover:shadow-soft-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-surface-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                        <Badge variant="glass" className="mb-2 bg-white/18 px-2 py-0.5 text-[10px] text-white ring-1 ring-white/20">
                          {item.tag}
                        </Badge>
                        <h3 className="text-sm font-bold">{item.title}</h3>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Sertifikasi</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Kredensial yang memperkuat kepercayaan</h2>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-3">
                {teknisi.certifications.map((cert) => (
                  <motion.article key={cert.name} variants={reveal} whileHover={hoverLift} className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg">
                    <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold leading-5 text-black">{cert.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-surface-500">{cert.issuer} · {cert.year}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary-700">
                      <CheckCircle className="h-4 w-4" />
                      Verified credential
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Review</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Pengalaman pelanggan sebelumnya</h2>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-2">
                {reviews.map((review) => (
                  <motion.article key={review.id} variants={reveal} whileHover={hoverLift} className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg">
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={`https://i.pravatar.cc/120?img=${review.id + 30}`}
                        alt={review.userName}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-black">{review.userName}</h3>
                          {review.verified && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-primary-600" />}
                        </div>
                        <p className="text-xs text-surface-500">{review.date}</p>
                      </div>
                      <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{review.service}</Badge>
                    </div>
                    <div className="mb-3 flex">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${idx < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-6 text-surface-600">{review.comment}</p>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <motion.div variants={reveal} initial="hidden" animate="show">
              <Card tone="glass" className="overflow-hidden rounded-[2rem] border-white/70 bg-white/88 shadow-soft-lg">
                <CardContent className="p-5">
                  <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-accent-500 p-4 text-white shadow-glow-primary">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/76">Mulai dari</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{formatPrice(teknisi.price)}</p>
                    <p className="mt-2 text-sm leading-5 text-white/82">Konsultasi cepat untuk menentukan langkah teknis yang paling aman.</p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-surface-50 p-4">
                      <p className="text-xs font-medium text-surface-500">Response</p>
                      <p className="mt-1 font-bold text-black">{teknisi.responseTime}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-50 p-4">
                      <p className="text-xs font-medium text-surface-500">Completion</p>
                      <p className="mt-1 font-bold text-black">{teknisi.completionRate}%</p>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${teknisi.completionRate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                    />
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <Button variant="primary" className="w-full">
                      <MessageCircle className="h-4 w-4" />
                      Konsultasi sekarang
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4" />
                      Hubungi teknisi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="rounded-[2rem]">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-bold text-black">Pencapaian</h3>
                  <div className="space-y-3">
                    {teknisi.achievements.map((achievement) => {
                      const Icon = achievement.icon
                      return (
                        <motion.div key={achievement.title} variants={reveal} className={`flex gap-3 rounded-2xl p-3 ${achievement.color}`}>
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white/80 shadow-soft-xs">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{achievement.title}</p>
                            <p className="text-xs leading-5 opacity-75">{achievement.desc}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="rounded-[2rem]">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">Jam Operasional</h3>
                      <p className="text-xs text-surface-500">Online consultation window</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-surface-50 p-3">
                      <p className="text-xs font-medium text-surface-500">Sen - Jum</p>
                      <p className="mt-1 font-bold text-black">{teknisi.availability.weekday}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-50 p-3">
                      <p className="text-xs font-medium text-surface-500">Sab - Min</p>
                      <p className="mt-1 font-bold text-black">{teknisi.availability.weekend}</p>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-surface-200/80" />

                  <div className="grid grid-cols-3 gap-2">
                    <button className="grid h-11 place-items-center rounded-2xl bg-pink-50 text-pink-600 transition hover:-translate-y-0.5 hover:bg-pink-100" aria-label="Instagram">
                      <Instagram className="h-5 w-5" />
                    </button>
                    <button className="grid h-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition hover:-translate-y-0.5 hover:bg-blue-100" aria-label="Facebook">
                      <Facebook className="h-5 w-5" />
                    </button>
                    <button className="grid h-11 place-items-center rounded-2xl bg-sky-50 text-sky-600 transition hover:-translate-y-0.5 hover:bg-sky-100" aria-label="LinkedIn">
                      <Linkedin className="h-5 w-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="rounded-[2rem]">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-bold text-black">Trust profile</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Verified identity', icon: Shield },
                      { label: 'High repeat order', icon: TrendingUp },
                      { label: 'Community recommended', icon: Users },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-surface-50 p-3">
                          <Icon className="h-5 w-5 text-primary-700" />
                          <span className="text-sm font-semibold text-surface-700">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </aside>
        </div>
      </main>

      <BottomNav />
      <MobileSafeAreaSpacer />
    </div>
  )
}
