'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { 
  Star, 
  Eye, 
  ShoppingCart,
  MessageCircle,
  Share2,
  Heart,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProductDetailPage() {
  const params = useParams()
  const [isFavorite, setIsFavorite] = useState(false)

  // Mock data - in production, fetch from API using params.id
  const product = {
    id: params.id,
    name: 'iPhone 13 Pro Max - Second',
    category: 'handphone',
    price: 8500000,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600', '/api/placeholder/600/600'],
    rating: 4.8,
    reviewCount: 124,
    views: 2341,
    teknisi: {
      name: 'TechSolution',
      avatar: '/api/placeholder/60/60',
      verified: true,
      rating: 4.9,
      totalSales: 234,
      location: 'Jakarta Selatan'
    },
    description: `iPhone 13 Pro Max kondisi sangat baik, 95% like new.

Spesifikasi:
- Storage: 256GB
- Warna: Sierra Blue
- Batrai sehat 93%
- Aksesoris: Charger, Cable, Box
- Garansi: 1 bulan service center

Kondisi fisik:
- Layar: Perfect, no scratch
- Body: Minor wear, no dent
- Camera: All perfect
- Speaker: Perfect

Ready stock, bisa COD atau transfer.`,
    features: [
      'Kondisi 95% like new',
      'Garansi 1 bulan',
      'Aksesoris lengkap',
      'Ready stock',
      'Bisa COD'
    ]
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const reviews = [
    {
      id: 1,
      userName: 'Budi Santoso',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Barang sesuai deskripsi, pengiriman cepat! Recommended seller.',
      date: '2 hari yang lalu'
    },
    {
      id: 2,
      userName: 'Siti Nurhaliza',
      avatar: '/api/placeholder/40/40',
      rating: 4,
      comment: 'Kondisi barang bagus, harga juga oke. Seller ramah dan fast response.',
      date: '5 hari yang lalu'
    }
  ]

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-surface-400">
          <Link href="/marketplace" className="hover:text-primary-600">Marketplace</Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full h-96 bg-surface-100 rounded-t-2xl overflow-hidden">
                  {/* Main Image */}
                  <img
                    src={`https://images.unsplash.com/photo-${product.id === '1' ? '1592750475338-74b7b21085ab' : product.id === '2' ? '1511707171634-5f897ff02aa9' : '1517336714731-489689fd1ca8'}?w=800&h=600&fit=crop`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Thumbnails */}
                  <div className="flex gap-2 p-4 bg-white">
                    {product.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`https://images.unsplash.com/photo-${product.id === '1' ? '1592750475338-74b7b21085ab' : product.id === '2' ? '1511707171634-5f897ff02aa9' : '1517336714731-489689fd1ca8'}?w=200&h=200&fit=crop`}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-20 h-20 rounded-lg object-cover border-2 border-surface-300"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge className="mb-2">Handphone</Badge>
                  <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                </div>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-surface-400'}`} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{product.rating}</span>
                  <span className="text-surface-500">({product.reviewCount} ulasan)</span>
                </div>
                <div className="flex items-center gap-1 text-surface-500">
                  <Eye className="w-4 h-4" />
                  <span>{product.views.toLocaleString()} dilihat</span>
                </div>
              </div>

              <div className="text-4xl font-bold text-primary-600 mb-6">
                {formatPrice(product.price)}
              </div>
            </div>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Penjual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="https://i.pravatar.cc/150?img=12"
                    alt={product.teknisi.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-surface-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{product.teknisi.name}</span>
                      {product.teknisi.verified && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-surface-400">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {product.teknisi.rating} | {product.teknisi.totalSales} penjualan
                    </div>
                    <div className="text-sm text-surface-500">{product.teknisi.location}</div>
                  </div>
                </div>
                <Link href={`/teknisi/${product.teknisi.name.toLowerCase().replace(' ', '-')}`}>
                  <Button variant="outline" className="w-full">
                    Lihat Profil Toko
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keunggulan Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Beli Sekarang
              </Button>
              <Button variant="outline" size="lg">
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Deskripsi Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-surface-700">
              {product.description}
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Ulasan Pembeli ({product.reviewCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-surface-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={`https://i.pravatar.cc/150?img=${review.id + 30}`}
                          alt={review.userName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-surface-200"
                        />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{review.userName}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-surface-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-surface-700 mb-2">{review.comment}</p>
                      <span className="text-sm text-surface-500">{review.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}

