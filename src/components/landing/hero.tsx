'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, CheckCircle, Star } from 'lucide-react'


export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="animate-fade-up">
            <Badge variant="outline" className="mb-6 px-4 py-2 gap-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Trusted by 5,000+ teknisi & user</span>
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-black mb-6 animate-fade-up" style={{animationDelay: '0.1s'}}>
            Kembangkan Bisnis Anda dengan
            <br />
            <span className="text-primary-600">Ekosistem Teknisi Handphone Terintegrasi</span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-surface-600 mb-8 animate-fade-up" style={{animationDelay: '0.2s'}}>
            Platform ekosistem teknisi handphone terintegrasi untuk jual beli, konsultasi, promosi toko, dan lowongan kerja. 
            Dari teknisi berpengalaman hingga user, kami menghubungkan Anda.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up" style={{animationDelay: '0.3s'}}>
            <Link href="/register">
              <Button size="lg" variant="primary" className="group">
                Mulai Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="gap-2 border-black text-black hover:bg-black hover:text-white">
                <Play className="w-4 h-4" />
                Lihat Marketplace
              </Button>
            </Link>
          </div>

          {/* Features List */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-surface-500 mb-16 animate-fade-up" style={{animationDelay: '0.4s'}}>
            {['Tanpa kartu kredit', 'Daftar gratis selamanya', 'Batal kapan saja'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto animate-fade-up" style={{animationDelay: '0.5s'}}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-surface-900/20 border border-surface-200">
              {/* Browser Chrome */}
              <div className="bg-surface-100 border-b border-surface-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-surface-400 border border-surface-200">
                    indoteknizi.app/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Image Placeholder */}
              <div className="bg-gradient-to-br from-surface-50 to-surface-100 aspect-[16/9] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-4xl">
                  {/* Stats Cards Preview */}
                  {[
                    { label: 'Total Teknisi', value: '234', color: 'from-primary-500 to-primary-600' },
                    { label: 'Total Transaksi', value: '5,678', color: 'from-primary-500 to-primary-600' },
                    { label: 'Konsultasi Aktif', value: '456', color: 'from-primary-500 to-primary-600' },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-xl p-4 shadow-lg border border-surface-200"
                      style={{animationDelay: `${0.7 + i * 0.1}s`}}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} mb-3`} />
                      <p className="text-sm text-surface-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-4 top-1/4 bg-white rounded-xl p-3 shadow-xl border border-surface-200 hidden lg:block animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-900">Order Completed</p>
                  <p className="text-xs text-surface-500">+Rp 2.400.000</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 bottom-1/4 bg-white rounded-xl p-3 shadow-xl border border-surface-200 hidden lg:block" style={{animation: 'float 5s ease-in-out infinite reverse'}}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-900">Review Baru</p>
                  <p className="text-xs text-surface-500">⭐⭐⭐⭐⭐</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By */}
          <div className="mt-16 animate-fade-in" style={{animationDelay: '1s'}}>
            <p className="text-sm text-surface-400 mb-6">Dipercaya oleh toko handphone, teknisi, dan service center terbaik</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 opacity-50">
              {['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Bali'].map((city) => (
                <div key={city} className="text-xl font-bold text-surface-400">
                  {city}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
