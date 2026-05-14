'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const banners = [
  {
    id: 1,
    title: 'Promo Spesial Handphone',
    subtitle: 'Diskon hingga 30% untuk semua produk handphone',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1600&h=600&fit=crop',
    link: '/marketplace?category=handphone',
    buttonText: 'Beli sekarang',
  },
  {
    id: 2,
    title: 'Laptop Terbaru 2024',
    subtitle: 'Koleksi laptop terbaru dengan harga terbaik',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&h=600&fit=crop',
    link: '/marketplace?category=laptop',
    buttonText: 'Lihat koleksi',
  },
  {
    id: 3,
    title: 'Aksesoris Premium',
    subtitle: 'Lengkapi perangkat Anda dengan aksesoris berkualitas',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=600&fit=crop',
    link: '/marketplace?category=aksesoris',
    buttonText: 'Jelajahi',
  },
  {
    id: 4,
    title: 'Software & Tools',
    subtitle: 'Tools profesional untuk teknisi handphone',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&h=600&fit=crop',
    link: '/marketplace?category=software',
    buttonText: 'Cek software',
  },
] as const

export function BannerSlider() {
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

  const goTo = (i: number) => {
    pause()
    setCurrentIndex(i)
  }
  const prev = () => {
    pause()
    setCurrentIndex((p) => (p - 1 + banners.length) % banners.length)
  }
  const next = () => {
    pause()
    setCurrentIndex((p) => (p + 1) % banners.length)
  }

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
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl text-white">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
                  >
                    Limited time
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
                    className="mt-5"
                  >
                    <Link href={banners[currentIndex].link}>
                      <Button size="lg" variant="primary">
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
