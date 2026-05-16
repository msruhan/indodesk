'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { SectionTabs } from '@/components/mobile/section-tabs'
import { marketplaceTabs } from '@/lib/section-tab-config'
import { BannerSlider } from '@/components/marketplace/banner-slider'
import { Reveal, AuroraBackground } from '@/components/motion'
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  Smartphone,
  Laptop,
  Headphones,
  Code,
  ChevronDown,
  ShoppingBag
} from '@/lib/icons'
import Link from 'next/link'

type ProductCategory = 'all' | 'handphone' | 'laptop' | 'aksesoris' | 'software'

interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  image: string
  rating: number
  reviewCount: number
  views: number
  teknisiName: string
  teknisiAvatar: string
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 13 Pro Max - Second',
    category: 'handphone',
    price: 8500000,
    image: '/api/placeholder/300/300',
    rating: 4.8,
    reviewCount: 124,
    views: 2341,
    teknisiName: 'TechSolution',
    teknisiAvatar: '/api/placeholder/40/40'
  },
  {
    id: '2',
    name: 'Samsung S21 Ultra - Refurbished',
    category: 'handphone',
    price: 7200000,
    image: '/api/placeholder/300/300',
    rating: 4.6,
    reviewCount: 89,
    views: 1892,
    teknisiName: 'HandPhone Center',
    teknisiAvatar: '/api/placeholder/40/40'
  },
  {
    id: '3',
    name: 'MacBook Air M2 2023',
    category: 'laptop',
    price: 18500000,
    image: '/api/placeholder/300/300',
    rating: 4.9,
    reviewCount: 56,
    views: 3124,
    teknisiName: 'Apple Store Official',
    teknisiAvatar: '/api/placeholder/40/40'
  },
  {
    id: '4',
    name: 'Wireless Charger Fast Charging',
    category: 'aksesoris',
    price: 250000,
    image: '/api/placeholder/300/300',
    rating: 4.5,
    reviewCount: 234,
    views: 4567,
    teknisiName: 'Accesories Pro',
    teknisiAvatar: '/api/placeholder/40/40'
  },
  {
    id: '5',
    name: 'Unlock Tool Premium License',
    category: 'software',
    price: 500000,
    image: '/api/placeholder/300/300',
    rating: 4.7,
    reviewCount: 167,
    views: 2891,
    teknisiName: 'Unlock Master',
    teknisiAvatar: '/api/placeholder/40/40'
  },
  {
    id: '6',
    name: 'Xiaomi Redmi Note 12 Pro',
    category: 'handphone',
    price: 4200000,
    image: '/api/placeholder/300/300',
    rating: 4.4,
    reviewCount: 98,
    views: 1654,
    teknisiName: 'Mi Store Jakarta',
    teknisiAvatar: '/api/placeholder/40/40'
  },
]

const categories = [
  { id: 'all', label: 'Semua', icon: Filter },
  { id: 'handphone', label: 'Handphone', icon: Smartphone },
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'aksesoris', label: 'Aksesoris', icon: Headphones },
  { id: 'software', label: 'Software', icon: Code },
]

const filterChipClass = (active: boolean) =>
  cn(
    'flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs',
    active
      ? 'bg-primary-600 text-white shadow-soft-sm'
      : 'border border-surface-200/70 bg-white/70 text-surface-700 backdrop-blur-md hover:bg-white',
  )

