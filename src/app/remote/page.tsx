'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/landing'
import { BottomNav, MobileSafeAreaSpacer } from '@/components/mobile'
import { serviceTabs } from '@/lib/section-tab-config'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHero } from '@/components/shared/page-hero'
import { cn } from '@/lib/utils'
import { SupportChatButton } from '@/components/chat/support-chat-button'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  Eye,
  HelpCircle,
  Laptop,
  Lock,
  Radio,
  Shield,
  Star,
  Users,
  Zap,
} from '@/lib/icons'

/* ---------- Mock data ---------- */
const onlineTeknisi = [
  { id: '1', name: 'Ahmad Hidayat', rating: 4.9, reviews: 234, specialty: 'Unlock & Flashing', avatar: 1, sessions: 567 },
  { id: '2', name: 'Budi Santoso', rating: 4.7, reviews: 189, specialty: 'Hardware Repair', avatar: 2, sessions: 342 },
  { id: '5', name: 'Dewi Lestari', rating: 4.9, reviews: 312, specialty: 'Data Recovery', avatar: 5, sessions: 678 },
  { id: '7', name: 'Fajar Pratama', rating: 4.8, reviews: 178, specialty: 'Software & Root', avatar: 7, sessions: 412 },
]

const steps = [
  { num: 1, title: 'Download IndoDesk', desc: 'Install aplikasi remote IndoDesk di perangkat Anda.' },
  { num: 2, title: 'Buka IndoDesk', desc: 'Jalankan aplikasi, catat ID dan One-Time Password yang muncul.' },
  { num: 3, title: 'Isi form di bawah', desc: 'Pilih teknisi, masukkan ID & password, lalu submit.' },
  { num: 4, title: 'Tunggu teknisi connect', desc: 'Teknisi akan menerima request dan mulai sesi remote.' },
]

