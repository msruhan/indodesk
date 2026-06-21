'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
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
import { Mail, Lock, User, Phone, MapPin, Wrench } from '@/lib/icons'
import { AuroraBackground } from '@/components/motion'
import { motion } from 'framer-motion'
import {
  TEKNISI_WORKSHOP_TYPES,
  type TeknisiWorkshopType,
} from '@/lib/teknisi-registration'
import { GoogleRegisterDivider } from '@/components/auth/google-register-divider'
import { RegisterOAuthErrorAlert } from '@/components/auth/register-oauth-error-alert'

export default function RegisterTeknisiPage() {
  const { registerTeknisi } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (password !== confirmPassword) {
      setError('Password tidak sama!')
      return
    }

    setIsLoading(true)
    const result = await registerTeknisi({
      name,
      email,
      password,
      phone,
      location,
      experience,
      workshopType,
      brandsHandled,
      portfolioUrl,
      motivation,
      confirmTechnician,
    })

    if (!result.success) {
      setError(result.error || 'Registrasi gagal')
      setIsLoading(false)
      return
    }

    setSuccessMessage(
      result.message ??
        'Pendaftaran berhasil. Kami telah mengirim email verifikasi — klik tautan di inbox Anda. Setelah email dikonfirmasi, tim admin akan meninjau aplikasi Anda.',
    )
    setSubmitted(true)
    setIsLoading(false)
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
            <motion.div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Wrench className="h-7 w-7 text-emerald-600" />
            </motion.div>
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
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-2xl"
      >
        <Card tone="glass" className="overflow-hidden">
          <CardHeader className="space-y-3 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 shadow-glow-primary"
            >
              <Wrench weight="fill" className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tightest">
                Daftar sebagai Teknisi
              </CardTitle>
              <CardDescription className="mt-1 text-surface-600">
                Lengkapi formulir verifikasi. Verifikasi email dulu, lalu tunggu persetujuan admin.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <RegisterOAuthErrorAlert />
            <GoogleRegisterDivider
              role="TEKNISI"
              callbackUrl="/register/teknisi/lengkapi"
              className="mb-6"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-ink">Akun</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 sm:col-span-2"
                  >
                    <label htmlFor="name" className="text-sm font-medium text-surface-700">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11"
                        placeholder="Nama lengkap"
                        required
                      />
                    </div>
                  </motion.div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-surface-700">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11"
                        placeholder="nama@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-surface-700">
                      WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <motion.div whileFocus={{ scale: 1.01 }} className="relative">
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
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-surface-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-surface-700">
                      Konfirmasi Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className={authFieldIconClass} strokeWidth={2} aria-hidden />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
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
                    yang saya berikan adalah benar. Saya memahami bahwa data palsu dapat
                    mengakibatkan penolakan atau penonaktifan akun.
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-surface-600"
            >
              Daftar sebagai pelanggan?{' '}
              <Link
                href="/register"
                className="font-medium text-primary-700 hover:underline underline-offset-4"
              >
                Formulir user
              </Link>
            </motion.div>
            <div className="text-center text-sm text-surface-600">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="font-medium text-primary-700 hover:underline underline-offset-4"
              >
                Masuk di sini
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
