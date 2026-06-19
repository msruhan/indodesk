'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardPageHeader, DashboardPanel } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import { AccountSettingsView } from '@/components/account/account-settings-view'
import { TeknisiProfileForm } from '@/components/teknisi/teknisi-profile-form'
import { TeknisiProfileJadwalForm } from '@/components/teknisi/teknisi-profile-jadwal-form'
import { TeknisiPortfolioSection } from '@/components/teknisi/teknisi-portfolio-section'
import { TeknisiCertificationSection } from '@/components/teknisi/teknisi-certification-section'
import { TeknisiTrustBadges } from '@/components/teknisi/teknisi-trust-badges'
import { TelegramLinkCard } from '@/components/telegram/telegram-link-card'
import { useTeknisiProfile } from '@/hooks/use-teknisi-profile'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import {
  Award,
  Bell,
  Briefcase,
  Clock,
  MessageCircle,
  Settings,
  UserCircle,
} from '@/lib/icons'

export type TeknisiAkunTab = 'profil' | 'jadwal' | 'portfolio' | 'sertifikasi' | 'pengaturan'

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

const TABS: { id: TeknisiAkunTab; label: string; icon: typeof UserCircle }[] = [
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'jadwal', label: 'Jadwal', icon: Clock },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'sertifikasi', label: 'Sertifikasi', icon: Award },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
]

function parseTab(raw: string | null): TeknisiAkunTab {
  if (raw === 'jadwal' || raw === 'portfolio' || raw === 'sertifikasi' || raw === 'pengaturan') return raw
  return 'profil'
}

function tabQuery(tab: TeknisiAkunTab): string {
  return tab === 'profil' ? '' : `?tab=${tab}`
}

function ProfileTabContent({
  profile,
  setProfile,
  onSessionUpdate,
}: {
  profile: TeknisiAccountProfileDto
  setProfile: (p: TeknisiAccountProfileDto) => void
  onSessionUpdate: (name: string, image?: string) => void
}) {
  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <TeknisiProfileForm
            profile={profile}
            onSaved={setProfile}
            onSessionUpdate={onSessionUpdate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik & Status</CardTitle>
        </CardHeader>
        <CardContent>
          <TeknisiTrustBadges
            badge={profile.badge}
            isVerified={profile.isVerified}
            isOnline={profile.isOnline}
            showCriteriaHint
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function JadwalTabContent({
  profile,
  setProfile,
}: {
  profile: TeknisiAccountProfileDto
  setProfile: (p: TeknisiAccountProfileDto) => void
}) {
  return (
    <motion.div {...fadeIn}>
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Ketersediaan</CardTitle>
        </CardHeader>
        <CardContent>
          <TeknisiProfileJadwalForm profile={profile} onSaved={setProfile} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PortfolioTabContent() {
  return (
    <motion.div {...fadeIn}>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio & Case Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <TeknisiPortfolioSection />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SertifikasiTabContent() {
  return (
    <motion.div {...fadeIn}>
      <Card>
        <CardHeader>
          <CardTitle>Sertifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <TeknisiCertificationSection />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PengaturanTabContent() {
  return (
    <motion.div {...fadeIn} className="space-y-6">
      <AccountSettingsView showKycSection={false} initialTab="keamanan" hideTabBar />

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

          <div className="rounded-2xl border border-surface-200/70 bg-white/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </span>
              <Badge variant="success">Aktif</Badge>
            </div>
            <p className="text-sm font-semibold text-ink">WhatsApp reminders</p>
            <p className="mt-1 text-xs leading-relaxed text-surface-500">
              Reminder konsultasi dan remote masuk ke WhatsApp.
            </p>
          </div>

          <TelegramLinkCard />
        </div>
      </DashboardPanel>
    </motion.div>
  )
}

function AkunTabBody({
  tab,
  profile,
  setProfile,
  onSessionUpdate,
}: {
  tab: TeknisiAkunTab
  profile: TeknisiAccountProfileDto
  setProfile: (p: TeknisiAccountProfileDto) => void
  onSessionUpdate: (name: string, image?: string) => void
}) {
  switch (tab) {
    case 'profil':
      return (
        <ProfileTabContent
          profile={profile}
          setProfile={setProfile}
          onSessionUpdate={onSessionUpdate}
        />
      )
    case 'jadwal':
      return <JadwalTabContent profile={profile} setProfile={setProfile} />
    case 'portfolio':
      return <PortfolioTabContent />
    case 'sertifikasi':
      return <SertifikasiTabContent />
    case 'pengaturan':
      return <PengaturanTabContent />
  }
}

export function TeknisiAkunView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const { profile, loading, error, reload, setProfile } = useTeknisiProfile()

  const activeTab = parseTab(searchParams.get('tab'))

  const setTab = useCallback(
    (tab: TeknisiAkunTab) => {
      router.replace(`/teknisi/settings${tabQuery(tab)}`, { scroll: false })
    },
    [router],
  )

  const onSessionUpdate = useCallback(
    (name: string, image?: string) => {
      void update({ name, image })
    },
    [update],
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Profil"
        description="Kelola profil publik teknisi, keamanan login, dan preferensi notifikasi."
      />

      <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-min items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300',
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
      </div>

      {loading ? (
        <p className="text-sm text-surface-500">Memuat profil…</p>
      ) : error || !profile ? (
        <div className="space-y-3">
          <p className="text-sm text-rose-600">{error ?? 'Profil tidak tersedia'}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <AkunTabBody
          tab={activeTab}
          profile={profile}
          setProfile={setProfile}
          onSessionUpdate={onSessionUpdate}
        />
      )}
    </div>
  )
}