const filterChipIconClass = 'h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4'

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating'>('relevance')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInside = dropdownRef.current && dropdownRef.current.contains(event.target as Node)
      if (!isInside) {
        setIsSortDropdownOpen(false)
      }
    }

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSortDropdownOpen])

  const filteredProducts = mockProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.teknisiName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-6 lg:pt-28">
        <AuroraBackground intensity="subtle" />
        <SectionTabs tabs={marketplaceTabs} layoutId="marketplace-section-tab" variant="merged" />

        <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-10 lg:px-8">
          <Reveal noBlur>
            <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 text-[11px] font-medium text-primary-700 backdrop-blur-md">
                  <ShoppingBag className="h-3 w-3" />
                  Marketplace produk & software
                </span>
                <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-4xl lg:text-[44px]">
                  Marketplace gadget & software,
                  <span className="block">
                    <span className="gradient-text-static">cepat checkout</span> & aman.
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-sm text-surface-600 sm:text-base">
                  Handphone, laptop, aksesoris, sampai software. Pilih toko/teknisi terpercaya,
                  lihat rating asli, lalu checkout tanpa ribet.
                </p>
            </div>
          </Reveal>

          <Reveal noBlur delay={0.05}>
            <div className="mt-5 space-y-2.5">
              <div className="relative">
                <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
                <Input
                  type="text"
                  placeholder="Cari produk atau toko..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-11"
                />
              </div>

              <div className="relative">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                  <div className="flex gap-1.5 min-w-max sm:gap-2">
                    <div className="relative flex-shrink-0" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all')
                          setIsSortDropdownOpen(!isSortDropdownOpen)
                        }}
                        className={filterChipClass(selectedCategory === 'all')}
                      >
                        <Filter className={filterChipIconClass} />
                        Semua
                        <ChevronDown
                          className={cn(
                            filterChipIconClass,
                            'transition-transform',
                            isSortDropdownOpen && 'rotate-180',
                          )}
                        />
                      </button>

                      {isSortDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-200 z-50 py-2">
                          <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wide border-b border-surface-100">
                            Urutkan
                          </div>
                          {[
                            { value: 'relevance', label: 'Relevansi' },
                            { value: 'price-low', label: 'Harga: Terendah' },
                            { value: 'price-high', label: 'Harga: Tertinggi' },
                            { value: 'rating', label: 'Rating Tertinggi' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortBy(option.value as any)
                                setIsSortDropdownOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                sortBy === option.value
                                  ? 'bg-primary-50 text-primary-600 font-medium'
                                  : 'text-surface-700 hover:bg-surface-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {categories.filter(cat => cat.id !== 'all').map((cat) => {
                      const Icon = cat.icon
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id as ProductCategory)
                            setIsSortDropdownOpen(false)
                          }}
                          className={filterChipClass(selectedCategory === cat.id)}
                        >
                          <Icon className={filterChipIconClass} />
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal noBlur>
          <div className="pt-1 sm:pt-2">
            <BannerSlider />
          </div>
        </Reveal>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:py-8 lg:px-8">

        {/* Results Count */}
        <div className="mb-4 text-sm text-surface-500">
          Menampilkan {filteredProducts.length} produk
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 pb-20 lg:pb-0">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/marketplace/${product.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="relative w-full h-28 sm:h-32 lg:h-36 bg-surface-100 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${product.id === '1' ? '1592750475338-74b7b21085ab' : product.id === '2' ? '1511707171634-5f897ff02aa9' : product.id === '3' ? '1517336714731-489689fd1ca8' : product.id === '4' ? '1598327105856-8c89d6b2a0b1' : product.id === '5' ? '1550751827-4bd374c3f58b' : '1580910051074-3c694ba0100e'}?w=400&h=300&fit=crop`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1">
                    <Badge variant="outline" className="bg-white/90 text-[10px] px-1.5 py-0.5 capitalize">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-2 sm:p-3 pb-1">
                  <CardTitle className="text-xs sm:text-sm line-clamp-2 leading-tight">{product.name}</CardTitle>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] sm:text-xs font-medium">{product.rating}</span>
                      <span className="text-[10px] text-surface-500 hidden sm:inline">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] text-surface-500">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">{product.views.toLocaleString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-1">
                  <div className="text-sm sm:text-base font-bold text-primary-600 mb-1.5 sm:mb-2">
                    {formatPrice(product.price)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={`https://i.pravatar.cc/150?img=${parseInt(product.id) + 10}`}
                      alt={product.teknisiName}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-surface-200 flex-shrink-0"
                    />
                    <span className="text-[10px] sm:text-xs text-surface-500 truncate">{product.teknisiName}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 pb-20 lg:pb-12">
            <p className="text-surface-500">Tidak ada produk yang ditemukan</p>
          </div>
        )}
      </div>
      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
