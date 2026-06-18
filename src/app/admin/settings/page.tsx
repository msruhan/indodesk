'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { DashboardPageHeader, DashboardPanel } from '@/components/dashboard'
import { AccountSettingsView } from '@/components/account/account-settings-view'
import { AdminPlatformSettingsForm } from '@/components/admin/admin-platform-settings-form'
import { AdminSmtpSettingsForm } from '@/components/admin/admin-smtp-settings-form'
import { Bell, CheckCircle, MessageCircle } from '@/lib/icons'

function SecuritySettingsFallback() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-24 animate-pulse rounded-xl bg-surface-100" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-100" />
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Kontrol Admin"
        title="Profil"
        description="Kelola konfigurasi platform, keamanan akun admin, dan preferensi notifikasi operasional."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel
          title="Pengaturan Platform"
          description="Informasi utama yang dipakai pada seluruh dashboard dan komunikasi sistem."
        >
          <AdminPlatformSettingsForm />
        </DashboardPanel>

        <DashboardPanel
          title="Pusat Keamanan"
          description="Password akun admin dan Google Authenticator (2FA) untuk login."
        >
          <Suspense fallback={<SecuritySettingsFallback />}>
            <AccountSettingsView showKycSection={false} initialTab="keamanan" hideTabBar />
          </Suspense>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Pengaturan SMTP (Email)"
        description="Konfigurasi server email untuk OTP penarikan saldo, reset password, verifikasi akun, dan notifikasi."
      >
        <AdminSmtpSettingsForm />
      </DashboardPanel>

      <DashboardPanel
        title="Preferensi Notifikasi"
        description="Pilih channel untuk alert penting seperti approval, rekber, chat, dan keamanan."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Bell,
              title: 'In-app notifications',
              status: 'Aktif',
              desc: 'Seluruh alert masuk ke notification center.',
            },
            {
              icon: MessageCircle,
              title: 'WhatsApp alerts',
              status: 'Belum link',
              desc: 'Cocok untuk escrow dan approval urgent.',
            },
            {
              icon: CheckCircle,
              title: 'Telegram alerts',
              status: 'Atur di Pusat Telegram',
              desc: 'Channel broadcast produk baru & template notifikasi teknisi.',
              href: '/admin/telegram-notifications',
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
              {'href' in item && item.href ? (
                <Link
                  href={item.href}
                  className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
                >
                  Buka pengaturan →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </DashboardPanel>
    </div>
  )
}
