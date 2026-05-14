'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import {
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Twitter,
  Wrench,
  Youtube,
  Zap,
} from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const reveal = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.62, ease } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
}

const hoverLift = {
  y: -4,
  scale: 1.01,
  transition: { duration: 0.22, ease },
}

export default function TokoDetailPage() {
  const params = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const toko = {
    id: params.id,
    name: 'HandPhone Center Jakarta',
    location: 'Jl. Thamrin No. 123',
    city: 'Jakarta',
    rating: 4.8,
    reviewCount: 456,
    totalPenjualan: 2341,
    badge: 'top-seller' as const,
    jamOperasional: {
      weekdays: '09:00 - 21:00',
      weekend: '10:00 - 20:00',
    },
    layanan: [
      { name: 'Service HP', description: 'Perbaikan hardware, software, dan diagnosa cepat', icon: Wrench, accent: 'from-primary-50 to-white text-primary-700' },
      { name: 'Jual Beli', description: 'Handphone baru, bekas, trade-in, dan konsultasi unit', icon: ShoppingBag, accent: 'from-accent-50 to-white text-accent-700' },
      { name: 'Unlock', description: 'Unlock berbagai brand dengan prosedur aman', icon: Smartphone, accent: 'from-emerald-50 to-white text-emerald-700' },
      { name: 'Flashing', description: 'Install ulang OS, optimasi performa, dan recovery', icon: Zap, accent: 'from-amber-50 to-white text-amber-700' },
    ],
    description:
      'Toko handphone terpercaya di Jakarta dengan pengalaman lebih dari 10 tahun. Melayani berbagai kebutuhan handphone mulai dari service, jual beli, unlock, hingga flashing. Dilengkapi teknisi berpengalaman, proses transparan, dan garansi resmi untuk membuat pelanggan lebih tenang sejak konsultasi pertama.',
    contact: {
      phone: '+62 812-3456-7890',
      email: 'info@handphonecenter.com',
      whatsapp: '+62 812-3456-7890',
    },
    socialMedia: {
      instagram: '@handphonecenter_jkt',
      facebook: 'HandPhone Center Jakarta',
      twitter: '@hpcenter_jkt',
      youtube: 'HandPhone Center Official',
      tiktok: '@hpcenter_jkt',
    },
  }

  const heroImage =
    toko.id === '1'
      ? '1556742049-0cfed4f6a45d'
      : toko.id === '2'
        ? '1486406146926-c627a92ad1ab'
        : '1487958449943-2429e8be8625'

  const galleryImageId = (idx: number) => {
    const sets: Record<string, string[]> = {
      '1': ['1556740749-887f6717d7e4', '1517248135467-4c7edcad34c4', '1520607162513-77705c0f0d4a'],
      '2': ['1485846234645-a62644f84728', '1515165562835-c4c9e0737eaa', '1498050108023-c5249f4df085'],
      '3': ['1490111718993-d98654ce6cf7', '1484300681262-5cca666b095e', '1520607162513-77705c0f0d4a'],
      '4': ['1504274066651-8d31a536b11a', '1479839672679-a46483c0e7c8', '1441986300917-64674bd600d8'],
      '5': ['1517244861115-54b9d993edc1', '1521292270410-a8c53642e9d0', '1517248135467-4c7edcad34c4'],
    }
    const fallback = ['1504274066651-8d31a536b11a', '1498050108023-c5249f4df085', '1484300681262-5cca666b095e']
    const arr = sets[String(toko.id)] || fallback
    return arr[idx % arr.length]
  }

  const reviews = [
    {
      id: 1,
      userName: 'Budi Santoso',
      rating: 5,
      comment: 'Service cepat dan hasilnya memuaskan. Harga juga reasonable. Recommended!',
      date: '5 hari yang lalu',
      service: 'Service HP',
    },
    {
      id: 2,
      userName: 'Siti Nurhaliza',
      rating: 5,
      comment: 'Barang yang dijual original dan berkualitas. Tokonya juga bersih dan rapih.',
      date: '1 minggu yang lalu',
      service: 'Jual Beli',
    },
    {
      id: 3,
      userName: 'Rudi Hartono',
      rating: 4,
      comment: 'Pelayanan oke, teknisi ramah. Agak ramai saat akhir pekan, tapi prosesnya jelas.',
      date: '2 minggu yang lalu',
      service: 'Flashing',
    },
  ]

  const stats = [
    { label: 'Penjualan', value: toko.totalPenjualan.toLocaleString('id-ID'), icon: ShoppingBag },
    { label: 'Rating', value: toko.rating, icon: Star },
    { label: 'Ulasan', value: toko.reviewCount, icon: MessageCircle },
  ]

  const trustSignals = [
    { title: 'Verified Store', desc: 'Identitas dan operasional tervalidasi', icon: Shield },
    { title: 'Garansi Resmi', desc: 'Proses service dengan bukti pengerjaan', icon: CheckCircle },
    { title: 'Top Seller', desc: 'Konsisten menjaga kualitas layanan', icon: Award },
  ]

  const socialButtons = [
    { label: 'Instagram', icon: Instagram, className: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
    { label: 'Facebook', icon: Facebook, className: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'Twitter', icon: Twitter, className: 'bg-sky-50 text-sky-600 hover:bg-sky-100' },
    { label: 'YouTube', icon: Youtube, className: 'bg-red-50 text-red-600 hover:bg-red-100' },
    { label: 'TikTok', icon: Play, className: 'bg-black text-white hover:bg-black/80' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7faf8_42%,#f8fafc_100%)] text-black">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <section className="relative isolate h-[300px] overflow-hidden sm:h-[320px] lg:mt-16 lg:h-[360px]">
        <img
          src={`https://images.unsplash.com/photo-${heroImage}?auto=format&fit=crop&w=1800&q=85`}
          alt={toko.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/34 to-black/8" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.30),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.30),transparent_22%)]" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12"
        >
          <motion.div variants={reveal} className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="warning" className="bg-white/86 text-amber-700 backdrop-blur-xl">
              <Award className="h-3.5 w-3.5" />
              Top Seller
            </Badge>
            <Badge variant="glass" className="bg-white/18 text-white ring-1 ring-white/24">
              <CheckCircle className="h-3.5 w-3.5 text-primary-200" />
              Verified Store
            </Badge>
          </motion.div>

          <motion.h1 variants={reveal} className="max-w-3xl text-3xl font-bold leading-[1] tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
            {toko.name}
          </motion.h1>

          <motion.div variants={reveal} className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/92">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/14 px-3 py-1.5 backdrop-blur-xl">
              <MapPin className="h-4 w-4" />
              {toko.location}, {toko.city}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/14 px-3 py-1.5 backdrop-blur-xl">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              {toko.rating} ({toko.reviewCount} ulasan)
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/14 px-3 py-1.5 backdrop-blur-xl">
              <ShoppingBag className="h-4 w-4" />
              {toko.totalPenjualan.toLocaleString('id-ID')} transaksi
            </span>
          </motion.div>
        </motion.div>
      </section>

      <main className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-14">
        <div className="mb-5 text-xs font-medium text-white/86 lg:text-surface-500">
          <Link href="/toko" className="transition-colors hover:text-primary-600">Promosi Toko</Link>
          <span className="mx-2">/</span>
          <span>{toko.name}</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-6">
            <motion.section
              variants={reveal}
              initial="hidden"
              animate="show"
              className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-soft-lg backdrop-blur-2xl sm:p-5"
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_270px] lg:items-center">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-100">
                    <Store className="h-3.5 w-3.5" />
                    Pusat layanan premium Jakarta
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-black">Tentang toko</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-surface-600">
                    {toko.description}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-3xl border border-surface-200/70 bg-surface-50/80 p-2">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="rounded-2xl bg-white px-3 py-3 text-center shadow-soft-xs">
                        <Icon className="mx-auto mb-2 h-5 w-5 text-primary-600" />
                        <div className="text-base font-bold tabular-nums text-black">{stat.value}</div>
                        <div className="mt-0.5 text-[11px] font-medium text-surface-500">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Layanan Tersedia</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Service yang paling sering dipilih</h2>
                </div>
                <Badge variant="gradient" className="hidden sm:inline-flex">
                  <Sparkles className="h-3.5 w-3.5" />
                  Estimasi jelas
                </Badge>
              </motion.div>
              <div className="grid gap-3 sm:grid-cols-2">
                {toko.layanan.map((layanan, index) => {
                  const Icon = layanan.icon
                  return (
                    <motion.article
                      key={layanan.name}
                      variants={reveal}
                      whileHover={hoverLift}
                      className="group relative overflow-hidden rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm transition-shadow hover:shadow-soft-lg"
                    >
                      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${layanan.accent} opacity-70`} />
                      <div className="relative">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white shadow-soft-sm">
                            <Icon className="h-5 w-5 text-primary-700" />
                          </div>
                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-surface-500 ring-1 ring-surface-200">
                            0{index + 1}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-black">{layanan.name}</h3>
                        <p className="mt-1.5 text-sm leading-5 text-surface-600">{layanan.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary-700">
                          <CheckCircle className="h-4 w-4" />
                          Bisa konsultasi sebelum datang
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            </motion.section>

            <motion.section variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Galeri Toko</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Ruang kerja dan aktivitas layanan</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-surface-500 shadow-soft-xs ring-1 ring-surface-200">
                  {currentImageIndex + 1}/6
                </span>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-surface-200/70 bg-white p-2 shadow-soft-lg">
                <div className="relative aspect-[16/8] overflow-hidden rounded-[1.35rem] bg-surface-100">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={`https://images.unsplash.com/photo-${galleryImageId(currentImageIndex)}?auto=format&fit=crop&w=1200&q=85`}
                      alt={`${toko.name} - galeri ${currentImageIndex + 1}`}
                      className="h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 1.035 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.32, ease }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/62 to-transparent p-4 text-white">
                    <div>
                      <p className="text-xs font-medium text-white/74">Live gallery</p>
                      <p className="text-sm font-semibold">Interior toko, service area, dan stok unit</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + 6) % 6)}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/24 bg-white/16 backdrop-blur-xl transition hover:bg-white/26"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % 6)}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/24 bg-white/16 backdrop-blur-xl transition hover:bg-white/26"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                        currentImageIndex === idx
                          ? 'border-primary-500 ring-2 ring-primary-100'
                          : 'border-surface-200 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Open gallery image ${idx + 1}`}
                    >
                      <img
                        src={`https://images.unsplash.com/photo-${galleryImageId(idx)}?auto=format&fit=crop&w=220&q=80`}
                        alt={`thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Ulasan Pelanggan</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Bukti kualitas layanan</h2>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-3">
                {reviews.map((review) => (
                  <motion.article
                    key={review.id}
                    variants={reveal}
                    whileHover={hoverLift}
                    className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={`https://i.pravatar.cc/120?img=${review.id + 12}`}
                        alt={review.userName}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-black">{review.userName}</h3>
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-primary-600" />
                        </div>
                        <p className="text-xs text-surface-500">{review.date}</p>
                      </div>
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-3.5 w-3.5 ${idx < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-300'}`}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{review.service}</Badge>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-surface-50 p-4 text-center">
                      <div className="text-2xl font-bold tabular-nums text-black">{toko.totalPenjualan.toLocaleString('id-ID')}</div>
                      <div className="text-xs font-medium text-surface-500">Penjualan</div>
                    </div>
                    <div className="rounded-2xl bg-surface-50 p-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums text-black">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        {toko.rating}
                      </div>
                      <div className="text-xs font-medium text-surface-500">{toko.reviewCount} ulasan</div>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-surface-200/80" />

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-black">Jam Operasional</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-medium text-surface-500">Sen - Jum</p>
                            <p className="font-bold text-black">{toko.jamOperasional.weekdays}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-surface-500">Sab - Min</p>
                            <p className="font-bold text-black">{toko.jamOperasional.weekend}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-primary-100 bg-primary-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Fast response</p>
                      <p className="mt-1 text-sm leading-6 text-surface-700">Hubungi toko untuk cek estimasi, stok unit, atau antrian service hari ini.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => window.open(`https://wa.me/${toko.contact.whatsapp.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Hubungi via WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4" />
                      {toko.contact.phone}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="rounded-[2rem]">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-bold text-black">Indikator kepercayaan</h3>
                  <div className="space-y-3">
                    {trustSignals.map((signal) => {
                      const Icon = signal.icon
                      return (
                        <motion.div key={signal.title} variants={reveal} className="flex gap-3 rounded-2xl bg-surface-50 p-3">
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white text-primary-700 shadow-soft-xs">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black">{signal.title}</p>
                            <p className="text-xs leading-5 text-surface-500">{signal.desc}</p>
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
                  <h3 className="mb-4 text-sm font-bold text-black">Kontak & sosial</h3>
                  <div className="space-y-3 text-sm text-surface-700">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary-600" />
                      <span>{toko.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary-600" />
                      <span className="truncate">{toko.contact.email}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {socialButtons.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.label}
                          className={`grid h-11 w-11 place-items-center rounded-2xl shadow-soft-xs transition hover:-translate-y-0.5 ${item.className}`}
                          aria-label={item.label}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
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
