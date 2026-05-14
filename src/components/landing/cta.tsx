'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl" />

      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-sm text-white/80">Mulai gratis hari ini</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6">
          Siap mengembangkan bisnis
          <br />
          <span className="text-primary-400">teknisi handphone Anda?</span>
        </h2>

        <p className="text-lg sm:text-xl text-surface-400 mb-10 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan teknisi dan user yang percaya IndoTeknizi untuk mengembangkan bisnis mereka. 
          Daftar gratis tanpa kartu kredit.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button variant="primary" size="xl" className="group">
              Daftar Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" size="xl" className="text-white border-white/20 hover:bg-white/10">
              Lihat Marketplace
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-surface-500">
          <div>✓ Daftar gratis selamanya</div>
          <div>✓ Tanpa kartu kredit</div>
          <div>✓ Batal kapan saja</div>
        </div>
      </div>
    </section>
  )
}
