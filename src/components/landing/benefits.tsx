'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Heart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Tingkatkan Penjualan',
    description: 'Rata-rata teknisi dan toko melihat peningkatan 35% penjualan dalam 3 bulan dengan marketplace terintegrasi.',
    stat: '+35%',
    statLabel: 'peningkatan penjualan',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Clock,
    title: 'Konsultasi Lebih Cepat',
    description: 'Selesaikan masalah handphone dengan lebih cepat melalui konsultasi online real-time dengan teknisi berpengalaman.',
    stat: '3x',
    statLabel: 'lebih cepat',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Shield,
    title: 'Transaksi Aman',
    description: 'Sistem rekber (escrow) melindungi buyer dan seller. Transaksi dilakukan dengan aman melalui mediator admin.',
    stat: '100%',
    statLabel: 'transaksi aman',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Heart,
    title: 'Komunitas Terpercaya',
    description: 'Bergabung dengan komunitas teknisi handphone terbesar di Indonesia. Rating & review membantu membangun kepercayaan.',
    stat: '5,000+',
    statLabel: 'anggota aktif',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
]

const checklistItems = [
  'Marketplace terintegrasi',
  'Konsultasi online real-time',
  'Sistem rekber aman',
  'Rating & review terpercaya',
  'Lowongan kerja teknisi',
  'Chat system real-time',
]

export function Benefits() {
  return (
    <section id="benefits" className="relative py-24 lg:py-32 bg-surface-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
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
          <Badge variant="secondary" className="mb-4">Benefits</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Mengapa teknisi memilih
            <span className="text-primary-400"> IndoTeknizi</span>
          </h2>
          <p className="text-lg text-surface-400">
            Hasil nyata dari pengguna nyata. Lihat bagaimana IndoTeknizi membantu bisnis teknisi berkembang.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center mb-4`}>
                <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
              </div>

              {/* Stat */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-white">{benefit.stat}</p>
                <p className="text-sm text-surface-400">{benefit.statLabel}</p>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-surface-400 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center bg-primary-600/10 rounded-3xl p-8 lg:p-12 border border-white/10">
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Siap mengembangkan bisnis teknisi Anda?
            </h3>
            <p className="text-surface-300 mb-6">
              Bergabunglah dengan ribuan teknisi dan toko yang sudah menggunakan IndoTeknizi.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {checklistItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" className="group">
              Start free trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Stats Visual */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '5,000+', label: 'User Aktif' },
              { value: 'Rp 50M+', label: 'Transaksi Bulanan' },
              { value: '10,000+', label: 'Konsultasi Selesai' },
              { value: '4.8/5', label: 'Rating User' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
              >
                <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-surface-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
