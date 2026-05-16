'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Star, 
  MapPin,
  Clock,
  ShoppingBag,
  Award,
  CheckCircle
} from '@/lib/icons'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { mitraTabs } from '@/lib/section-tab-config'
import { PageHero } from '@/components/shared/page-hero'

interface Toko {
  id: string
  name: string
  image: string
  location: string
  city: string
  rating: number
  reviewCount: number
  totalPenjualan: number
  badge: 'trusted-store' | 'top-seller' | null
  jamOperasional: string
  layanan: string[]
}

const mockToko: Toko[] = [
  {
    id: '1',
    name: 'HandPhone Center Jakarta',
    image: '/api/placeholder/300/200',
    location: 'Jl. Thamrin No. 123',
    city: 'Jakarta',
    rating: 4.8,
    reviewCount: 456,
    totalPenjualan: 2341,
    badge: 'top-seller',
    jamOperasional: '09:00 - 21:00',
    layanan: ['Service HP', 'Jual Beli', 'Unlock', 'Flashing']
  },
  {
    id: '2',
    name: 'TechSolution Store',
    image: '/api/placeholder/300/200',
    location: 'Jl. Sudirman No. 45',
    city: 'Jakarta',
    rating: 4.9,
    reviewCount: 289,
    totalPenjualan: 1890,
    badge: 'trusted-store',
    jamOperasional: '08:00 - 20:00',
    layanan: ['Service HP', 'Jual Beli', 'Aksesoris']
  },
  {
    id: '3',
    name: 'Mobile Repair Bandung',
    image: '/api/placeholder/300/200',
    location: 'Jl. Dago No. 67',
    city: 'Bandung',
    rating: 4.7,
    reviewCount: 234,
    totalPenjualan: 1456,
    badge: null,
    jamOperasional: '10:00 - 19:00',
    layanan: ['Service HP', 'Hardware Repair']
  },
  {
    id: '4',
    name: 'Phone Shop Surabaya',
    image: '/api/placeholder/300/200',
    location: 'Jl. Tunjungan No. 89',
    city: 'Surabaya',
    rating: 4.6,
    reviewCount: 178,
    totalPenjualan: 987,
    badge: 'trusted-store',
    jamOperasional: '09:00 - 20:00',
    layanan: ['Service HP', 'Jual Beli', 'Unlock']
  },
  {
    id: '5',
    name: 'SmartPhone Gallery',
    image: '/api/placeholder/300/200',
    location: 'Jl. Malioboro No. 12',
    city: 'Yogyakarta',
    rating: 4.8,
    reviewCount: 312,
    totalPenjualan: 1678,
    badge: 'top-seller',
    jamOperasional: '09:00 - 21:00',
    layanan: ['Service HP', 'Jual Beli', 'Aksesoris', 'Flashing']
  },
  {
    id: '6',
    name: 'Digital Store Medan',
    image: '/api/placeholder/300/200',
    location: 'Jl. Gatot Subroto No. 34',
    city: 'Medan',
    rating: 4.5,
    reviewCount: 145,
    totalPenjualan: 654,
    badge: null,
    jamOperasional: '10:00 - 19:00',
    layanan: ['Service HP', 'Jual Beli']
  },
]

const cities = ['Semua Kota', 'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan']

const badgeConfig = {
  'trusted-store': { label: 'Trusted Store', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'top-seller': { label: 'Top Seller', color: 'bg-yellow-100 text-yellow-700', icon: Award },
}

export default function TokoListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Semua Kota')

  const filteredToko = mockToko.filter(toko => {
    const matchesSearch = toko.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         toko.layanan.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCity = selectedCity === 'Semua Kota' || toko.city === selectedCity
    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs: mitraTabs, layoutId: 'mitra-section-tab' }}
        badge={{ icon: ShoppingBag, label: 'Toko & service' }}
        title={
          <>
            Promosi toko handphone,
            <span className="block">
              <span className="gradient-text-static">terdekat</span> & terpercaya.
            </span>
          </>
        }
        description="Temukan toko handphone dan service terpercaya di kota Anda."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
              <Input
                type="text"
                placeholder="Cari toko atau layanan…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-11"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-11 rounded-xl border border-surface-200/70 bg-white/70 px-4 text-sm text-surface-700 shadow-soft-xs backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm font-medium text-surface-700">
            Menampilkan <span className="text-primary-600 font-bold">{filteredToko.length}</span> toko
          </div>
        </div>
      </PageHero>

      <main className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 pb-20 sm:gap-4 lg:grid-cols-2 lg:pb-0">
          {filteredToko.map((toko) => {
            const badge = toko.badge ? badgeConfig[toko.badge] : null
            const BadgeIcon = badge?.icon
            
            return (
              <Link key={toko.id} href={`/toko/${toko.id}`}>
                <Card className="group overflow-hidden transition-all duration-300 cursor-pointer h-full border border-surface-200/70 hover:border-primary-200 hover:shadow-soft-lg hover:-translate-y-0.5">
                  <div className="flex gap-3 p-3 sm:p-4">
                    {/* Compact cover image — square thumbnail */}
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100 sm:h-32 sm:w-32">
                      <img
                        src={`https://images.unsplash.com/photo-${toko.id === '1' ? '1556742049-0cfed4f6a45d' : toko.id === '2' ? '1486406146926-c627a92ad1ab' : toko.id === '3' ? '1487958449943-2429e8be8625' : toko.id === '4' ? '1560472355-a3a5a3b3a3a3' : toko.id === '5' ? '1580910051074-3c694ba0100e' : '1513475382585-d06e58bcb0e0'}?w=400&h=400&fit=crop`}
                        alt={toko.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Badge overlay */}
                      {badge && BadgeIcon && (
                        <div className="absolute left-1.5 top-1.5">
                          <Badge className={`${badge.color} text-[9px] px-1.5 py-0.5 shadow-sm`}>
                            <BadgeIcon className="h-2.5 w-2.5 mr-0.5" />
                            {badge.label}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info section */}
                    <div className="min-w-0 flex-1 flex flex-col">
                      {/* Name + location */}
                      <h3 className="text-[14px] font-semibold text-ink line-clamp-1 group-hover:text-primary-700 transition-colors">
                        {toko.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{toko.location}, {toko.city}</span>
                      </div>

                      {/* Rating + sales inline */}
                      <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-ink">{toko.rating}</span>
                          <span className="text-surface-500">({toko.reviewCount})</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-surface-500">
                          <ShoppingBag className="h-3 w-3 text-primary-600" />
                          <span className="font-semibold text-ink">{toko.totalPenjualan.toLocaleString()}</span>
                        </span>
                      </div>

                      {/* Service tags — compact */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {toko.layanan.slice(0, 3).map((layanan, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-surface-700"
                          >
                            {layanan}
                          </span>
                        ))}
                        {toko.layanan.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary-700">
                            +{toko.layanan.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: hours + CTA */}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1 text-[10px] text-surface-500">
                          <Clock className="h-3 w-3 text-primary-600" />
                          <span>{toko.jamOperasional}</span>
                        </div>
                        <Button variant="primary" size="sm" className="h-7 px-3 text-[10px]">
                          Kunjungi
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {filteredToko.length === 0 && (
          <div className="text-center py-16 pb-20 lg:pb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 mb-4">
              <Search className="h-8 w-8 text-surface-400" />
            </div>
            <p className="text-lg font-medium text-surface-700 mb-1">Tidak ada toko yang ditemukan</p>
            <p className="text-sm text-surface-500">Coba ubah filter atau kata kunci pencarian Anda</p>
          </div>
        )}
      </main>
      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
