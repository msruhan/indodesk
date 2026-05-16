'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchInputIconClass } from '@/components/ui/search-input'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { mitraTabs } from '@/lib/section-tab-config'
import { PageHero } from '@/components/shared/page-hero'
import { SpotlightCard, Reveal, staggerContainerFast, viewportRevealNoBlur } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Building,
} from '@/lib/icons'

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
  urgent?: boolean
  skills: string[]
}

const mockLowongan: Lowongan[] = [
  {
    id: '1',
    title: 'Teknisi Handphone Senior',
    company: 'HandPhone Center Jakarta',
    location: 'Jakarta Selatan',
    salary: 'Rp 5 - 8 jt/bln',
    type: 'full-time',
    postedDate: '2 hari lalu',
    applicants: 23,
    description: 'Mencari teknisi handphone berpengalaman minimal 3 tahun untuk bergabung dengan tim service center kami.',
    urgent: true,
    skills: ['iPhone', 'Samsung', 'Hardware'],
  },
  {
    id: '2',
    title: 'Teknisi Remote Support',
    company: 'TechSolution Store',
    location: 'Remote',
    salary: 'Rp 3 - 5 jt/bln',
    type: 'part-time',
    postedDate: '5 hari lalu',
    applicants: 15,
    description: 'Diperlukan teknisi untuk memberikan konsultasi online dan remote troubleshooting.',
    skills: ['Software', 'Flashing', 'Unlock'],
  },
  {
    id: '3',
    title: 'Mobile Repair Technician',
    company: 'SmartPhone Gallery',
    location: 'Yogyakarta',
    salary: 'Rp 4 - 6 jt/bln',
    type: 'full-time',
    postedDate: '1 minggu lalu',
    applicants: 31,
    description: 'Bergabunglah dengan tim kami sebagai teknisi handphone di outlet terbaru kami.',
    skills: ['Hardware', 'Soldering', 'Xiaomi'],
  },
  {
    id: '4',
    title: 'Freelance Mobile Technician',
    company: 'Digital Store Medan',
    location: 'Medan',
    salary: 'Per project',
    type: 'contract',
    postedDate: '3 hari lalu',
    applicants: 8,
    description: 'Kesempatan kerja freelance untuk teknisi berpengalaman dengan jadwal fleksibel.',
    skills: ['Root', 'Custom ROM', 'Data Recovery'],
  },
  {
    id: '5',
    title: 'Service Center Manager',
    company: 'GadgetFix Indonesia',
    location: 'Surabaya',
    salary: 'Rp 8 - 12 jt/bln',
    type: 'full-time',
    postedDate: '1 hari lalu',
    applicants: 12,
    description: 'Memimpin tim teknisi di service center baru kami. Pengalaman managerial diutamakan.',
    urgent: true,
    skills: ['Leadership', 'QC', 'Multi-brand'],
  },
  {
    id: '6',
    title: 'Teknisi Laptop & PC',
    company: 'Komputer Jaya',
    location: 'Bandung',
    salary: 'Rp 4 - 7 jt/bln',
    type: 'full-time',
    postedDate: '4 hari lalu',
    applicants: 19,
    description: 'Teknisi laptop dan PC untuk perbaikan hardware, upgrade, dan troubleshooting.',
    skills: ['Laptop', 'PC', 'Networking'],
  },
]

type FilterType = 'all' | 'full-time' | 'part-time' | 'contract'

const typeConfig: Record<Exclude<FilterType, 'all'>, { label: string; variant: 'info' | 'success' | 'warning' }> = {
  'full-time': { label: 'Full Time', variant: 'info' },
  'part-time': { label: 'Part Time', variant: 'success' },
  contract: { label: 'Contract', variant: 'warning' },
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

export default function LowonganPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<FilterType>('all')

  const filteredLowongan = mockLowongan.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || l.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <PageHero
        sectionTabs={{ tabs: mitraTabs, layoutId: 'mitra-section-tab' }}
        badge={{ icon: Briefcase, label: 'Karir & lowongan' }}
        title={
          <>
            Lowongan kerja teknisi,
            <span className="block">
              <span className="gradient-text-static">pilih yang cocok</span> & apply cepat.
            </span>
          </>
        }
        description="Temukan kesempatan karir sebagai teknisi handphone di toko dan service center terpercaya."
        right={
          <div className="flex items-center gap-2 text-[12px] text-surface-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
            <span className="font-medium">{mockLowongan.length} lowongan aktif</span>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* Search + filter */}
        <Reveal noBlur delay={0.05}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className={cn(searchInputIconClass, 'left-4')} strokeWidth={2} aria-hidden />
              <Input
                type="text"
                placeholder="Cari lowongan, perusahaan, atau lokasi…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-11"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
              {filterOptions.map((opt) => {
                const active = selectedType === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedType(opt.value)}
                    className={cn(
                      'relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300',
                      active ? 'text-white' : 'text-surface-600 hover:text-ink',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="lowongan-filter-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft-md"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* Results count + sort */}
        <div className="mb-4 flex items-center justify-between text-[12px]">
          <span className="font-medium text-surface-700">
            <span className="text-ink tabular-nums">{filteredLowongan.length}</span> lowongan ditemukan
          </span>
          <span className="flex items-center gap-1 text-surface-500">
            <TrendingUp className="h-3 w-3 text-primary-600" />
            Terbaru
          </span>
        </div>

        {/* Job cards grid */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:gap-4 lg:grid-cols-2"
        >
          {filteredLowongan.map((lowongan) => {
            const cfg = typeConfig[lowongan.type]
            return (
              <motion.div key={lowongan.id} variants={viewportRevealNoBlur}>
                <Link
                  href={`/lowongan/${lowongan.id}`}
                  className="block focus:outline-none focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2"
                >
                  <SpotlightCard tone="primary" className="group/job flex h-full flex-col !p-4 sm:!p-5">
                    {/* Top row: company + badge */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-surface-200/70 bg-gradient-to-br from-surface-50 to-white text-sm font-bold text-primary-700 shadow-soft-xs">
                          {lowongan.company.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-surface-600">
                            {lowongan.company}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{lowongan.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        {lowongan.urgent && (
                          <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                            Urgent
                          </Badge>
                        )}
                        <Badge variant={cfg.variant} className="text-[10px] px-2 py-0.5">
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-ink transition-colors group-hover/spot:text-primary-700 sm:text-base">
                      {lowongan.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-3 text-[12px] leading-[1.6] text-surface-600 line-clamp-2">
                      {lowongan.description}
                    </p>

                    {/* Skills */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {lowongan.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-surface-700 backdrop-blur-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Footer: salary + meta + CTA */}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-surface-100 pt-3">
                      <div className="min-w-0">
                        {lowongan.salary && (
                          <p className="text-sm font-semibold tracking-tight text-primary-700">
                            {lowongan.salary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-surface-500">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {lowongan.postedDate}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />
                            {lowongan.applicants} pelamar
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 opacity-70 transition-opacity group-hover/spot:opacity-100">
                        Detail
                        <ArrowRight className="h-3 w-3 transition-transform group-hover/spot:translate-x-0.5" />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Empty state */}
        {filteredLowongan.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <Briefcase className="h-6 w-6 text-surface-400" />
            </div>
            <p className="text-sm font-semibold text-ink">Tidak ada lowongan yang cocok</p>
            <p className="mt-1 text-xs text-surface-500">
              Coba ubah filter atau kata kunci pencarian.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
              }}
            >
              Reset filter
            </Button>
          </div>
        )}
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
