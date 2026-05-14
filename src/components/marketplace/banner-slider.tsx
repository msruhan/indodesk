'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

const banners = [
  {
    id: 1,
    title: 'Promo Spesial Handphone',
    subtitle: 'Diskon hingga 30% untuk semua produk handphone',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&h=400&fit=crop',
    link: '/marketplace?category=handphone',
    buttonText: 'Beli Sekarang',
  },
  {
    id: 2,
    title: 'Laptop Terbaru 2024',
    subtitle: 'Koleksi laptop terbaru dengan harga terbaik',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=400&fit=crop',
    link: '/marketplace?category=laptop',
    buttonText: 'Lihat Koleksi',
  },
  {
    id: 3,
    title: 'Aksesoris Premium',
    subtitle: 'Lengkapi perangkat Anda dengan aksesoris berkualitas',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop',
    link: '/marketplace?category=aksesoris',
    buttonText: 'Jelajahi',
  },
  {
    id: 4,
    title: 'Software & Tools',
    subtitle: 'Tools profesional untuk teknisi handphone',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=400&fit=crop',
    link: '/marketplace?category=software',
    buttonText: 'Cek Software',
  },
]

export function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)

  useEffect(() => {
    if (!isAutoScrolling) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Auto scroll every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoScrolling])

  const goToSlide = (index: number) => {
    setIsAutoScrolling(false)
    setCurrentIndex(index)
    setTimeout(() => setIsAutoScrolling(true), 6000)
  }

  const goToPrevious = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    setTimeout(() => setIsAutoScrolling(true), 6000)
  }

  const goToNext = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev + 1) % banners.length)
    setTimeout(() => setIsAutoScrolling(true), 6000)
  }

  return (
    <div className="relative w-full h-48 sm:h-64 lg:h-80 overflow-hidden rounded-xl lg:rounded-2xl mb-6">
      {/* Banner Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <Image
              src={banners[currentIndex].image}
              alt={banners[currentIndex].title}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="100vw"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3"
                  >
                    {banners[currentIndex].title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm sm:text-base lg:text-lg text-white/90 mb-4 sm:mb-6"
                  >
                    {banners[currentIndex].subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link href={banners[currentIndex].link}>
                      <Button
                        size="lg"
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
                      >
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

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

