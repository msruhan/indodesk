'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@prisma/client'
import { useCart } from '@/contexts/cart-context'
import { useChat } from '@/contexts/chat-context'
import { openTeknisiChat } from '@/lib/open-teknisi-chat'
import type { MarketplaceProductDto } from '@/lib/marketplace-product-serializer'
import { MOCK_MARKETPLACE_PRODUCTS } from '@/lib/marketplace-mock-products'
import {
  ProductDetailSpecsCard,
  shouldShowProductDetailCard,
} from '@/components/marketplace/product-detail-specs-card'
import { CompareButton } from '@/components/marketplace/compare-button'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import {
  Award,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Scales,
  Share2,
  Shield,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  X,
  Zap,
} from '@/lib/icons'

const ease = [0.22, 1, 0.36, 1] as const

const DEFAULT_SELLER_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=f0fdf4&color=047857&bold=true`

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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const { addItem } = useCart()
  const { openChatWithPeer } = useChat()
  const routeId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '1'
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [product, setProduct] = useState<MarketplaceProductDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<
    Array<{
      id: string
      rating: number
      comment: string
      dateLabel: string
      author: { name: string; image: string | null }
    }>
  >([])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch(`/api/marketplace/products/${routeId}`)
        const data = await res.json()
        if (data.success) {
          setProduct(data.data)
          return
        }
        const fallback = MOCK_MARKETPLACE_PRODUCTS[routeId]
        if (fallback) {
          setProduct(fallback)
          return
        }
        setLoadError(data.error || 'Produk tidak ditemukan')
      } catch {
        const fallback = MOCK_MARKETPLACE_PRODUCTS[routeId]
        if (fallback) setProduct(fallback)
        else setLoadError('Gagal memuat produk')
      } finally {
        setLoading(false)
      }
    })()
  }, [routeId])

  useEffect(() => {
    if (!routeId) return
    void (async () => {
      try {
        const res = await fetch(`/api/marketplace/products/${routeId}/reviews`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data?.items)) {
          setReviews(
            data.data.items.map(
              (r: {
                id: string
                rating: number
                comment: string
                dateLabel: string
                author: { name: string; image: string | null }
              }) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                dateLabel: r.dateLabel,
                author: r.author,
              }),
            ),
          )
        }
      } catch {
        /* ignore */
      }
    })()
  }, [routeId])

  const handleBuyNow = useCallback(() => {
    if (!product) return
    if (product.stock <= 0) {
      alert('Stok produk habis')
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      category: product.category,
      categoryValue: product.categoryValue,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock,
      seller: {
        id: product.seller.id,
        storeName: product.seller.storeName,
      },
      coupon: product.coupon,
    })
    router.push('/cart')
  }, [product, addItem, router])

  const handleChatSeller = useCallback(() => {
    if (!product) return
    const buyerId = session?.user?.id
    if (buyerId && buyerId === product.seller.id) {
      alert('Anda tidak dapat chat ke diri sendiri sebagai penjual produk ini.')
      return
    }
    openTeknisiChat({
      teknisiUserId: product.seller.id,
      isAuthenticated: authStatus === 'authenticated',
      role: (session?.user?.role as UserRole | undefined) ?? 'USER',
      openChatWithPeer,
      navigate: router.push,
    })
  }, [product, session?.user?.id, session?.user?.role, authStatus, openChatWithPeer, router])

  const galleryImageCount = product ? 3 : 1

  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const count = Math.max(galleryImageCount, 1)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev - 1 + count) % count)
      }
      if (event.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev + 1) % count)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, galleryImageCount])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <p className="text-sm text-surface-500">Memuat produk...</p>
      </div>
    )
  }

  if (!product || loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 px-4">
        <p className="text-sm text-surface-600">{loadError ?? 'Produk tidak ditemukan'}</p>
        <Link href="/marketplace">
          <Button variant="primary">Kembali ke Marketplace</Button>
        </Link>
      </div>
    )
  }

  const display = {
    id: product.id,
    storeId: product.seller.storeId ?? product.seller.id,
    name: product.name,
    category: product.categorySlug,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    views: product.views,
    stock: product.stock > 0 ? 'Ready stock' : 'Habis',
    location: product.seller.location ?? '—',
    teknisi: product.seller,
    description: product.description ?? '',
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : product.image
        ? [product.image]
        : [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1100&q=85',
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
          <span className="text-surface-700">{display.name}</span>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="min-w-0 space-y-6 lg:col-span-8"
          >
            <motion.div variants={reveal}>
            <Card tone="glass" className="mx-auto w-full max-w-2xl overflow-hidden rounded-[1.35rem] border-white/80 bg-white/90 p-2 shadow-soft-md lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.05rem] bg-surface-100">
                <button
                  type="button"
                  className="absolute inset-0 z-0 flex h-full w-full cursor-zoom-in items-center justify-center"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Lihat foto ukuran penuh"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={galleryImages[selectedImage]}
                      alt={`${display.name} image ${selectedImage + 1}`}
                      className="max-h-full max-w-full object-contain"
                      initial={{ opacity: 0, scale: 1.035 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.32, ease }}
                    />
                  </AnimatePresence>
                </button>

                <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex gap-2">
                  <Badge variant="glass" className="bg-white/86 text-surface-800 shadow-soft-xs">
                    <Package className="h-3.5 w-3.5 text-primary-700" />
                    Ready stock
                  </Badge>
                  <Badge variant="warning" className="hidden bg-white/86 shadow-soft-xs sm:inline-flex">
                    <Star className="h-3.5 w-3.5" />
                    Best value
                  </Badge>
                </div>

                <div className="absolute right-2.5 top-2.5 z-10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFavorite((value) => !value)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/82 text-surface-700 shadow-soft-xs backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
                    aria-label="Toggle favorite"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/82 text-surface-700 shadow-soft-xs backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
                    aria-label="Share product"
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/62 to-transparent p-2.5 text-white">
                  <button
                    type="button"
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
                    type="button"
                    onClick={nextImage}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/24 bg-white/16 backdrop-blur-xl transition hover:bg-white/28"
                    aria-label="Next product image"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-2">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-xl border bg-surface-50 transition-all ${
                      selectedImage === index
                        ? 'border-primary-500 ring-2 ring-primary-100'
                        : 'border-surface-200 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Open product image ${index + 1}`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${display.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-contain p-0.5"
                    />
                  </button>
                ))}
              </div>
            </Card>
            </motion.div>

            <motion.section variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <Card className="rounded-[1.75rem]">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Deskripsi</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">Ringkasan kondisi produk</h2>
                  </div>
                  <p className="text-sm leading-7 text-surface-600">{display.description}</p>
                </CardContent>
              </Card>
            </motion.section>

            {shouldShowProductDetailCard({
              category: product.categoryValue,
              color: product.color,
              ram: product.ram,
              processor: product.processor,
              storage: product.storage,
              warranty: product.warranty,
              completeness: product.completeness,
              benchmark: product.benchmark,
              threeUtoolsImages: product.threeUtoolsImages,
            }) && (
              <motion.section variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
                <ProductDetailSpecsCard
                  category={product.categoryValue}
                  color={product.color}
                  ram={product.ram}
                  processor={product.processor}
                  storage={product.storage}
                  warranty={product.warranty}
                  completeness={product.completeness}
                  benchmark={product.benchmark}
                  threeUtoolsImages={product.threeUtoolsImages}
                />
              </motion.section>
            )}

            <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              <motion.div variants={reveal} className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Ulasan Pembeli</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-black sm:text-2xl">{display.reviewCount} ulasan terverifikasi</h2>
              </motion.div>
              <div className="grid gap-3 md:grid-cols-2">
                {reviews.length === 0 ? (
                  <p className="text-sm text-surface-500 md:col-span-2">
                    Belum ada ulasan. Ulasan muncul setelah pembeli menyelesaikan pesanan.
                  </p>
                ) : null}
                {reviews.map((review) => (
                  <motion.article
                    key={review.id}
                    variants={reveal}
                    whileHover={hoverLift}
                    className="rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft-sm hover:shadow-soft-lg"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={
                          review.author.image ??
                          `https://i.pravatar.cc/150?u=${encodeURIComponent(review.author.name)}`
                        }
                        alt={review.author.name}
                        className="h-11 w-11 rounded-2xl border border-surface-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-black">{review.author.name}</h3>
                          <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                            Verified purchase
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500">{review.dateLabel}</p>
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
                    {display.category}
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
                    {display.location}
                    <span className="text-surface-300" aria-hidden>
                      ·
                    </span>
                    <Package className="h-4 w-4 text-surface-500" />
                    <span>
                      Stok <strong className="text-black">{product.stock}</strong>
                    </span>
                  </span>
                </div>

                <div className="relative mt-3.5 overflow-hidden rounded-2xl border border-primary-700/20 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 p-4 shadow-glow-primary">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%)] bg-[length:18px_18px] opacity-40"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-400/25 blur-2xl"
                  />
                  <div className="relative">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-100/90">
                      Harga produk
                    </p>
                    <p className="mt-1.5 text-[1.65rem] font-bold leading-none tracking-tight text-white sm:text-3xl">
                      {formatPrice(product.price)}
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex rounded-xl border border-white/15 bg-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/95 backdrop-blur-sm">
                        {display.stock}
                      </span>
                    </div>
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
                  <Button variant="primary" className="flex-1" onClick={handleBuyNow}>
                    <ShoppingCart className="h-5 w-5" />
                    Beli sekarang
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Chat penjual"
                    title="Chat penjual"
                    onClick={handleChatSeller}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>

                {/* Tombol Bandingkan — hanya untuk kategori HP/Tablet/Laptop */}
                <div className="mt-2">
                  <CompareButton
                    product={{
                      id: product.id,
                      name: product.name,
                      image: product.image,
                      price: product.price,
                      category: product.categoryValue,
                    }}
                    variant="full"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={reveal}>
            <Card className="w-full rounded-[1.35rem]">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-black">Informasi penjual</h2>
                  {display.teknisi.verified && (
                    <Badge variant="success" className="px-2 py-0.5 text-[10px]">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={display.teknisi.image ?? DEFAULT_SELLER_AVATAR(display.teknisi.storeName)}
                    alt={display.teknisi.storeName}
                    className="h-12 w-12 rounded-2xl border border-surface-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-black">{display.teknisi.storeName}</h3>
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary-600" />
                    </div>
                    {display.teknisi.technicianName && (
                      <p className="mt-0.5 truncate text-xs text-surface-500">
                        Teknisi:{' '}
                        <span className="font-medium text-surface-700">{display.teknisi.technicianName}</span>
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-surface-500">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {display.teknisi.rating}
                      </span>
                      <span>{display.teknisi.totalSales} penjualan</span>
                      <span>{display.teknisi.responseTime}</span>
                    </div>
                    <p className="mt-1 text-xs text-surface-500">{display.teknisi.location}</p>
                  </div>
                </div>

                <Link href={`/toko/${display.storeId}`} className="mt-4 block">
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
                    {
                      title: 'Pembayaran aman',
                      desc: 'Saldo di-hold hingga pesanan selesai',
                      icon: CreditCard,
                    },
                    {
                      title: 'Chat langsung',
                      desc: 'Tanya penjual sebelum membeli',
                      icon: MessageCircle,
                    },
                    {
                      title: 'Komplain terstruktur',
                      desc: 'Mediasi platform jika barang tidak sesuai',
                      icon: Scales,
                    },
                    {
                      title: 'Bandingkan unit',
                      desc: 'Bandingkan spesifikasi & kondisi secara objektif',
                      icon: CheckSquare,
                    },
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
          <Button variant="primary" size="sm" onClick={handleBuyNow}>
            <ShoppingCart className="h-4 w-4" />
            Beli
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Chat penjual"
            title="Chat penjual"
            onClick={handleChatSeller}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MobileSafeAreaSpacer />
      <BottomNav />

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Foto produk ukuran penuh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/92 p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation()
                setLightboxOpen(false)
              }}
              aria-label="Tutup foto"
            >
              <X className="h-5 w-5" />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-6"
                  onClick={(event) => {
                    event.stopPropagation()
                    prevImage()
                  }}
                  aria-label="Foto sebelumnya"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-6"
                  onClick={(event) => {
                    event.stopPropagation()
                    nextImage()
                  }}
                  aria-label="Foto berikutnya"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={galleryImages[selectedImage]}
                alt={`${display.name} — foto ${selectedImage + 1} ukuran penuh`}
                className="max-h-[min(90dvh,100%)] max-w-[min(92vw,100%)] h-auto w-auto object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease }}
                onClick={(event) => event.stopPropagation()}
              />
            </AnimatePresence>

            {galleryImages.length > 1 && (
              <p className="pointer-events-none mt-4 text-sm font-medium text-white/75">
                {selectedImage + 1} / {galleryImages.length}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}