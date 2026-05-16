'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  bannerBadgeClass,
  bannerCtaButtonClass,
  bannerCtaWrapClass,
} from '@/components/shared/banner-slide-styles'

const banners = [
  {
    id: 1,
    title: 'Flash Sale Mobile Legends',
    subtitle: 'Diskon hingga 15% untuk semua paket Diamonds',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&h=600&fit=crop',
    link: '/topup/mobile-legends',
    buttonText: 'Top up sekarang',
  },
  {
    id: 2,
    title: 'Free Fire Diamonds Promo',
    subtitle: 'Bonus 10% extra diamonds untuk pembelian pertama',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&h=600&fit=crop',
    link: '/topup/free-fire',
    buttonText: 'Beli diamonds',
  },
  {
    id: 3,
    title: 'Pulsa & Paket Data Murah',
    subtitle: 'Telkomsel, XL, Indosat — proses instan 24/7',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1600&h=600&fit=crop',
    link: '/topup/pulsa-telkomsel',
    buttonText: 'Isi pulsa',
  },
  {
    id: 4,
    title: 'Voucher Google Play & Spotify',
    subtitle: 'Aktivasi instan, harga terbaik se-Indonesia',
    image: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=1600&h=600&fit=crop',
    link: '/topup/voucher-google-play',
    buttonText: 'Lihat voucher',
  },
] as const

export function TopupBannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAuto, setIsAuto] = useState(true)

  useEffect(() => {
    if (!isAuto) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5500)
    return () => clearInterval(interval)
  }, [isAuto])

  const pause = () => {
    setIsAuto(false)
    window.setTimeout(() => setIsAuto(true), 6500)
  }

  const goTo = (i: number) => { pause(); setCurrentIndex(i) }
  const prev = () => { pause(); setCurrentIndex((p) => (p - 1 + banners.length) % banners.length) }
  const next = () => { pause(); setCurrentIndex((p) => (p + 1) % banners.length) }

  return (
    <div className="relative mb-6 h-48 w-full overflow-hidden rounded-3xl border border-surface-200/70 shadow-soft-md sm:h-64 lg:h-80">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[currentIndex].id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            <Image
              src={banners[currentIndex].image}
              alt={banners[currentIndex].title}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl text-white">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={bannerBadgeClass}
                  >
                    Promo terbatas
                  </motion.span>

                  <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tightest sm:text-3xl lg:text-[42px]"
                  >
                    {banners[currentIndex].title}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 text-sm text-white/85 sm:text-base lg:text-lg"
                  >
                    {banners[currentIndex].subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={bannerCtaWrapClass}
                  >
                    <Link href={banners[currentIndex].link}>
                      <Button size="sm" variant="primary" className={bannerCtaButtonClass}>
                        {banners[currentIndex].buttonText}
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25 sm:left-4 sm:h-10 sm:w-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25 sm:right-4 sm:h-10 sm:w-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-450',
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-1.5 bg-white/50 hover:bg-white/80',
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
