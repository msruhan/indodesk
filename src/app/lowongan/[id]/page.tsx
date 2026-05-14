'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/landing'
import { BottomNav } from '@/components/mobile'
import { 
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building,
  FileText,
  Send
} from 'lucide-react'
import Link from 'next/link'

export default function LowonganDetailPage() {
  const params = useParams()
  const [isApplying, setIsApplying] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null as File | null
  })

  // Mock data - in production, fetch from API
  const lowongan = {
    id: params.id,
    title: 'Teknisi Handphone Senior',
    company: 'HandPhone Center Jakarta',
    location: 'Jakarta Selatan',
    salary: 'Rp 5.000.000 - 8.000.000',
    type: 'full-time' as const,
    postedDate: '2 hari lalu',
    applicants: 23,
    description: `HandPhone Center Jakarta sedang mencari Teknisi Handphone Senior yang berpengalaman dan profesional untuk bergabung dengan tim kami.`,
    requirements: [
      'Minimal 3 tahun pengalaman sebagai teknisi handphone',
      'Menguasai berbagai brand (iPhone, Samsung, Xiaomi, dll)',
      'Memahami hardware dan software troubleshooting',
      'Bersedia bekerja shift',
      'Memiliki kemampuan komunikasi yang baik',
      'Sertifikat teknisi (preferred)'
    ],
    responsibilities: [
      'Melakukan perbaikan hardware dan software handphone',
      'Melayani konsultasi dengan pelanggan',
      'Mendiagnosis masalah dan memberikan solusi',
      'Menjaga kualitas service sesuai standar',
      'Melakukan maintenance peralatan'
    ],
    benefits: [
      'Gaji kompetitif',
      'Bonus performance',
      'BPJS Kesehatan & Ketenagakerjaan',
      'Training berkala',
      'Kesempatan karir'
    ]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    // In production, submit to API
    setTimeout(() => {
      alert('Lamaran berhasil dikirim!')
      setIsApplying(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-surface-400">
          <Link href="/lowongan" className="hover:text-primary-600">Lowongan Kerja</Link>
          <span className="mx-2">/</span>
          <span>{lowongan.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{lowongan.title}</CardTitle>
                    <div className="flex items-center gap-4 text-surface-400">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span>{lowongan.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{lowongan.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{lowongan.salary}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Full Time</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Deskripsi Pekerjaan</h3>
                  <p className="text-surface-700">{lowongan.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Tanggung Jawab</h3>
                  <ul className="space-y-2">
                    {lowongan.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Persyaratan</h3>
                  <ul className="space-y-2">
                    {lowongan.requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Tunjangan & Benefit</h3>
                  <ul className="space-y-2">
                    {lowongan.benefits.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-surface-200">
                  <div className="flex items-center gap-1 text-sm text-surface-500">
                    <Clock className="w-4 h-4" />
                    <span>Diposting {lowongan.postedDate}</span>
                  </div>
                  <span className="text-sm text-surface-500">{lowongan.applicants} pelamar</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Apply Form */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Lamar Pekerjaan</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Nama Lengkap
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      No. Telepon
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="081234567890"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Cover Letter
                    </label>
                    <textarea
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      placeholder="Tuliskan mengapa Anda cocok untuk posisi ini..."
                      className="w-full px-3 py-2 border border-surface-200 rounded-lg resize-none"
                      rows={5}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Upload CV/Resume
                    </label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                      className="cursor-pointer"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-600 to-accent-500"
                    disabled={isApplying}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isApplying ? 'Mengirim...' : 'Kirim Lamaran'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

