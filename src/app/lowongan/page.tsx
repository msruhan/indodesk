'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'

interface Lowongan {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  type: 'full-time' | 'part-time' | 'contract'
  postedDate: string
  applicants: number
  description: string
}

const mockLowongan: Lowongan[] = [
  {
    id: '1',
    title: 'Teknisi Handphone Senior',
    company: 'HandPhone Center Jakarta',
    location: 'Jakarta Selatan',
    salary: 'Rp 5.000.000 - 8.000.000',
    type: 'full-time',
    postedDate: '2 hari lalu',
    applicants: 23,
    description: 'Mencari teknisi handphone berpengalaman minimal 3 tahun...'
  },
  {
    id: '2',
    title: 'Teknisi Remote Support',
    company: 'TechSolution Store',
    location: 'Remote',
    salary: 'Rp 3.000.000 - 5.000.000',
    type: 'part-time',
    postedDate: '5 hari lalu',
    applicants: 15,
    description: 'Diperlukan teknisi untuk memberikan konsultasi online...'
  },
  {
    id: '3',
    title: 'Mobile Repair Technician',
    company: 'SmartPhone Gallery',
    location: 'Yogyakarta',
    salary: 'Rp 4.000.000 - 6.000.000',
    type: 'full-time',
    postedDate: '1 minggu lalu',
    applicants: 31,
    description: 'Bergabunglah dengan tim kami sebagai teknisi handphone...'
  },
  {
    id: '4',
    title: 'Freelance Mobile Technician',
    company: 'Digital Store Medan',
    location: 'Medan',
    salary: 'Per Project',
    type: 'contract',
    postedDate: '3 hari lalu',
    applicants: 8,
    description: 'Kesempatan kerja freelance untuk teknisi berpengalaman...'
  },
]

export default function LowonganPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'full-time' | 'part-time' | 'contract'>('all')

  const filteredLowongan = mockLowongan.filter(lowongan => {
    const matchesSearch = lowongan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lowongan.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lowongan.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || lowongan.type === selectedType
    return matchesSearch && matchesType
  })

  const typeLabels = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
  }

  const typeColors = {
    'full-time': 'bg-blue-100 text-blue-700',
    'part-time': 'bg-green-100 text-green-700',
    'contract': 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      {/* Header */}
      <div className="bg-white border-b border-surface-200 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Lowongan Kerja Teknisi</h1>
          <p className="text-surface-400">Temukan kesempatan karir sebagai teknisi handphone</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
            <Input
              type="text"
              placeholder="Cari lowongan, perusahaan, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-surface-200 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedType === 'all'
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-white text-surface-700 hover:bg-surface-100 border-2 border-surface-200 hover:border-primary-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedType('full-time')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedType === 'full-time'
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-white text-surface-700 hover:bg-surface-100 border-2 border-surface-200 hover:border-primary-300'
              }`}
            >
              Full Time
            </button>
            <button
              onClick={() => setSelectedType('part-time')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedType === 'part-time'
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-white text-surface-700 hover:bg-surface-100 border-2 border-surface-200 hover:border-primary-300'
              }`}
            >
              Part Time
            </button>
            <button
              onClick={() => setSelectedType('contract')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedType === 'contract'
                  ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-white text-surface-700 hover:bg-surface-100 border-2 border-surface-200 hover:border-primary-300'
              }`}
            >
              Contract
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-medium text-surface-700">
            Menampilkan <span className="text-primary-600 font-bold">{filteredLowongan.length}</span> lowongan
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <TrendingUp className="w-4 h-4" />
            <span>Lowongan terbaru</span>
          </div>
        </div>

        {/* Lowongan List */}
        <div className="space-y-5 pb-20 lg:pb-0">
          {filteredLowongan.map((lowongan) => (
            <Link key={lowongan.id} href={`/lowongan/${lowongan.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-surface-200 hover:border-primary-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Company Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {lowongan.company.charAt(0)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Badge */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-600 transition-colors">
                            {lowongan.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={`${typeColors[lowongan.type]} font-semibold px-3 py-1`}>
                              {typeLabels[lowongan.type]}
                            </Badge>
                            <span className="text-xs text-surface-500">•</span>
                            <span className="text-sm text-surface-400 font-medium">{lowongan.company}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-surface-400">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">Lokasi</div>
                            <div className="text-sm font-semibold text-white">{lowongan.location}</div>
                          </div>
                        </div>

                        {lowongan.salary && (
                          <div className="flex items-center gap-2 text-surface-400">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-xs text-surface-500">Gaji</div>
                              <div className="text-sm font-semibold text-white">{lowongan.salary}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-surface-400">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">Pelamar</div>
                            <div className="text-sm font-semibold text-white">{lowongan.applicants} orang</div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-surface-700 mb-4 line-clamp-2 leading-relaxed">
                        {lowongan.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                        <div className="flex items-center gap-1 text-sm text-surface-500">
                          <Clock className="w-4 h-4" />
                          <span>Diposting {lowongan.postedDate}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors"
                        >
                          Lihat Detail
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredLowongan.length === 0 && (
          <div className="text-center py-16 pb-20 lg:pb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 mb-4">
              <Briefcase className="w-8 h-8 text-surface-400" />
            </div>
            <p className="text-lg font-medium text-surface-700 mb-1">Tidak ada lowongan yang ditemukan</p>
            <p className="text-sm text-surface-500">Coba ubah filter atau kata kunci pencarian Anda</p>
          </div>
        )}
      </div>
    </div>
  )
}