type DownloadItem = {
  platform: 'windows' | 'macos'
  platformLabel: string
  downloadUrl: string
  version: string
  fileSize: string | null
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

export default function RemotePage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [latestVersion, setLatestVersion] = useState('1.3.7')
  const [selectedTeknisi, setSelectedTeknisi] = useState<string | null>(null)
  const [remoteId, setRemoteId] = useState('')
  const [otp, setOtp] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ready = !!selectedTeknisi && remoteId.trim().length >= 6 && otp.trim().length >= 4

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/indodesk/downloads')
        const json = (await res.json()) as {
          success?: boolean
          data?: { version?: string; downloads?: DownloadItem[] }
        }
        if (json.success && json.data?.downloads) {
          setDownloads(json.data.downloads)
          if (json.data.version) setLatestVersion(json.data.version)
        }
      } catch {
        // keep defaults in UI
      }
    })()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <div className="hidden lg:block"><Navbar /></div>
      <PageHero
        sectionTabs={{ tabs: serviceTabs, layoutId: 'service-section-tab' }}
        badge={{ icon: Laptop, label: 'Remote Assistance' }}
        title={
          <>
            Remote Desktop via IndoDesk,
            <span className="block">
              <span className="gradient-text-static">aman</span> & terpantau.
            </span>
          </>
        }
        description="Biarkan teknisi profesional mengakses perangkat Anda secara remote untuk troubleshooting, instalasi, atau perbaikan software."
        right={
          <div className="flex items-center gap-2 text-[12px] text-surface-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
            <span className="font-medium">{onlineTeknisi.length} teknisi online</span>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {submitted ? (
          /* ---- SUCCESS STATE ---- */
          <motion.div {...fadeIn} className="mx-auto max-w-lg">
            <Card className="shadow-soft-md">
              <CardContent className="p-6 text-center sm:p-8">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                  <CheckCircle weight="fill" className="h-8 w-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold tracking-tightest text-ink">Request terkirim!</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-surface-600">
                  Permintaan remote Anda sudah dikirim ke teknisi. Status saat ini:
                </p>
                <Badge variant="warning" className="mt-3 px-3 py-1 text-sm">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  Menunggu teknisi menerima
                </Badge>
                <p className="mt-4 text-[13px] text-surface-500">
                  Teknisi akan menerima notifikasi dan bisa langsung connect ke perangkat Anda.
                  Pastikan IndoDesk tetap terbuka.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button variant="primary" onClick={() => setSubmitted(false)}>
                    Ajukan lagi
                  </Button>
                  <Link href="/teknisi">
                    <Button variant="outline">Lihat teknisi lain</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ---- MAIN FORM ---- */
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left — form */}
            <div className="min-w-0 space-y-5">
              {/* How it works */}
              <motion.div {...fadeIn}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 sm:p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                      <HelpCircle className="h-4 w-4 text-primary-600" />
                      Cara kerja Remote IndoDesk
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {steps.map((s, i) => (
                        <div key={s.num} className="flex gap-2.5">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                            {s.num}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink">{s.title}</p>
                            <p className="text-[11px] leading-relaxed text-surface-500">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Download section */}
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 sm:p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                      <Download className="h-4 w-4 text-primary-600" />
                      Download IndoDesk
                    </h2>
                    <p className="mb-3 text-[12px] leading-relaxed text-surface-600">
                      IndoDesk adalah aplikasi remote desktop berbasis open-source yang aman dan ringan.
                      Download sesuai platform Anda:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {downloads.length === 0 ? (
                        <>
                          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled>
                            <Laptop className="h-3.5 w-3.5" />
                            Windows
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled>
                            <Laptop className="h-3.5 w-3.5" />
                            macOS
                          </Button>
                        </>
                      ) : (
                        downloads.map((p) => (
                          <a
                            key={p.platform}
                            href={p.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}
                          >
                            <span className="relative z-10 inline-flex items-center gap-1.5">
                              <Laptop className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                              {p.platformLabel}
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                    <p className="mt-3 text-[11px] text-surface-500">
                      Versi terbaru:{' '}
                      <span className="font-mono text-ink">v{latestVersion.replace(/^v/i, '')}</span>
                      {downloads[0]?.fileSize ? ` · Ukuran: ${downloads[0].fileSize}` : ''} · Gratis
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 1: Pilih teknisi */}
              <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 sm:p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">1</span>
                      Pilih Teknisi Online
                    </h2>
                    <p className="mb-3 text-[12px] text-surface-500">Pilih teknisi yang tersedia untuk sesi remote Anda.</p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {onlineTeknisi.map((t) => {
                        const selected = selectedTeknisi === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTeknisi(t.id)}
                            className={cn(
                              'relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 ease-out-expo',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
                              selected
                                ? 'border-primary-500 bg-primary-50/70 shadow-soft-sm'
                                : 'border-surface-200/70 bg-white hover:border-primary-300 hover:shadow-soft-xs',
                            )}
                          >
                            <AnimatePresence>
                              {selected && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-soft-md"
                                >
                                  <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                            <img
                              src={`https://i.pravatar.cc/150?img=${t.avatar}`}
                              alt={t.name}
                              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-soft-xs"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-xs font-semibold text-ink">{t.name}</span>
                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-70" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
                                </span>
                              </div>
                              <p className="truncate text-[10px] text-surface-500">{t.specialty}</p>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-surface-500">
                                <Star weight="fill" className="h-2.5 w-2.5 text-amber-400" />
                                <span className="font-semibold text-ink">{t.rating}</span>
                                <span>· {t.sessions} sesi</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 2: ID & OTP */}
              <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 sm:p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">2</span>
                      Masukkan ID & Password IndoDesk
                    </h2>
                    <p className="mb-3 text-[12px] text-surface-500">
                      Buka IndoDesk di perangkat Anda, lalu salin ID dan One-Time Password yang tampil.
                    </p>

                    <form onSubmit={handleSubmit} id="remote-form" className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            IndoDesk ID
                          </label>
                          <Input
                            value={remoteId}
                            onChange={(e) => setRemoteId(e.target.value.replace(/[^\d\s]/g, ''))}
                            placeholder="123 456 789"
                            inputMode="numeric"
                            className="h-11 font-mono tracking-wider"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                            One-Time Password
                          </label>
                          <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="••••••"
                            type="password"
                            className="h-11 font-mono tracking-wider"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                          Deskripsi masalah (opsional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Jelaskan masalah yang ingin diselesaikan via remote…"
                          rows={3}
                          className={cn(
                            'flex w-full rounded-xl border border-surface-200/80 bg-white/90 px-4 py-2.5 text-sm text-ink',
                            'shadow-soft-xs backdrop-blur-sm resize-none',
                            'transition-[box-shadow,border-color] duration-300 ease-out-expo',
                            'placeholder:text-surface-400',
                            'hover:border-surface-300/90',
                            'focus-visible:outline-none focus-visible:border-primary-400 focus-visible:shadow-ring-primary',
                          )}
                        />
                      </div>

                      <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2.5">
                        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                        <p className="text-[11px] leading-relaxed text-surface-700">
                          <strong>Keamanan:</strong> Password bersifat one-time dan akan berubah setelah sesi berakhir.
                          Teknisi hanya bisa mengakses perangkat selama Anda mengizinkan.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Submit */}
              <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
                <Button
                  type="submit"
                  form="remote-form"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={!ready || isSubmitting}
                >
                  {isSubmitting ? 'Mengirim…' : 'Ajukan Remote Session'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            {/* Right sidebar */}
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Trust */}
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-xs font-bold text-ink">Kenapa aman?</h3>
                    {[
                      { icon: Shield, text: 'Enkripsi end-to-end (TLS 1.3)' },
                      { icon: Lock, text: 'Password one-time, auto-expire' },
                      { icon: Eye, text: 'Anda bisa melihat semua aksi teknisi' },
                      { icon: Zap, text: 'Putuskan koneksi kapan saja' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[12px] text-surface-700">{item.text}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* About IndoDesk */}
              <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-xs font-bold text-ink">Tentang IndoDesk</h3>
                    <p className="text-[12px] leading-[1.7] text-surface-600">
                      IndoDesk adalah aplikasi remote desktop open-source yang dikembangkan khusus untuk
                      ekosistem IndoTeknizi. Ringan, tanpa perlu konfigurasi, dan tersedia untuk
                      Windows serta macOS.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Open Source', 'P2P', 'Low Latency', 'File Transfer'].map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full border border-surface-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-surface-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Help */}
              <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
                <Card className="shadow-soft-xs">
                  <CardContent className="p-4">
                    <h3 className="mb-2 text-xs font-bold text-ink">Butuh bantuan?</h3>
                    <p className="text-[12px] text-surface-600 mb-3">
                      Hubungi Admin platform jika mengalami kendala saat proses remote.
                    </p>
                    <SupportChatButton />
                  </CardContent>
                </Card>
              </motion.div>
            </aside>
          </div>
        )}
      </main>

      <MobileSafeAreaSpacer />
      <BottomNav />
    </div>
  )
}
