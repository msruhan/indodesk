'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Star, Quote, ChevronLeft, ChevronRight } from '@/lib/icons'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    name: 'Ahmad Hidayat',
    role: 'Teknisi Handphone',
    avatar: 'AH',
    content:
      'Platform Bantoo sangat membantu bisnis saya. Konsultasi online jadi mudah dan transaksi aman bikin transaksi terasa aman. Revenue saya naik 40%!',
    rating: 5,
  },
  {
    name: 'Budi Santoso',
    role: 'Pemilik Toko',
    avatar: 'BS',
    content:
      'Marketplace di Bantoo sangat membantu promosi. Banyak customer baru datang dari platform ini. Rating dan review membangun kepercayaan dengan cepat.',
    rating: 5,
  },
  {
    name: 'Siti Nurhaliza',
    role: 'User',
    avatar: 'SN',
    content:
      'Konsultasi online sangat memuaskan. Teknisi responsif dan masalah iPhone saya langsung selesai. Sistem transaksi aman juga bikin saya tenang saat beli barang.',
    rating: 5,
  },
  {
    name: 'Rudi Hartono',
    role: 'Teknisi Senior',
    avatar: 'RH',
    content:
      'Dashboard teknisi sangat informatif. Track order, rating, dan saldo terasa effortless. Badge "Top Teknisi" bikin kredibilitas saya naik.',
    rating: 5,
  },
  {
    name: 'Dewi Lestari',
    role: 'User',
    avatar: 'DL',
    content:
      'Marketplace-nya lengkap. Bisa beli handphone second harga oke dan transaksi aman bikin saya tidak khawatir. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Eko Prasetyo',
    role: 'Service Center Owner',
    avatar: 'EP',
    content:
      'Paket Toko sangat worth it. Promosi toko meningkat drastis dan analytics bantu kami pahami customer. ROI sangat bagus!',
    rating: 5,
  },
] as const

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAutoScrolling) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [isAutoScrolling])

  const goLeft = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setTimeout(() => setIsAutoScrolling(true), 7000)
  }

  const goRight = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setTimeout(() => setIsAutoScrolling(true), 7000)
  }

  return (
    <section id="testimonials" className="relative overflow-hidden py-24 lg:py-32">
      {/* Premium light backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/40 to-white" />
      <div className="aurora-blob aurora-blob-emerald pointer-events-none absolute left-1/4 top-1/3 h-[460px] w-[460px] opacity-30" />
      <div className="aurora-blob aurora-blob-cyan pointer-events-none absolute right-1/4 bottom-1/4 h-[420px] w-[420px] opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="primary" className="mb-4">
            <Quote className="h-3 w-3" /> Testimonials
          </Badge>
          <h2 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-5xl">
            Cerita nyata,{' '}
            <span className="gradient-text-static">hasil nyata</span>
          </h2>
          <p className="mt-4 text-pretty text-base text-surface-600 sm:text-lg">
            Apa kata teknisi, toko, dan user kami tentang Bantoo.
          </p>
        </Reveal>

        {/* Carousel */}
        <div className="relative">
          {/* Side gradients to fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

          {/* Arrows */}
          <button
            onClick={goLeft}
            className="group/arr absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full glass-strong border border-surface-200/70 p-3 shadow-soft-md transition-all duration-300 hover:-translate-x-0.5 hover:shadow-soft-lg sm:left-2"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-surface-700 transition-transform group-hover/arr:-translate-x-0.5" />
          </button>
          <button
            onClick={goRight}
            className="group/arr absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full glass-strong border border-surface-200/70 p-3 shadow-soft-md transition-all duration-300 hover:translate-x-0.5 hover:shadow-soft-lg sm:right-2"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 text-surface-700 transition-transform group-hover/arr:translate-x-0.5" />
          </button>

          {/* Track */}
          <div className="overflow-hidden mx-8 sm:mx-12">
            <motion.div
              ref={trackRef}
              className="flex"
              animate={{
                x: `calc(-${currentIndex * (100 / 3)}% - ${currentIndex * 1.25}rem)`,
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {[...testimonials, ...testimonials].map((t, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${t.name}-${index}`}
                  className="w-full flex-shrink-0 px-2.5 sm:w-1/2 lg:w-1/3"
                >
                  <motion.article
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full rounded-2xl border border-surface-200/70 bg-white/90 p-6 shadow-soft-sm backdrop-blur-md transition-shadow duration-450 hover:shadow-soft-lg"
                  >
                    <Quote className="absolute right-5 top-5 h-7 w-7 text-primary-100" />

                    <div className="mb-3 flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} weight="fill" className="h-3.5 w-3.5 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-[15px] leading-relaxed text-surface-700">
                      &ldquo;{t.content}&rdquo;
                    </p>

                    <div className="mt-6 flex items-center gap-3 border-t border-surface-200/60 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white shadow-soft-xs">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{t.name}</p>
                        <p className="text-xs text-surface-500">{t.role}</p>
                      </div>
                    </div>
                  </motion.article>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-9 flex items-center justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoScrolling(false)
                setCurrentIndex(index)
                setTimeout(() => setIsAutoScrolling(true), 7000)
              }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-450',
                index === currentIndex
                  ? 'w-9 bg-gradient-to-r from-primary-600 to-accent-500'
                  : 'w-1.5 bg-surface-300 hover:bg-surface-400',
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
