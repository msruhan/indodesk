'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Send,
  CheckCircle,
  Users,
  ChevronLeft,
  Shield,
  Star,
} from '@/lib/icons'

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export default function LowonganDetailPage() {
  const params = useParams()
  const [isApplying, setIsApplying] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
  })

  const lowongan = {
    id: params.id,
    title: 'Teknisi Handphone Senior',
    company: 'HandPhone Center Jakarta',
    location: 'Jakarta Selatan',
    salary: 'Rp 5.000.000 - 8.000.000',
    type: 'full-time' as const,
    postedDate: '2 hari lalu',
    applicants: 23,
    description:
      'HandPhone Center Jakarta sedang mencari Teknisi Handphone Senior yang berpengalaman dan profesional untuk bergabung dengan tim kami. Posisi ini cocok untuk teknisi yang ingin berkembang di lingkungan kerja yang dinamis.',
    requirements: [
      'Minimal 3 tahun pengalaman sebagai teknisi handphone',
      'Menguasai berbagai brand (iPhone, Samsung, Xiaomi, dll)',
      'Memahami hardware dan software troubleshooting',
      'Bersedia bekerja shift',
      'Memiliki kemampuan komunikasi yang baik',
      'Sertifikat teknisi (preferred)',
    ],
    responsibilities: [
      'Melakukan perbaikan hardware dan software handphone',
      'Melayani konsultasi dengan pelanggan',
      'Mendiagnosis masalah dan memberikan solusi',
      'Menjaga kualitas service sesuai standar',
      'Melakukan maintenance peralatan',
    ],
    benefits: [
      'Gaji kompetitif',
      'Bonus performance bulanan',
      'BPJS Kesehatan & Ketenagakerjaan',
      'Training berkala',
      'Jenjang karir jelas',
    ],
    skills: ['iPhone', 'Samsung', 'Hardware', 'Soldering', 'Software'],
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    setTimeout(() => {
      setIsApplying(false)
      setSubmitted(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Compact hero */}
      <div className="relative border-b border-surface-200/60 bg-white/70 backdrop-blur-md lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {/* Breadcrumb */}
          <Link
            href="/lowongan"
            className="mb-3 inline-flex items-center gap-1 text-[12px] text-surface-500 hover:text-primary-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Lowongan Kerja
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="info" className="text-[10px]">Full Time</Badge>
                {lowongan.applicants > 20 && (
                  <Badge variant="warning" className="text-[10px]">Banyak pelamar</Badge>
                )}
              </div>
              <h1 className="text-balance text-xl font-semibold tracking-tightest text-ink sm:text-2xl lg:text-3xl">
                {lowongan.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-surface-600">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-primary-600" />
                  {lowongan.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary-600" />
                  {lowongan.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary-600" />
                  {lowongan.salary}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-surface-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Diposting {lowongan.postedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {lowongan.applicants} pelamar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:gap-6">
          {/* Left — job details */}
          <div className="min-w-0 space-y-4">
            {/* Description */}
            <motion.div {...fadeIn}>
              <Card className="shadow-soft-xs">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-2 text-sm font-bold text-ink">Deskripsi Pekerjaan</h2>
                  <p className="text-[13px] leading-[1.7] text-surface-700">
                    {lowongan.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills */}
            <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
              <Card className="shadow-soft-xs">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-2.5 text-sm font-bold text-ink">Keahlian yang dibutuhkan</h2>
                  <div className="flex flex-wrap gap-2">
                    {lowongan.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/60 px-3 py-1 text-[11px] font-medium text-primary-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Responsibilities */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
              <Card className="shadow-soft-xs">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-2.5 text-sm font-bold text-ink">Tanggung Jawab</h2>
                  <ul className="space-y-2">
                    {lowongan.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-surface-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Requirements */}
            <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
              <Card className="shadow-soft-xs">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-2.5 text-sm font-bold text-ink">Persyaratan</h2>
                  <ul className="space-y-2">
                    {lowongan.requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-surface-700">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card className="shadow-soft-xs">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="mb-2.5 text-sm font-bold text-ink">Tunjangan & Benefit</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {lowongan.benefits.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-surface-200/70 bg-surface-50/60 px-3 py-2 text-[12px] text-surface-700"
                      >
                        <Star className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right — apply form (sticky) */}
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
              <Card className="shadow-soft-md">
                <CardContent className="p-4 sm:p-5">
                  {submitted ? (
                    <div className="py-6 text-center">
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                        <CheckCircle weight="fill" className="h-7 w-7 text-primary-600" />
                      </div>
                      <h3 className="text-base font-semibold text-ink">Lamaran terkirim!</h3>
                      <p className="mt-1 text-[13px] text-surface-600">
                        Tim {lowongan.company} akan menghubungi kamu via email/telepon.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setSubmitted(false)}
                      >
                        Lamar lagi
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary-600" />
                        <h3 className="text-sm font-bold text-ink">Lamar Pekerjaan</h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            Nama Lengkap
                          </label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nama lengkap"
                            required
                            className="h-10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            required
                            className="h-10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            No. Telepon
                          </label>
                          <Input
                            type="tel"
                            inputMode="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="081234567890"
                            required
                            className="h-10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            Pesan singkat (opsional)
                          </label>
                          <textarea
                            value={formData.coverLetter}
                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                            placeholder="Mengapa Anda cocok untuk posisi ini…"
                            className={cn(
                              'flex w-full rounded-xl border border-surface-200/80 bg-white/90 px-4 py-2.5 text-sm text-ink',
                              'shadow-soft-xs backdrop-blur-sm resize-none',
                              'transition-[box-shadow,border-color] duration-300 ease-out-expo',
                              'placeholder:text-surface-400',
                              'hover:border-surface-300/90',
                              'focus-visible:outline-none focus-visible:border-primary-400 focus-visible:shadow-ring-primary',
                            )}
                            rows={4}
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          className="w-full"
                          disabled={isApplying}
                        >
                          <Send className="h-4 w-4" />
                          {isApplying ? 'Mengirim…' : 'Kirim Lamaran'}
                        </Button>

                        <p className="text-center text-[10px] text-surface-500">
                          Data kamu aman dan hanya dikirim ke perusahaan terkait.
                        </p>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </aside>
        </div>
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
