'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { MarketplaceBanner } from '@/lib/marketplace-banners'
import type { BannerPlacement } from '@/lib/marketplace-banners'
import {
  bannerBadgeClass,
  bannerCtaButtonClass,
  bannerCtaWrapClass,
} from '@/components/shared/banner-slide-styles'

type BannerSliderProps = {
  placement: BannerPlacement
}

export function BannerSlider({ placement }: BannerSliderProps) {
  const [banners, setBanners] = useState<MarketplaceBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAuto, setIsAuto] = useState(true)

  const refreshBanners = useCallback(async () => {
    try {
      const res = await fetch(`/api/banners?placement=${placement}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setBanners(json.data ?? [])
        setCurrentIndex(0)
      }
    } catch {
      setBanners([])
    }
  }, [placement])

  useEffect(() => {
    void refreshBanners()
  }, [refreshBanners])

  useEffect(() => {
    if (!isAuto || banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5500)
    return () => clearInterval(interval)
  }, [isAuto, banners.length])

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

  if (banners.length === 0) {
    return null
  }

  const current = banners[currentIndex]

  return (
    <motion.div className="relative mb-6 h-48 w-full overflow-hidden rounded-3xl border border-surface-200/70 shadow-soft-md sm:h-64 lg:h-80">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            <Image
              src={current.image}
              alt={current.title}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
            <motion.div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl text-white">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={bannerBadgeClass}
                  >
                    Limited time
                  </motion.span>

                  <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tightest sm:text-3xl lg:text-[42px]"
                  >
                    {current.title}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 text-sm text-white/85 sm:text-base lg:text-lg"
                  >
                    {current.subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={bannerCtaWrapClass}
                  >
                    <Link href={current.link}>
                      <Button size="sm" variant="primary" className={bannerCtaButtonClass}>
                        {current.buttonText}
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
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
        </>
      )}
    </motion.div>
  )
}
