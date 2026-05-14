'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Clock, 
  Users, 
  Smartphone,
  Globe,
  Shield,
  Zap
} from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: 'Marketplace Terintegrasi',
    description: 'Jual beli handphone, laptop, aksesoris, dan software tools dengan sistem rating & review yang terpercaya.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    icon: Users,
    title: 'Teknisi Online',
    description: 'Konsultasi langsung dengan teknisi handphone berpengalaman secara real-time. Dari unlock hingga hardware repair.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    icon: Briefcase,
    title: 'Promosi Toko HP',
    description: 'Platform untuk toko handphone promosi layanan service, jual beli, dengan sistem review dan badge terpercaya.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    icon: Clock,
    title: 'Lowongan Kerja',
    description: 'Cari kesempatan karir sebagai teknisi handphone. Banyak lowongan dari toko dan service center terpercaya.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    icon: Shield,
    title: 'Jasa Rekber (Escrow)',
    description: 'Transaksi aman dengan sistem rekening bersama. Buyer dan seller terlindungi dengan mediator admin.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    icon: Globe,
    title: 'Chat System Real-time',
    description: 'Komunikasi langsung antara user, teknisi, dan admin. Dengan indikator online/offline dan unread messages.',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4">
            Platform lengkap untuk
            <span className="text-primary-600"> ekosistem teknisi</span>
          </h2>
          <p className="text-lg text-surface-600">
            Semua yang Anda butuhkan untuk bisnis handphone dalam satu platform terintegrasi
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-2xl p-6 border border-surface-200 hover:border-surface-300 transition-all duration-300 hover:shadow-xl hover:shadow-surface-900/5 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.textColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-600 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300`} />
            </div>
          ))}
        </div>

        {/* Cross-Platform Section */}
        <div className="mt-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="success" className="mb-4">Cross-Platform</Badge>
            <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4">
              Akses dari mana saja,
              <br />
              <span className="text-primary-600">kapan saja</span>
            </h3>
            <p className="text-lg text-surface-600 mb-8">
              Platform web dan mobile yang selalu tersinkronisasi. Kelola marketplace, konsultasi, dan transaksi Anda dari perangkat apapun.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Smartphone className="w-5 h-5 text-primary-600" />
                <span>Mobile App</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Globe className="w-5 h-5 text-primary-600" />
                <span>Web App</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Zap className="w-5 h-5 text-primary-600" />
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>

          {/* Device Mockups */}
          <div className="relative">
            {/* Desktop Mockup */}
            <div className="bg-black rounded-2xl p-2 shadow-2xl animate-float">
              <div className="bg-white rounded-lg aspect-[16/10] p-4">
                <div className="flex gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-2">
                    <div className="h-3 bg-surface-100 rounded" />
                    <div className="h-3 bg-surface-100 rounded w-3/4" />
                    <div className="h-3 bg-surface-100 rounded w-1/2" />
                  </div>
                  <div className="col-span-2 bg-surface-50 rounded-lg p-2">
                    <div className="h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg mb-2" />
                    <div className="h-2 bg-surface-200 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="absolute -bottom-8 -right-4 w-32 z-20" style={{animation: 'float 5s ease-in-out infinite reverse'}}>
              <div className="bg-black rounded-3xl p-1.5 shadow-2xl">
                <div className="bg-white rounded-2xl aspect-[9/19] p-2">
                  <div className="w-12 h-1 bg-surface-200 rounded-full mx-auto mb-2" />
                  <div className="space-y-1.5">
                    <div className="h-8 bg-gradient-to-r from-primary-100 to-accent-100 rounded-lg" />
                    <div className="h-2 bg-surface-100 rounded" />
                    <div className="h-2 bg-surface-100 rounded w-3/4" />
                    <div className="h-6 bg-surface-50 rounded-lg mt-2" />
                    <div className="h-6 bg-surface-50 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
