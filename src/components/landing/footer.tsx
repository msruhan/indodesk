'use client'

import Link from 'next/link'
import { Twitter, Linkedin, Github, Instagram } from '@/lib/icons'
import { BrandLogo } from '@/components/brand/brand-logo'

const footerLinks = {
  product: {
    title: 'Platform',
    links: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Teknisi Online', href: '/teknisi' },
      { label: 'Toko', href: '/toko' },
      { label: 'Lowongan Kerja', href: '/lowongan' },
      { label: 'Jasa Rekber', href: '/rekber' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Chat', href: '/chat' },
      { label: 'Help Center', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Community', href: '#' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '/lowongan' },
      { label: 'Press', href: '#' },
      { label: 'Partners', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
}

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Instagram, href: '#', label: 'Instagram' },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-surface-200/70 bg-gradient-to-b from-white to-surface-50/60">
      {/* Subtle aurora wash */}
      <div className="aurora-blob aurora-blob-emerald pointer-events-none absolute -left-32 -top-32 h-[400px] w-[400px] opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center">
              <BrandLogo variant="wordmark" wordmarkClassName="h-8" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-surface-600">
              Platform ekosistem teknisi handphone terintegrasi — marketplace, konsultasi online, dan
              manajemen bisnis dalam satu pengalaman premium.
            </p>
            <div className="mt-6 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200/70 bg-white/80 text-surface-600 shadow-soft-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-surface-300 hover:bg-white hover:text-ink hover:shadow-soft-md"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-surface-500">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-600 transition-colors duration-300 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-200/70 pt-7 sm:flex-row">
          <p className="text-xs text-surface-500">
            © {new Date().getFullYear()} IndoTeknizi. Crafted with care.
          </p>
          <div className="flex items-center gap-5 text-xs text-surface-500">
            <Link href="#" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-ink">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
