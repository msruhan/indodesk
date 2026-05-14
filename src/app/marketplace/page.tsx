'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { BannerSlider } from '@/components/marketplace/banner-slider'
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  MapPin,
  Smartphone,
  Laptop,
  Headphones,
  Code,
  ChevronDown,
  ShoppingCart
} from '@/lib/icons'
import Link from 'next/link'
import Image from 'next/image'

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

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating'>('relevance')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isMobileClick = mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target as Node)
      const isDesktopClick = desktopDropdownRef.current && desktopDropdownRef.current.contains(event.target as Node)
      
      if (!isMobileClick && !isDesktopClick) {
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
    <div className="min-h-screen bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      {/* Header - Hidden on Mobile */}
      <div className="hidden lg:block border-b border-surface-200/60 bg-white/70 backdrop-blur-md lg:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7">
          <h1 className="mb-2 text-3xl font-semibold tracking-tightest text-ink lg:text-4xl">
            Marketplace
          </h1>
          <p className="text-surface-600">
            Temukan produk handphone, laptop, aksesoris, dan software terbaik.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Search & Filter - Above Banner on Mobile, Below on Desktop */}
        <div className="lg:hidden mb-4 pt-4 space-y-4">
          {/* Search Bar with Cart */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <Input
                type="text"
                placeholder="Cari produk atau toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Link href="/cart" className="relative">
              <button className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-surface-200 hover:bg-surface-50 transition-colors">
                <ShoppingCart className="w-5 h-5 text-surface-700" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </Link>
          </div>

          {/* Categories - Horizontal Scrollable */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
              <div className="flex gap-2 min-w-max">
                {/* Filter Semua with Dropdown */}
                <div className="relative flex-shrink-0" ref={mobileDropdownRef}>
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setIsSortDropdownOpen(!isSortDropdownOpen)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                    }`}
                  >
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    Semua
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isSortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-surface-200 z-50 py-2">
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

                {/* Other Categories */}
                {categories.filter(cat => cat.id !== 'all').map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id as ProductCategory)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Banner Slider */}
        <div className="pt-4 sm:pt-6">
          <BannerSlider />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search & Filter - Desktop Only */}
        <div className="hidden lg:block mb-6 space-y-4">
          {/* Search Bar with Cart */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <Input
                type="text"
                placeholder="Cari produk atau toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Link href="/cart" className="relative">
              <button className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-surface-200 hover:bg-surface-50 transition-colors">
                <ShoppingCart className="w-5 h-5 text-surface-700" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </Link>
          </div>

          {/* Categories - Horizontal Scrollable */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-6 px-3 sm:px-6">
              <div className="flex gap-2 min-w-max">
                {/* Filter Semua with Dropdown */}
                <div className="relative flex-shrink-0" ref={mobileDropdownRef}>
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setIsSortDropdownOpen(!isSortDropdownOpen)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                    }`}
                  >
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    Semua
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isSortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-surface-200 z-50 py-2">
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

                {/* Other Categories */}
                {categories.filter(cat => cat.id !== 'all').map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id as ProductCategory)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

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

