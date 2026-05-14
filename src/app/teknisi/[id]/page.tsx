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
  MessageCircle,
  Radio,
  CheckCircle,
  Award,
  Clock,
  TrendingUp,
  Eye,
  Briefcase,
  GraduationCap,
  MapPin,
  Zap,
  Shield,
  Users,
  ThumbsUp,
  Calendar,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Image as ImageIcon,
  Unlock,
  Smartphone,
  Wrench,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function TeknisiDetailPage() {
  const params = useParams()

  // Mock data - in production, fetch from API
  const teknisi = {
    id: params.id,
    name: 'Ahmad Hidayat',
    avatar: '/api/placeholder/120/120',
    isOnline: true,
    rating: 4.9,
    reviewCount: 234,
    totalKonsultasi: 567,
    totalView: 1234,
    badge: 'top-teknisi' as const,
    specialty: [
      { name: 'Unlock', icon: Unlock, color: 'bg-blue-100 text-blue-700' },
      { name: 'Flashing', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
      { name: 'Root', icon: Settings, color: 'bg-green-100 text-green-700' },
      { name: 'Hardware Repair', icon: Wrench, color: 'bg-orange-100 text-orange-700' },
    ],
    experience: '8 tahun',
    location: 'Jakarta Selatan',
    price: 50000,
    responseTime: '< 5 menit',
    completionRate: 98,
    description: 'Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, dan root berbagai brand. Sudah menangani lebih dari 500+ konsultasi dengan rating 4.9. Berpengalaman menangani berbagai masalah mulai dari software hingga hardware repair.',
    services: [
      { name: 'Konsultasi Unlock', price: 50000, duration: '30 menit', popular: true },
      { name: 'Remote Flashing', price: 150000, duration: '1-2 jam', popular: false },
      { name: 'Root & Custom ROM', price: 200000, duration: '2-3 jam', popular: false },
      { name: 'Troubleshooting Hardware', price: 100000, duration: '1 jam', popular: true },
    ],
    certifications: [
      { name: 'Certified Mobile Technician', issuer: 'Indonesia Mobile Tech', year: 2020 },
      { name: 'Advanced Flashing Specialist', issuer: 'Tech Academy', year: 2021 },
      { name: 'Hardware Repair Expert', issuer: 'Tech Academy', year: 2022 },
    ],
    achievements: [
      { title: 'Top Performer', description: 'Bulan ini', icon: Award, color: 'bg-yellow-100 text-yellow-700' },
      { title: '100% Satisfaction', description: '567 konsultasi', icon: ThumbsUp, color: 'bg-green-100 text-green-700' },
      { title: 'Fast Response', description: '< 5 menit', icon: Zap, color: 'bg-blue-100 text-blue-700' },
    ],
    portfolio: [
      { id: 1, image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop', title: 'iPhone Unlock Success' },
      { id: 2, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop', title: 'Samsung Flashing' },
      { id: 3, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop', title: 'Custom ROM Installation' },
      { id: 4, image: 'https://images.unsplash.com/photo-1598327105856-8c89d6b2a0b1?w=300&h=200&fit=crop', title: 'Hardware Repair' },
    ],
    socialMedia: {
      instagram: '@ahmadhidayat_tech',
      facebook: 'Ahmad Hidayat Tech',
      linkedin: 'ahmad-hidayat-tech'
    },
    availability: {
      weekday: '09:00 - 21:00',
      weekend: '10:00 - 18:00'
    }
  }

  const reviews = [
    {
      id: 1,
      userName: 'Budi Santoso',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Sangat membantu! Masalah unlock iPhone saya selesai dalam waktu singkat. Recommended!',
      date: '3 hari yang lalu',
      service: 'Konsultasi Unlock',
      verified: true
    },
    {
      id: 2,
      userName: 'Siti Nurhaliza',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Teknisi yang sangat profesional dan ramah. Explains everything clearly. Hasilnya sesuai ekspektasi dan prosesnya cepat.',
      date: '1 minggu yang lalu',
      service: 'Remote Flashing',
      verified: true
    },
    {
      id: 3,
      userName: 'Rudi Hartono',
      avatar: '/api/placeholder/40/40',
      rating: 4,
      comment: 'Hasilnya bagus, tapi agak lama responnya. Overall oke dan recommended.',
      date: '2 minggu yang lalu',
      service: 'Root & Custom ROM',
      verified: false
    },
    {
      id: 4,
      userName: 'Dewi Lestari',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Pelayanan sangat memuaskan! Masalah hardware iPhone saya berhasil diperbaiki dengan sempurna. Terima kasih banyak!',
      date: '3 minggu yang lalu',
      service: 'Troubleshooting Hardware',
      verified: true
    },
    {
      id: 5,
      userName: 'Eko Prasetyo',
      avatar: '/api/placeholder/40/40',
      rating: 5,
      comment: 'Best teknisi yang pernah saya temui! Fast response, profesional, dan hasilnya perfect. Will definitely use again!',
      date: '1 bulan yang lalu',
      service: 'Konsultasi Unlock',
      verified: true
    },
  ]

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-surface-400">
          <Link href="/teknisi" className="hover:text-primary-600">Daftar Teknisi</Link>
          <span className="mx-2">/</span>
          <span>{teknisi.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header - Enhanced */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-primary-600 to-accent-500 h-24"></div>
              <CardContent className="p-6 -mt-12">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative">
                    <img
                      src={`https://i.pravatar.cc/150?img=${parseInt(teknisi.id as string)}`}
                      alt={teknisi.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {teknisi.isOnline && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-3 border-white rounded-full shadow-md"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">{teknisi.name}</h1>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Award className="w-3 h-3 mr-1" />
                        Top Teknisi
                      </Badge>
                      {teknisi.isOnline && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <Radio className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg">{teknisi.rating}</span>
                        <span className="text-surface-500">({teknisi.reviewCount} ulasan)</span>
                      </div>
                      <div className="flex items-center gap-1 text-surface-500">
                        <Eye className="w-4 h-4" />
                        <span>{teknisi.totalView.toLocaleString()} dilihat</span>
                      </div>
                      <div className="flex items-center gap-1 text-surface-500">
                        <MapPin className="w-4 h-4" />
                        <span>{teknisi.location}</span>
                      </div>
                    </div>
                    <p className="text-surface-700 leading-relaxed">{teknisi.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  Keahlian Spesialisasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teknisi.specialty.map((spec, idx) => {
                    const Icon = spec.icon
                    return (
                      <div key={idx} className={`${spec.color} p-4 rounded-lg text-center transition-transform hover:scale-105`}>
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold text-sm">{spec.name}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Services - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle>Jasa Online / Remote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teknisi.services.map((service, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        service.popular 
                          ? 'border-primary-500 bg-primary-50/50' 
                          : 'border-surface-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          {service.popular && (
                            <Badge variant="secondary" className="bg-primary-100 text-primary-700 text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-surface-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-primary-600 mb-2">
                          {formatPrice(service.price)}
                        </div>
                        <Button size="sm" className={service.popular ? 'bg-primary-600 hover:bg-primary-700' : ''}>
                          Pilih
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio/Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary-600" />
                  Portfolio & Hasil Kerja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teknisi.portfolio.map((item) => (
                    <div key={item.id} className="group relative overflow-hidden rounded-lg aspect-video cursor-pointer">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience & Certifications - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle>Pengalaman & Sertifikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Pengalaman</h4>
                      <p className="text-sm text-surface-500">{teknisi.experience} di bidang teknisi handphone</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-600" />
                    </div>
                    <h4 className="font-semibold">Sertifikasi</h4>
                  </div>
                  <div className="space-y-3">
                    {teknisi.certifications.map((cert, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-surface-50 to-white border border-surface-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-white mb-1">{cert.name}</div>
                            <div className="text-sm text-surface-500">
                              {cert.issuer} • {cert.year}
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews - Enhanced */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Review dari User ({teknisi.reviewCount})</CardTitle>
                  <Button variant="outline" size="sm">
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-surface-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img
                            src={`https://i.pravatar.cc/150?img=${review.id + 30}`}
                            alt={review.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-surface-200"
                          />
                          {review.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{review.userName}</span>
                              {review.verified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                  Verified
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {review.service}
                              </Badge>
                            </div>
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
                          <p className="text-surface-700 mb-2 leading-relaxed">{review.comment}</p>
                          <span className="text-sm text-surface-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-6">
            {/* Stats - Enhanced */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-t-xl">
                <CardTitle className="text-white">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    <span className="text-surface-400">Total Konsultasi</span>
                  </div>
                  <span className="font-bold text-lg">{teknisi.totalKonsultasi}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-surface-400">Rating</span>
                  </div>
                  <span className="font-bold text-lg">{teknisi.rating}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary-600" />
                    <span className="text-surface-400">Total View</span>
                  </div>
                  <span className="font-bold text-lg">{teknisi.totalView.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="text-surface-400">Lokasi</span>
                  </div>
                  <span className="font-semibold">{teknisi.location}</span>
                </div>
                <div className="p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary-600" />
                      <span className="text-surface-400">Response Time</span>
                    </div>
                    <span className="font-semibold">{teknisi.responseTime}</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                      <span className="text-surface-400">Completion Rate</span>
                    </div>
                    <span className="font-semibold">{teknisi.completionRate}%</span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-accent-500 h-2 rounded-full transition-all"
                      style={{ width: `${teknisi.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-600" />
                  Pencapaian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teknisi.achievements.map((achievement, idx) => {
                  const Icon = achievement.icon
                  return (
                    <div key={idx} className={`${achievement.color} p-3 rounded-lg flex items-center gap-3`}>
                      <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{achievement.title}</p>
                        <p className="text-xs opacity-80">{achievement.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Jam Operasional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
                    <span className="text-surface-400">Senin - Jumat</span>
                    <span className="font-semibold">{teknisi.availability.weekday}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
                    <span className="text-surface-400">Sabtu - Minggu</span>
                    <span className="font-semibold">{teknisi.availability.weekend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media Sosial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 transition-colors text-surface-700">
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm">{teknisi.socialMedia.instagram}</span>
                  </a>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 transition-colors text-surface-700">
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">{teknisi.socialMedia.facebook}</span>
                  </a>
                  <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 transition-colors text-surface-700">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">{teknisi.socialMedia.linkedin}</span>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3 sticky top-6">
              <Button 
                className="w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 shadow-lg"
                size="lg"
                disabled={!teknisi.isOnline}
              >
                {teknisi.isOnline ? 'Konsultasi Sekarang' : 'Teknisi Offline'}
              </Button>
              <Button variant="outline" className="w-full border-2" size="lg">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
