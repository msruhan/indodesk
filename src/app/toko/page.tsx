'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Star, 
  MapPin,
  Clock,
  ShoppingBag,
  Award,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'

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
    <div className="min-h-screen bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      {/* Header - Hidden on Mobile */}
      <div className="hidden lg:block bg-white border-b border-surface-200 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Promosi Toko Handphone</h1>
          <p className="text-surface-400">Temukan toko handphone dan service terpercaya di kota Anda</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <Input
                type="text"
                placeholder="Cari toko atau layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-surface-200 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm h-12 focus:border-primary-500 focus:ring-primary-500 focus:outline-none transition-colors"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-surface-700">
              Menampilkan <span className="text-primary-600 font-bold">{filteredToko.length}</span> toko
            </div>
          </div>
        </div>

        {/* Toko Grid - Modern Layout with Large Image Cover */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 lg:pb-0">
          {filteredToko.map((toko) => {
            const badge = toko.badge ? badgeConfig[toko.badge] : null
            const BadgeIcon = badge?.icon
            
            return (
              <Link key={toko.id} href={`/toko/${toko.id}`}>
                <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer h-full border border-surface-200 hover:border-primary-300">
                  {/* Large Cover Image with Gradient Overlay */}
                  <div className="relative w-full h-64 bg-surface-100 overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/photo-${toko.id === '1' ? '1556742049-0cfed4f6a45d' : toko.id === '2' ? '1486406146926-c627a92ad1ab' : toko.id === '3' ? '1487958449943-2429e8be8625' : toko.id === '4' ? '1560472355-a3a5a3b3a3a3' : toko.id === '5' ? '1580910051074-3c694ba0100e' : '1513475382585-d06e58bcb0e0'}?w=800&h=500&fit=crop`}
                      alt={toko.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Badge - Top Right */}
                    {badge && BadgeIcon && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className={`${badge.color} text-xs font-semibold px-3 py-1.5 shadow-lg`}>
                          <BadgeIcon className="w-3.5 h-3.5 mr-1.5" />
                          {badge.label}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Store Info Overlay - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-bold mb-1">{toko.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <MapPin className="w-4 h-4" />
                        <span>{toko.location}, {toko.city}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Rating & Stats Row */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg font-bold text-white">{toko.rating}</span>
                          <span className="text-sm text-surface-500">({toko.reviewCount})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-surface-400">
                          <ShoppingBag className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold">{toko.totalPenjualan.toLocaleString()}</span>
                          <span className="text-surface-500">penjualan</span>
                        </div>
                      </div>
                    </div>

                    {/* Services Tags */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                        Layanan Tersedia
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {toko.layanan.map((layanan, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 font-medium"
                          >
                            {layanan}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Gallery */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
                          Galeri Toko
                        </div>
                        <span className="text-xs text-primary-600 font-medium">
                          Lihat foto
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className="relative h-16 rounded-lg overflow-hidden bg-surface-100"
                          >
                            <img
                              src={`https://images.unsplash.com/photo-${
                                toko.id === '1'
                                  ? idx === 1
                                    ? '1556740749-887f6717d7e4'
                                    : idx === 2
                                    ? '1517248135467-4c7edcad34c4'
                                    : '1520607162513-77705c0f0d4a'
                                  : toko.id === '2'
                                  ? idx === 1
                                    ? '1485846234645-a62644f84728'
                                    : idx === 2
                                    ? '1515165562835-c4c9e0737eaa'
                                    : '1498050108023-c5249f4df085'
                                  : toko.id === '3'
                                  ? idx === 1
                                    ? '1490111718993-d98654ce6cf7'
                                    : idx === 2
                                    ? '1484300681262-5cca666b095e'
                                    : '1520607162513-77705c0f0d4a'
                                  : toko.id === '4'
                                  ? idx === 1
                                    ? '1504274066651-8d31a536b11a'
                                    : idx === 2
                                    ? '1479839672679-a46483c0e7c8'
                                    : '1441986300917-64674bd600d8'
                                  : toko.id === '5'
                                  ? idx === 1
                                    ? '1517244861115-54b9d993edc1'
                                    : idx === 2
                                    ? '1521292270410-a8c53642e9d0'
                                    : '1517248135467-4c7edcad34c4'
                                  : idx === 1
                                  ? '1504274066651-8d31a536b11a'
                                  : idx === 2
                                  ? '1498050108023-c5249f4df085'
                                  : '1484300681262-5cca666b095e'
                              }?w=400&h=300&fit=crop`}
                              alt={`${toko.name} - foto ${idx}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="text-xs text-surface-500">Jam Operasional</div>
                          <div className="text-sm font-semibold text-white">{toko.jamOperasional}</div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-md hover:shadow-lg transition-all duration-200 h-12 text-base font-semibold"
                      size="lg"
                    >
                      Kunjungi Toko
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {filteredToko.length === 0 && (
          <div className="text-center py-16 pb-20 lg:pb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 mb-4">
              <Search className="w-8 h-8 text-surface-400" />
            </div>
            <p className="text-lg font-medium text-surface-700 mb-1">Tidak ada toko yang ditemukan</p>
            <p className="text-sm text-surface-500">Coba ubah filter atau kata kunci pencarian Anda</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

