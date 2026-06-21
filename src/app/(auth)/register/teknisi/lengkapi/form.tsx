'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authFieldIconClass } from '@/components/ui/auth-field-icon'
import { Mail, User, Phone, MapPin, Wrench } from '@/lib/icons'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'
import {
  TEKNISI_WORKSHOP_TYPES,
  type TeknisiWorkshopType,
} from '@/lib/teknisi-registration'

type TeknisiLengkapiFormProps = {
  name: string
  email: string
}

export function TeknisiLengkapiForm({ name, email }: TeknisiLengkapiFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [workshopType, setWorkshopType] = useState<TeknisiWorkshopType | ''>('')
  const [brandsHandled, setBrandsHandled] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [motivation, setMotivation] = useState('')
  const [confirmTechnician, setConfirmTechnician] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register/teknisi/google-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          location,
          experience,
          workshopType,
          brandsHandled,
          portfolioUrl,
          motivation,
          confirmTechnician,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Gagal mengirim pendaftaran')
        return
      }

      setSuccessMessage(
        json.data?.message ??
          'Pendaftaran berhasil. Tim admin akan meninjau aplikasi Anda.',
      )
      setSubmitted(true)
    } catch {
      setError('Gagal menghubungi server')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      >
        <AuroraBackground intensity="vivid" />
        <Card tone="glass" className="relative w-full max-w-md overflow-hidden">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Wrench className="h-7 w-7 text-emerald-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Pendaftaran Diterima</CardTitle>
            <CardDescription className="text-surface-600">{successMessage}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 pb-8">
            <Link href="/login" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                Ke halaman login
              </Button>
            </Link>
            <Link href="/" className="text-center text-sm text-surface-500 hover:text-ink">
              ← Kembali ke beranda
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden py-8 px-4">
      <AuroraBackground intensity="vivid" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-2xl"
      >
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary">
              <Wrench weight="fill" className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                Lengkapi Profil Teknisi
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                Akun Google Anda sudah terhubung. Lengkapi profil teknisi untuk diajukan ke admin.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6 grid gap-3 rounded-xl border border-surface-200 bg-surface-50/60 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-surface-500">
                  Nama
                </p>
                <div className="relative">
                  <User className={authFieldIconClass} strokeWidth={2} aria-hidden />
                  <Input value={name} readOnly className="cursor-not-allowed bg-white pl-11" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-surface-500">
                  Email Google
                </p>
                <div className="relative">
                  <Mail className={authFieldIconClass} strokeWidth={2} aria-hidden />
                  <Input value={email} readOnly className="cursor-not-allowed bg-white pl-11" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-ink">Kontak</h3>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-surface-700">
                    WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className={authFieldIconClass} strokeWidth={2} aria-hidden />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-11"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-surface-100 pt-6">
                <h3 className="text-sm font-semibold text-ink">Profil Teknisi</h3>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-surface-700">
                    Kota / Lokasi kerja <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className={authFieldIconClass} strokeWidth={2} aria-hidden />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-11"
                      placeholder="Contoh: Jakarta Selatan, Surabaya"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="experience" className="text-sm font-medium text-surface-700">
                      Pengalaman <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Contoh: 5 tahun, 3 tahun di counter"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="workshopType" className="text-sm font-medium text-surface-700">
                      Jenis usaha <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="workshopType"
                      value={workshopType}
                      onChange={(e) => setWorkshopType(e.target.value as TeknisiWorkshopType)}
                      required
                      className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                    >
                      <option value="">Pilih jenis usaha</option>
                      {TEKNISI_WORKSHOP_TYPES.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="brandsHandled" className="text-sm font-medium text-surface-700">
                    Merek yang sering ditangani <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="brandsHandled"
                    value={brandsHandled}
                    onChange={(e) => setBrandsHandled(e.target.value)}
                    placeholder="Contoh: iPhone, Samsung, Xiaomi, Oppo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="portfolioUrl" className="text-sm font-medium text-surface-700">
                    Link portfolio / Instagram / YouTube
                  </label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="motivation" className="text-sm font-medium text-surface-700">
                    Ceritakan pengalaman & alasan ingin bergabung{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    rows={4}
                    required
                    minLength={30}
                    placeholder="Jelaskan latar belakang kerja Anda, jenis servis yang biasa ditangani, dan mengapa ingin bergabung di Bantoo.in..."
                    className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
                  />
                  <p className="text-[11px] text-surface-500">Minimal 30 karakter</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-200 bg-surface-50/50 p-3">
                  <input
                    type="checkbox"
                    checked={confirmTechnician}
                    onChange={(e) => setConfirmTechnician(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <span className="text-xs text-surface-700">
                    Saya menyatakan bahwa saya adalah teknisi handphone profesional dan informasi
                    yang saya berikan adalah benar.
                  </span>
                </label>
              </section>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim pendaftaran…' : 'Kirim pendaftaran teknisi'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Link
              href="/register/teknisi"
              className="text-center text-sm text-surface-500 hover:text-ink"
            >
              ← Kembali ke formulir daftar teknisi
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
