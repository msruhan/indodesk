'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { DashboardPageHeader } from '@/components/dashboard'
import { AccountSettingsView } from '@/components/account/account-settings-view'
import { TelegramLinkCard } from '@/components/telegram/telegram-link-card'
import { DashboardPanel } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Bell, MessageCircle } from '@/lib/icons'
import {
  type TeknisiProfileEditSection,
} from '@/lib/teknisi-profile-edit-sections'

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

const LEGACY_TAB_TO_EDIT: Record<string, TeknisiProfileEditSection> = {
  profil: 'hero',
  jadwal: 'jadwal',
  portfolio: 'portfolio',
  sertifikasi: 'certifications',
}

export function TeknisiAkunView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (!tab || tab === 'pengaturan') return

    const userId = session?.user?.id
    if (!userId) return

    const edit = LEGACY_TAB_TO_EDIT[tab]
    if (edit) {
      router.replace(`/teknisi/${userId}?tab=profil&edit=${edit}`)
      return
    }

    router.replace('/teknisi/settings')
  }, [searchParams, session?.user?.id, router])

  const openPublicProfile = useCallback(() => {
    const userId = session?.user?.id
    if (userId) router.push(`/teknisi/${userId}?tab=profil`)
  }, [router, session?.user?.id])

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pengaturan"
        description="Keamanan login, notifikasi, dan integrasi akun teknisi."
      />

      <motion.div {...fadeIn} className="rounded-2xl border border-primary-200/70 bg-primary-50/50 px-4 py-3 text-sm text-primary-900">
        <p>
          Profil publik, jadwal, portofolio, dan sertifikasi kini diedit langsung di{' '}
          <button
            type="button"
            onClick={openPublicProfile}
            className="font-semibold underline underline-offset-2 hover:text-primary-700"
          >
            halaman profil publik Anda
          </button>
          {' '}— klik ikon pensil di setiap bagian.
        </p>
      </motion.div>

      <motion.div {...fadeIn} className="space-y-6">
        <AccountSettingsView initialTab="keamanan" hideTabBar />

        <DashboardPanel
          title="Preferensi Notifikasi"
          description="Atur channel untuk request konsultasi, remote, payout, dan pesan pelanggan."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-surface-200/70 bg-white/70 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <Bell className="h-5 w-5" />
                </span>
                <Badge variant="success">Aktif</Badge>
              </div>
              <p className="text-sm font-semibold text-ink">In-app notifications</p>
              <p className="mt-1 text-xs leading-relaxed text-surface-500">
                Seluruh alert tampil di dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-surface-200/70 bg-surface-50/50 p-4 opacity-75">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-400">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <Badge variant="outline">Segera</Badge>
              </div>
              <p className="text-sm font-semibold text-ink">Email digest</p>
              <p className="mt-1 text-xs leading-relaxed text-surface-500">
                Ringkasan aktivitas harian via email.
              </p>
            </div>
          </div>
        </DashboardPanel>

        <TelegramLinkCard />
      </motion.div>
    </div>
  )
}
