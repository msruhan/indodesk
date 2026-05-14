'use client'

import Link from 'next/link'
import { Zap, Twitter, Linkedin, Github, Instagram } from 'lucide-react'

const footerLinks = {
  product: {
    title: 'Platform',
    links: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Teknisi Online', href: '/teknisi' },
      { label: 'Toko HP', href: '/toko' },
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
    <footer className="bg-surface-50 border-t border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-black">IndoTeknizi</span>
            </Link>
            <p className="text-surface-600 text-sm mb-6 max-w-xs">
              Platform ekosistem teknisi handphone terintegrasi - marketplace, konsultasi online, dan manajemen bisnis.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-300 hover:text-surface-900 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-surface-900 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} IndoTeknizi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-surface-500">
            <Link href="#" className="hover:text-surface-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-surface-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-surface-900 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
