'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardPageHeader, DashboardPanel, InsightCard } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import { AccountSettingsView } from '@/components/account/account-settings-view'
import {
  Award,
  Bell,
  CheckCircle,
  MessageCircle,
  Radio,
  Settings,
  Star,
  UserCircle,
} from '@/lib/icons'

export type TeknisiAkunTab = 'profil' | 'pengaturan'

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

const TABS: { id: TeknisiAkunTab; label: string; icon: typeof UserCircle }[] = [
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
]

function TeknisiProfilTab() {
  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <motion.div className="mb-6 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                AH
              </div>
              <div>
                <Button type="button" variant="outline">
                  Ubah Foto
                </Button>
              </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Nama Lengkap</label>
                <Input defaultValue="Ahmad Hidayat" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
                <Input type="email" defaultValue="ahmad@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">No. Telepon</label>
                <Input defaultValue="081234567890" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Lokasi</label>
                <Input defaultValue="Jakarta Selatan" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Pengalaman</label>
                <Input defaultValue="8 tahun" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Harga Konsultasi (Rp)
                </label>
                <Input type="number" defaultValue="50000" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">Deskripsi</label>
              <textarea
                className="w-full resize-none rounded-lg border border-surface-200 px-3 py-2"
                rows={4}
                defaultValue="Teknisi handphone berpengalaman dengan spesialisasi unlock, flashing, dan root berbagai brand."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">Spesialisasi</label>
              <div className="flex flex-wrap gap-2">
                <Badge>Unlock</Badge>
                <Badge>Flashing</Badge>
                <Badge>Root</Badge>
                <Badge>Hardware Repair</Badge>
                <Button type="button" size="sm" variant="outline">
                  + Tambah
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Simpan Perubahan</Button>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statistik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Rating</span>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold">4.9</span>
                <span className="text-surface-500">(234 review)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Total Konsultasi</span>
              <span className="text-lg font-bold">567</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Total View Profil</span>
              <span className="text-lg font-bold">1,234</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="font-semibold">Top Teknisi</div>
                <div className="text-sm text-surface-500">Berdasarkan rating & konsultasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold">Verified</div>
                <div className="text-sm text-surface-500">Teknisi terverifikasi</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Radio className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold">Online</div>
                <div className="text-sm text-surface-500">Sedang online sekarang</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sertifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-surface-200 p-4">
              <div>
                <div className="font-semibold">Certified Mobile Technician</div>
                <div className="text-sm text-surface-500">Indonesia Mobile Tech • 2020</div>
              </div>
              <Button type="button" variant="outline" size="sm">
                Hapus
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-surface-200 p-4">
              <div>
                <div className="font-semibold">Advanced Flashing Specialist</div>
                <div className="text-sm text-surface-500">Tech Academy • 2021</div>
              </div>
              <Button type="button" variant="outline" size="sm">
                Hapus
              </Button>
            </div>
            <Button type="button" variant="outline">
              + Tambah Sertifikasi
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TeknisiPengaturanTab() {
  return (
    <motion.div {...fadeIn} className="space-y-6">
      <AccountSettingsView showKycSection={false} initialTab="keamanan" hideTabBar />

      <DashboardPanel
        title="Notification Preferences"
        description="Atur channel untuk request konsultasi, remote, payout, dan pesan pelanggan."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Bell,
              title: 'In-app notifications',
              status: 'Aktif',
              desc: 'Seluruh alert tampil di dashboard.',
            },
            {
              icon: MessageCircle,
              title: 'WhatsApp reminders',
              status: 'Belum link',
              desc: 'Reminder konsultasi dan remote masuk ke WhatsApp.',
            },
            {
              icon: CheckCircle,
              title: 'Telegram alerts',
              status: 'Belum link',
              desc: 'Alert payout dan request urgent ke Telegram.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-surface-200/70 bg-white/70 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <Badge variant={item.status === 'Aktif' ? 'success' : 'outline'}>{item.status}</Badge>
              </div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-surface-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </motion.div>
  )
}

export function TeknisiAkunView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TeknisiAkunTab = raw === 'pengaturan' ? 'pengaturan' : 'profil'

  const setTab = useCallback(
    (tab: TeknisiAkunTab) => {
      const q = tab === 'profil' ? '' : '?tab=pengaturan'
      router.replace(`/teknisi/settings${q}`, { scroll: false })
    },
    [router],
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Akun Saya"
        description="Kelola profil publik teknisi, keamanan login, dan preferensi notifikasi."
      />

      <div className="inline-flex items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300',
                active ? 'text-white' : 'text-surface-600 hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="teknisi-akun-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <tab.icon className="h-3.5 w-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'profil' ? <TeknisiProfilTab /> : <TeknisiPengaturanTab />}
    </div>
  )
}
