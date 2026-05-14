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
  CreditCard,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  Shield,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Wallet,
  Zap,
} from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.58, ease } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.06 } },
}

const hoverLift = {
  y: -4,
  scale: 1.01,
  transition: { duration: 0.22, ease },
}

const sellerByProductId: Record<
  string,
  {
    storeId: string
    storeName: string
    technicianName?: string
    verified: boolean
    rating: number
    totalSales: number
    responseTime: string
    location: string
  }
> = {
  '1': {
    storeId: '1',
    storeName: 'HandPhone Center Jakarta',
    technicianName: 'Ahmad Hidayat',
    verified: true,
    rating: 4.9,
    totalSales: 234,
    responseTime: '< 5 menit',
    location: 'Jakarta Selatan',
  },
  '2': {
    storeId: '2',
    storeName: 'TechSolution Store',
    technicianName: 'Budi Santoso',
    verified: true,
    rating: 4.8,
    totalSales: 189,
    responseTime: '< 10 menit',
    location: 'Jakarta Pusat',
  },
}

export default function ProductDetailPage() {
  const params = useParams()
  const routeId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '1'
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  const seller = sellerByProductId[routeId] ?? sellerByProductId['1']!

  const product = {
    id: routeId,
    storeId: seller.storeId,
    name: 'iPhone 13 Pro Max - Second',
    category: 'handphone',
    price: 8500000,
    rating: 4.8,
    reviewCount: 124,
    views: 2341,
    condition: '95% like new',
    stock: 'Ready stock',
    location: 'Jakarta Selatan',
    teknisi: seller,
    description:
      'iPhone 13 Pro Max kondisi sangat baik, 95% like new. Unit sudah melewati pengecekan layar, kamera, speaker, charging port, Face ID, dan performa baterai. Cocok untuk pengguna yang ingin flagship iPhone dengan kondisi rapi dan garansi toko.',
    specs: [
      { label: 'Storage', value: '256GB' },
      { label: 'Warna', value: 'Sierra Blue' },
      { label: 'Battery health', value: '93%' },
      { label: 'Garansi', value: '1 bulan' },
      { label: 'Aksesoris', value: 'Charger, cable, box' },
      { label: 'Metode', value: 'COD / transfer' },
    ],
    features: [
      'Kondisi 95% like new',
      'Garansi toko 1 bulan',
      'Aksesoris lengkap',
      'Ready stock',
      'Bisa COD',
    ],
  }

  const galleryImages = [
    product.id === '1' ? '1592750475338-74b7b21085ab' : product.id === '2' ? '1511707171634-5f897ff02aa9' : '1517336714731-489689fd1ca8',
    '1511707171634-5f897ff02aa9',
    '1517336714731-489689fd1ca8',
  ]

  const reviews = [
    {
      id: 1,
      userName: 'Budi Santoso',
      rating: 5,
      comment: 'Barang sesuai deskripsi, kondisi rapi, dan seller responsif. Proses transaksi aman.',
      date: '2 hari yang lalu',
      badge: 'Verified purchase',
    },
    {
      id: 2,
      userName: 'Siti Nurhaliza',
      rating: 4,
      comment: 'Kondisi barang bagus, harga juga oke. Seller ramah dan fast response.',
      date: '5 hari yang lalu',
      badge: 'COD',
    },
  ]

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % galleryImages.length)
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)

  const trustItems = [
    { label: 'Unit diverifikasi', icon: Shield },
    { label: 'Garansi toko', icon: Award },
    { label: 'Pembayaran aman', icon: Wallet },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7faf8_42%,#f8fafc_100%)] text-black">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          className="mb-4 text-xs font-medium text-surface-500"
        >
          <Link href="/marketplace" className="transition-colors hover:text-primary-600">Marketplace</Link>
          <span className="mx-2">/</span>
          <span className="text-surface-700">{product.name}</span>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="min-w-0 space-y-6 lg:col-span-8"
          >
            <motion.div variants={reveal}>
            <Card tone="glass" className="w-full overflow-hidden rounded-[1.35rem] border-white/80 bg-white/90 p-2 shadow-soft-md">
              <div className="relative h-[280px] overflow-hidden rounded-[1.05rem] bg-surface-100 sm:h-[320px] lg:h-[350px] xl:h-[370px]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={`https://images.unsplash.com/photo-${galleryImages[selectedImage]}?auto=format&fit=crop&w=1100&q=85`}
                    alt={`${product.name} image ${selectedImage + 1}`}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.035 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.32, ease }}
                  />
                </AnimatePresence>

                <div className="absolute left-2.5 top-2.5 flex gap-2">
                  <Badge variant="glass" className="bg-white/86 text-surface-800 shadow-soft-xs">
                    <Package className="h-3.5 w-3.5 text-primary-700" />
                    Ready stock
                  </Badge>
                  <Badge variant="warning" className="hidden bg-white/86 shadow-soft-xs sm:inline-flex">
                    <Star className="h-3.5 w-3.5" />
                    Best value
                  </Badge>
                </div>

                <div className="absolute right-2.5 top-2.5 flex gap-2">
                  <button
                    onClick={() => setIsFavorite((value) => !value)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/82 text-surface-700 shadow-soft-xs backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
                    aria-label="Toggle favorite"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/82 text-surface-700 shadow-soft-xs backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
                    aria-label="Share product"
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/62 to-transparent p-2.5 text-white">
                  <button
                    onClick={prevImage}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/24 bg-white/16 backdrop-blur-xl transition hover:bg-white/28"
                    aria-label="Previous product image"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold backdrop-blur-xl">
                    {selectedImage + 1}/{galleryImages.length}
                  </span>
                  <button
                    onClick={nextImage}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/24 bg-white/16 backdrop-blur-xl transition hover:bg-white/28"
                    aria-label="Next product image"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {galleryImages.map((imageId, index) => (
                  <button
                    key={`${imageId}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-14 overflow-hidden rounded-xl border transition-all sm:h-16 lg:h-[70px] ${
                      selectedImage === index
                        ? 'border-primary-500 ring-2 ring-primary-100'
                        : 'border-surface-200 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Open product image ${index + 1}`}
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=260&q=80`}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </Card>
            </motion.div>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Detail Produk</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Spesifikasi dan kondisi unit</h2>
              </motion.div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {product.specs.map((spec) => (
                  <motion.div
                    key={spec.label}
                    variants={reveal}
                    whileHover={hoverLift}
                    className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-surface-400">{spec.label}</p>
                    <p className="mt-1 text-base font-bold text-black">{spec.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <Card className="rounded-[1.75rem]">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Deskripsi</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Ringkasan kondisi produk</h2>
                  </div>
                  <p className="text-sm leading-7 text-surface-600">{product.description}</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 rounded-2xl bg-surface-50 px-3 py-2.5 text-sm font-semibold text-surface-700">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Ulasan Pembeli</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">{product.reviewCount} ulasan terverifikasi</h2>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-2">
                {reviews.map((review) => (
                  <motion.article
                    key={review.id}
                    variants={reveal}
                    whileHover={hoverLift}
                    className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={`https://i.pravatar.cc/150?img=${review.id + 30}`}
                        alt={review.userName}
                        className="h-11 w-11 rounded-2xl border border-surface-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-black">{review.userName}</h3>
                          <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{review.badge}</Badge>
                        </div>
                        <p className="text-xs text-surface-500">{review.date}</p>
                      </div>
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
          </motion.div>

          <motion.aside
            variants={stagger}
            initial="hidden"
            animate="show"
            className="w-full space-y-4 lg:sticky lg:top-24 lg:col-span-4"
          >
            <motion.div variants={reveal}>
            <Card tone="glass" className="w-full rounded-[1.35rem] border-white/80 bg-white/92 shadow-soft-md">
              <CardContent className="p-4">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <Badge variant="primary" className="capitalize">
                    <Smartphone className="h-3.5 w-3.5" />
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-700">
                    <Zap className="h-4 w-4" />
                    Fast response
                  </div>
                </div>

                <h1 className="text-xl font-bold leading-tight tracking-tight text-black lg:text-2xl">
                  {product.name}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-surface-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-2.5 py-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-black">{product.rating}</strong> ({product.reviewCount} ulasan)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-2.5 py-1.5">
                    <Eye className="h-4 w-4 text-surface-500" />
                    {product.views.toLocaleString('id-ID')} dilihat
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-2.5 py-1.5">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    {product.location}
                  </span>
                </div>

                <div className="mt-3.5 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700">Harga produk</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-primary-700">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-semibold text-surface-600">
                    <span className="rounded-xl bg-white px-2.5 py-1.5 shadow-soft-xs">{product.condition}</span>
                    <span className="rounded-xl bg-white px-2.5 py-1.5 shadow-soft-xs">{product.stock}</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {trustItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2">
                        <Icon className="h-4.5 w-4.5 flex-shrink-0 text-primary-700" />
                        <p className="text-xs font-semibold leading-4 text-surface-700">{item.label}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3.5 flex gap-2">
                  <Button variant="primary" className="flex-1">
                    <ShoppingCart className="h-5 w-5" />
                    Beli sekarang
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Chat seller">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={reveal}>
            <Card className="w-full rounded-[1.35rem]">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-black">Informasi penjual</h2>
                  {product.teknisi.verified && (
                    <Badge variant="success" className="px-2 py-0.5 text-[10px]">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/150?img=12"
                    alt={product.teknisi.storeName}
                    className="h-12 w-12 rounded-2xl border border-surface-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-black">{product.teknisi.storeName}</h3>
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary-600" />
                    </div>
                    {product.teknisi.technicianName && (
                      <p className="mt-0.5 truncate text-xs text-surface-500">
                        Teknisi:{' '}
                        <span className="font-medium text-surface-700">{product.teknisi.technicianName}</span>
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-surface-500">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {product.teknisi.rating}
                      </span>
                      <span>{product.teknisi.totalSales} penjualan</span>
                      <span>{product.teknisi.responseTime}</span>
                    </div>
                    <p className="mt-1 text-xs text-surface-500">{product.teknisi.location}</p>
                  </div>
                </div>

                <Link href={`/toko/${product.storeId}`} className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    <Store className="h-4 w-4" />
                    Lihat profil toko
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={reveal}>
            <Card className="w-full rounded-[1.75rem]">
              <CardContent className="p-5">
                <h2 className="mb-4 text-base font-bold text-black">Keunggulan transaksi</h2>
                <div className="space-y-3">
                  {[
                    { title: 'COD tersedia', desc: 'Cek unit sebelum pembayaran', icon: Package },
                    { title: 'Garansi 1 bulan', desc: 'Cover service center toko', icon: Shield },
                    { title: 'Pembayaran fleksibel', desc: 'Transfer, wallet, atau rekber', icon: CreditCard },
                    { title: 'Respon cepat', desc: 'Rata-rata balasan kurang dari 5 menit', icon: Clock },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="flex gap-3 rounded-2xl bg-surface-50 p-3">
                        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-white text-primary-700 shadow-soft-xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">{item.title}</p>
                          <p className="text-xs leading-5 text-surface-500">{item.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </motion.aside>
        </div>
      </main>

      <div className="fixed inset-x-4 bottom-20 z-30 rounded-3xl border border-white/80 bg-white/92 p-3 shadow-soft-lg backdrop-blur-2xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-surface-500">{product.name}</p>
            <p className="text-lg font-bold text-primary-700">{formatPrice(product.price)}</p>
          </div>
          <Button variant="primary" size="sm">
            <ShoppingCart className="h-4 w-4" />
            Beli
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Chat seller">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
