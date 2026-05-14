'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Ahmad Hidayat',
    role: 'Teknisi Handphone',
    avatar: 'AH',
    content: 'Platform IndoTeknizi sangat membantu bisnis saya. Sekarang saya bisa menerima konsultasi online dengan mudah dan sistem rekber membuat transaksi lebih aman. Revenue meningkat 40%!',
    rating: 5,
  },
  {
    name: 'Budi Santoso',
    role: 'Pemilik Toko HP',
    avatar: 'BS',
    content: 'Sebagai pemilik toko, marketplace di IndoTeknizi sangat membantu promosi. Banyak customer baru yang datang dari platform ini. Rating dan review membantu membangun kepercayaan.',
    rating: 5,
  },
  {
    name: 'Siti Nurhaliza',
    role: 'User',
    avatar: 'SN',
    content: 'Saya puas sekali dengan konsultasi online di IndoTeknizi. Teknisi sangat responsif dan masalah iPhone saya langsung terselesaikan. Sistem rekber juga membuat saya merasa aman saat beli barang.',
    rating: 5,
  },
  {
    name: 'Rudi Hartono',
    role: 'Teknisi Senior',
    avatar: 'RH',
    content: 'Dashboard teknisi sangat informatif. Saya bisa track semua order, rating, dan saldo dengan mudah. Badge "Top Teknisi" membantu meningkatkan kredibilitas saya.',
    rating: 5,
  },
  {
    name: 'Dewi Lestari',
    role: 'User',
    avatar: 'DL',
    content: 'Marketplace-nya lengkap! Saya bisa beli handphone second dengan harga terjangkau dan transaksi rekber membuat saya tidak perlu khawatir. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Eko Prasetyo',
    role: 'Service Center Owner',
    avatar: 'EP',
    content: 'Paket Toko di IndoTeknizi sangat worth it! Promosi toko kami meningkat drastis dan fitur analytics membantu kami memahami customer behavior. ROI sangat bagus!',
    rating: 5,
  },
  {
    name: 'Fajar Pratama',
    role: 'Teknisi Handphone',
    avatar: 'FP',
    content: 'Sistem konsultasi online sangat memudahkan. Saya bisa membantu customer dari berbagai daerah tanpa harus bertemu langsung. Platform ini benar-benar inovatif!',
    rating: 5,
  },
  {
    name: 'Maya Sari',
    role: 'User',
    avatar: 'MS',
    content: 'Rating dan review system membantu saya memilih teknisi terbaik. Setiap transaksi terasa aman dengan sistem rekber. Terima kasih IndoTeknizi!',
    rating: 5,
  },
]

// Duplicate testimonials for infinite scroll
const duplicatedTestimonials = [...testimonials, ...testimonials]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAutoScrolling) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1
        // Reset to 0 when reaching the end of original testimonials
        if (nextIndex >= testimonials.length) {
          return 0
        }
        return nextIndex
      })
    }, 4000) // Auto scroll every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoScrolling])

  const scrollLeft = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setTimeout(() => setIsAutoScrolling(true), 6000)
  }

  const scrollRight = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1
      return nextIndex >= testimonials.length ? 0 : nextIndex
    })
    setTimeout(() => setIsAutoScrolling(true), 6000)
  }

  return (
    <section id="testimonials" className="relative py-24 lg:py-32 overflow-hidden bg-primary-800">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary-600/20 text-primary-300 border-primary-500/30">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Real Stories, Real Success
          </h2>
          <p className="text-lg text-primary-200">
            Authentic feedback from our valued subscribers
          </p>
        </div>

        {/* Infinite Scrolling Testimonials */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slider Container */}
          <div className="overflow-hidden mx-12">
            <motion.div
              ref={scrollRef}
              className="flex gap-6"
              animate={{
                x: `calc(-${currentIndex * (100 / 4)}% - ${currentIndex * 1.5}rem)`,
              }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.name}-${index}`}
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/4"
                >
                  <div className="relative bg-primary-700/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-600/30 hover:border-primary-500/50 transition-all duration-300 h-full mx-3">
                    {/* Quote Icon */}
                    <div className="absolute top-6 right-6 opacity-20">
                      <Quote className="w-8 h-8 text-primary-300" />
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500/30 flex items-center justify-center text-white font-medium text-sm border border-primary-400/30">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-primary-300">{testimonial.name}</p>
                        <p className="text-sm text-primary-400">{testimonial.role}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-white leading-relaxed text-sm">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary-400 w-8'
                  : 'bg-primary-600/50 hover:bg-primary-500/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
