'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Star, 
  MessageCircle,
  Radio,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'

interface Teknisi {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  rating: number
  reviewCount: number
  totalKonsultasi: number
  totalView: number
  badge: 'newbie' | 'verified' | 'top-teknisi'
  specialty: string[]
  price: number
}

const mockTeknisi: Teknisi[] = [
  {
    id: '1',
    name: 'Ahmad Hidayat',
    avatar: '/api/placeholder/80/80',
    isOnline: true,
    rating: 4.9,
    reviewCount: 234,
    totalKonsultasi: 567,
    totalView: 1234,
    badge: 'top-teknisi',
    specialty: ['Unlock', 'Flashing', 'Root'],
    price: 50000
  },
  {
    id: '2',
    name: 'Budi Santoso',
    avatar: '/api/placeholder/80/80',
    isOnline: true,
    rating: 4.7,
    reviewCount: 189,
    totalKonsultasi: 342,
    totalView: 892,
    badge: 'verified',
    specialty: ['Hardware Repair', 'Screen Replacement'],
    price: 75000
  },
  {
    id: '3',
    name: 'Siti Nurhaliza',
    avatar: '/api/placeholder/80/80',
    isOnline: false,
    rating: 4.8,
    reviewCount: 156,
    totalKonsultasi: 289,
    totalView: 654,
    badge: 'verified',
    specialty: ['Software', 'Virus Removal'],
    price: 45000
  },
  {
    id: '4',
    name: 'Rudi Hartono',
    avatar: '/api/placeholder/80/80',
    isOnline: true,
    rating: 4.5,
    reviewCount: 98,
    totalKonsultasi: 145,
    totalView: 321,
    badge: 'newbie',
    specialty: ['Basic Repair'],
    price: 35000
  },
  {
    id: '5',
    name: 'Dewi Lestari',
    avatar: '/api/placeholder/80/80',
    isOnline: true,
    rating: 4.9,
    reviewCount: 312,
    totalKonsultasi: 678,
    totalView: 1890,
    badge: 'top-teknisi',
    specialty: ['Data Recovery', 'Backup'],
    price: 80000
  },
  {
    id: '6',
    name: 'Eko Prasetyo',
    avatar: '/api/placeholder/80/80',
    isOnline: false,
    rating: 4.6,
    reviewCount: 201,
    totalKonsultasi: 398,
    totalView: 987,
    badge: 'verified',
    specialty: ['Water Damage', 'Board Repair'],
    price: 95000
  },
]

const badgeConfig = {
  newbie: { label: 'Newbie', color: 'bg-blue-100 text-blue-700', icon: Award },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'top-teknisi': { label: 'Top Teknisi', color: 'bg-yellow-100 text-yellow-700', icon: Award },
}

export default function TeknisiListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOnline, setFilterOnline] = useState(false)

  const filteredTeknisi = mockTeknisi.filter(teknisi => {
    const matchesSearch = teknisi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teknisi.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesOnline = !filterOnline || teknisi.isOnline
    return matchesSearch && matchesOnline
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      {/* Header - Hidden on Mobile */}
      <div className="hidden lg:block bg-white border-b border-surface-200 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Daftar Teknisi Online</h1>
          <p className="text-surface-400">Konsultasi langsung dengan teknisi handphone berpengalaman</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <Input
                type="text"
                placeholder="Cari teknisi atau spesialisasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-surface-200 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <Button
              variant={filterOnline ? 'default' : 'outline'}
              onClick={() => setFilterOnline(!filterOnline)}
              className={`h-12 px-6 transition-all ${
                filterOnline 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md' 
                  : 'border-surface-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <Radio className={`w-4 h-4 mr-2 ${filterOnline ? 'text-white' : 'text-surface-400'}`} />
              Hanya Online
            </Button>
          </div>
        </div>

        {/* Online Count */}
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-surface-700">
            {mockTeknisi.filter(t => t.isOnline).length} teknisi online sekarang
          </span>
        </div>

        {/* Teknisi Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 lg:pb-0">
          {filteredTeknisi.map((teknisi) => {
            const BadgeIcon = badgeConfig[teknisi.badge].icon
            return (
              <Link key={teknisi.id} href={`/teknisi/${teknisi.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full border border-surface-200 hover:border-primary-200 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    {/* Profile Section */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-surface-100 group-hover:border-primary-200 transition-colors shadow-sm">
                          <img
                            src={`https://i.pravatar.cc/150?img=${parseInt(teknisi.id)}`}
                            alt={teknisi.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {teknisi.isOnline && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                            {teknisi.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${badgeConfig[teknisi.badge].color} text-xs font-medium px-2 py-0.5`}>
                            <BadgeIcon className="w-3 h-3 mr-1" />
                            {badgeConfig[teknisi.badge].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-white">{teknisi.rating}</span>
                          <span className="text-xs text-surface-500">({teknisi.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Specialty Tags */}
                    <div className="flex flex-wrap gap-2">
                      {teknisi.specialty.map((spec, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs bg-surface-100 text-surface-700 hover:bg-surface-100 transition-colors px-2.5 py-1"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-100">
                      <div className="text-center">
                        <div className="text-xs text-surface-500 mb-1">Konsultasi</div>
                        <div className="text-lg font-bold text-white">{teknisi.totalKonsultasi}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-surface-500 mb-1">Dilihat</div>
                        <div className="text-lg font-bold text-white">{teknisi.totalView}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-surface-100">
                      <div className="text-xs text-surface-500 mb-1">Mulai dari</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {formatPrice(teknisi.price)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className={`flex-1 ${
                          teknisi.isOnline 
                            ? 'bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-md hover:shadow-lg' 
                            : 'bg-surface-100 text-surface-500 cursor-not-allowed'
                        } transition-all duration-200`}
                        disabled={!teknisi.isOnline}
                        size="lg"
                      >
                        {teknisi.isOnline ? 'Konsultasi' : 'Offline'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="px-4 border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {filteredTeknisi.length === 0 && (
          <div className="text-center py-12 pb-20 lg:pb-12">
            <p className="text-surface-500">Tidak ada teknisi yang ditemukan</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

