'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/motion'
import { Menu, X, Zap } from '@/lib/icons'

const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/teknisi', label: 'Teknisi' },
  { href: '/toko', label: 'Toko' },
  { href: '/topup', label: 'Top Up' },
  { href: '/remote', label: 'Remote' },
  { href: '/lowongan', label: 'Lowongan' },
  { href: '/rekber', label: 'Rekber' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const containerWidth = useTransform(scrollY, [0, 200], ['100%', '92%'])
  const containerY = useTransform(scrollY, [0, 200], [0, 8])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 pt-3 sm:px-6"
    >
      {/* Inset, floating command-bar — animates width on scroll */}
      <motion.nav
        style={{ maxWidth: containerWidth, y: containerY }}
        className={[
          'mx-auto w-full max-w-7xl rounded-full',
          'transition-[background,backdrop-filter,box-shadow,border-color] duration-450 ease-out-expo',
          isScrolled
            ? 'glass-strong border border-surface-200/70 shadow-soft-md'
            : 'border border-transparent bg-white/40 backdrop-blur-md',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 lg:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group/logo">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary transition-transform duration-450 group-hover/logo:scale-[1.06]">
              <Zap weight="fill" className="h-4.5 w-4.5 text-white" />
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent opacity-60" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-ink">
              IndoTeknizi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 rounded-full border border-surface-200/60 bg-white/60 px-2 py-1 shadow-soft-xs backdrop-blur-md">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-3.5 py-1.5 text-[13px] font-medium text-surface-600 transition-colors duration-300 hover:text-ink"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 rounded-full bg-surface-100/0 transition-colors duration-300 hover:bg-surface-100" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-surface-600 hover:text-ink">
                Masuk
              </Button>
            </Link>
            <Magnetic strength={6}>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Mulai gratis
                </Button>
              </Link>
            </Magnetic>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden -mr-1.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-surface-700 transition-colors hover:bg-surface-100"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden absolute left-3 right-3 top-[calc(100%+8px)] glass-strong rounded-3xl border border-surface-200/70 shadow-soft-lg p-3"
          >
            <div className="space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-[15px] font-medium text-surface-700 transition-colors hover:bg-surface-100/80 hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-2 mt-2 border-t border-surface-200/60 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Masuk
                  </Button>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Daftar
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
