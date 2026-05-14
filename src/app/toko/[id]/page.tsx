'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  MapPin,
  Clock,
  ShoppingBag,
  Award,
  CheckCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { motion, AnimatePresence } from 'framer-motion'

export default function TokoDetailPage() {
  const params = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Mock data - in production, fetch from API
  const toko = {
    id: params.id,
    name: 'HandPhone Center Jakarta',
    image: '/api/placeholder/800/400',
    location: 'Jl. Thamrin No. 123',
    city: 'Jakarta',
    rating: 4.8,
    reviewCount: 456,
    totalPenjualan: 2341,
    badge: 'top-seller' as const,
    jamOperasional: {
      weekdays: '09:00 - 21:00',
      weekend: '10:00 - 20:00'
    },
    layanan: [
      { name: 'Service HP', description: 'Perbaikan hardware dan software' },
      { name: 'Jual Beli', description: 'Handphone baru dan bekas' },
      { name: 'Unlock', description: 'Unlock berbagai brand' },
      { name: 'Flashing', description: 'Install ulang OS' },
    ],
    description: 'Toko handphone terpercaya di Jakarta dengan pengalaman lebih dari 10 tahun. Melayani berbagai kebutuhan handphone mulai dari service, jual beli, hingga unlock dan flashing. Dilengkapi dengan teknisi berpengalaman dan garansi resmi.',
    contact: {
      phone: '+62 812-3456-7890',
      email: 'info@handphonecenter.com',
      whatsapp: '+62 812-3456-7890'
    },
    socialMedia: {
      instagram: '@handphonecenter_jkt',
      facebook: 'HandPhone Center Jakarta',
      twitter: '@hpcenter_jkt',
      youtube: 'HandPhone Center Official',
      tiktok: '@hpcenter_jkt'
    }
  }

  const reviews = [
    {
      id: 1,
      userName: 'Budi Santoso',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Service cepat dan hasilnya memuaskan. Harga juga reasonable. Recommended!',
      date: '5 hari yang lalu'
    },
    {
      id: 2,
      userName: 'Siti Nurhaliza',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Barang yang dijual original dan berkualitas. Tokonya juga bersih dan rapih.',
      date: '1 minggu yang lalu'
    },
    {
      id: 3,
      userName: 'Rudi Hartono',
      avatar: '/api/placeholder/40/40',
      rating: 4,
      comment: 'Pelayanan oke, teknisi ramah. Tapi agak lama antriannya di akhir pekan.',
      date: '2 minggu yang lalu'
    },
  ]

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-surface-400">
          <Link href="/toko" className="hover:text-primary-600">Promosi Toko</Link>
          <span className="mx-2">/</span>
          <span>{toko.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <Card>
              <CardContent className="p-0">
                <img
                  src={`https://images.unsplash.com/photo-${toko.id === '1' ? '1556742049-0cfed4f6a45d' : toko.id === '2' ? '1486406146926-c627a92ad1ab' : '1487958449943-2429e8be8625'}?w=1200&h=600&fit=crop`}
                  alt={toko.name}
                  className="w-full h-96 object-cover rounded-t-2xl"
                />
              </CardContent>
            </Card>

            {/* Header Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{toko.name}</h1>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <Award className="w-3 h-3 mr-1" />
                        Top Seller
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-surface-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {toko.location}, {toko.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{toko.rating}</span>
                      <span className="text-surface-500">
                        ({toko.reviewCount} ulasan)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-surface-700">{toko.description}</p>
              </CardContent>
            </Card>

            {/* Galeri Toko - Slider */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Galeri Toko</CardTitle>
                  <div className="text-sm text-surface-500">
                    {currentImageIndex + 1} / 6
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Main Image Slider */}
                <div className="relative mb-4">
                  <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-surface-100">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={`https://images.unsplash.com/photo-${
                          toko.id === '1'
                            ? currentImageIndex % 3 === 0
                              ? '1556740749-887f6717d7e4'
                              : currentImageIndex % 3 === 1
                              ? '1517248135467-4c7edcad34c4'
                              : '1520607162513-77705c0f0d4a'
                            : toko.id === '2'
                            ? currentImageIndex % 3 === 0
                              ? '1485846234645-a62644f84728'
                              : currentImageIndex % 3 === 1
                              ? '1515165562835-c4c9e0737eaa'
                              : '1498050108023-c5249f4df085'
                            : toko.id === '3'
                            ? currentImageIndex % 3 === 0
                              ? '1490111718993-d98654ce6cf7'
                              : currentImageIndex % 3 === 1
                              ? '1484300681262-5cca666b095e'
                              : '1520607162513-77705c0f0d4a'
                            : toko.id === '4'
                            ? currentImageIndex % 3 === 0
                              ? '1504274066651-8d31a536b11a'
                              : currentImageIndex % 3 === 1
                              ? '1479839672679-a46483c0e7c8'
                              : '1441986300917-64674bd600d8'
                            : toko.id === '5'
                            ? currentImageIndex % 3 === 0
                              ? '1517244861115-54b9d993edc1'
                              : currentImageIndex % 3 === 1
                              ? '1521292270410-a8c53642e9d0'
                              : '1517248135467-4c7edcad34c4'
                            : currentImageIndex % 3 === 0
                            ? '1504274066651-8d31a536b11a'
                            : currentImageIndex % 3 === 1
                            ? '1498050108023-c5249f4df085'
                            : '1484300681262-5cca666b095e'
                        }?w=1200&h=800&fit=crop`}
                        alt={`${toko.name} - galeri ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + 6) % 6)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % 6)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Navigation */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        currentImageIndex === idx
                          ? 'border-primary-600 ring-2 ring-primary-200 scale-105'
                          : 'border-surface-200 hover:border-primary-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`https://images.unsplash.com/photo-${
                          toko.id === '1'
                            ? idx % 3 === 0
                              ? '1556740749-887f6717d7e4'
                              : idx % 3 === 1
                              ? '1517248135467-4c7edcad34c4'
                              : '1520607162513-77705c0f0d4a'
                            : toko.id === '2'
                            ? idx % 3 === 0
                              ? '1485846234645-a62644f84728'
                              : idx % 3 === 1
                              ? '1515165562835-c4c9e0737eaa'
                              : '1498050108023-c5249f4df085'
                            : toko.id === '3'
                            ? idx % 3 === 0
                              ? '1490111718993-d98654ce6cf7'
                              : idx % 3 === 1
                              ? '1484300681262-5cca666b095e'
                              : '1520607162513-77705c0f0d4a'
                            : toko.id === '4'
                            ? idx % 3 === 0
                              ? '1504274066651-8d31a536b11a'
                              : idx % 3 === 1
                              ? '1479839672679-a46483c0e7c8'
                              : '1441986300917-64674bd600d8'
                            : toko.id === '5'
                            ? idx % 3 === 0
                              ? '1517244861115-54b9d993edc1'
                              : idx % 3 === 1
                              ? '1521292270410-a8c53642e9d0'
                              : '1517248135467-4c7edcad34c4'
                            : idx % 3 === 0
                            ? '1504274066651-8d31a536b11a'
                            : idx % 3 === 1
                            ? '1498050108023-c5249f4df085'
                            : '1484300681262-5cca666b095e'
                        }?w=200&h=200&fit=crop`}
                        alt={`${toko.name} - thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Layanan */}
            <Card>
              <CardHeader>
                <CardTitle>Layanan Tersedia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {toko.layanan.map((layanan, idx) => (
                    <div key={idx} className="p-4 border border-surface-200 rounded-lg">
                      <h4 className="font-semibold mb-1">{layanan.name}</h4>
                      <p className="text-sm text-surface-400">{layanan.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Review dari Pelanggan ({toko.reviewCount})</CardTitle>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Toko</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400">Total Penjualan</span>
                  <span className="font-semibold">{toko.totalPenjualan.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-400">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{toko.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jam Operasional */}
            <Card>
              <CardHeader>
                <CardTitle>Jam Operasional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="font-medium">Senin - Jumat</div>
                      <div className="text-sm text-surface-400">{toko.jamOperasional.weekdays}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="font-medium">Sabtu - Minggu</div>
                      <div className="text-sm text-surface-400">{toko.jamOperasional.weekend}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontak */}
            <Card>
              <CardHeader>
                <CardTitle>Kontak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span className="text-sm">{toko.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <span className="text-sm">{toko.contact.email}</span>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Hubungi via WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Media Sosial */}
            <Card>
              <CardHeader>
                <CardTitle>Media Sosial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a
                    href={`https://instagram.com/${toko.socialMedia.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-pink-500 hover:bg-pink-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-surface-500 mb-0.5">Instagram</div>
                      <div className="text-sm font-medium text-white truncate">{toko.socialMedia.instagram}</div>
                    </div>
                  </a>

                  <a
                    href={`https://facebook.com/${toko.socialMedia.facebook.replace(/\s+/g, '').toLowerCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Facebook className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-surface-500 mb-0.5">Facebook</div>
                      <div className="text-sm font-medium text-white truncate">{toko.socialMedia.facebook}</div>
                    </div>
                  </a>

                  <a
                    href={`https://twitter.com/${toko.socialMedia.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-sky-500 hover:bg-sky-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Twitter className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-surface-500 mb-0.5">Twitter</div>
                      <div className="text-sm font-medium text-white truncate">{toko.socialMedia.twitter}</div>
                    </div>
                  </a>

                  <a
                    href={`https://youtube.com/@${toko.socialMedia.youtube.replace(/\s+/g, '').toLowerCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-red-600 hover:bg-red-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-surface-500 mb-0.5">YouTube</div>
                      <div className="text-sm font-medium text-white truncate">{toko.socialMedia.youtube}</div>
                    </div>
                  </a>

                  <a
                    href={`https://tiktok.com/@${toko.socialMedia.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-black hover:bg-surface-100 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-surface-500 mb-0.5">TikTok</div>
                      <div className="text-sm font-medium text-white truncate">{toko.socialMedia.tiktok}</div>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

