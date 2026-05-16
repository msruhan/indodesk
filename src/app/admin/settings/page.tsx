'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardPageHeader, DashboardPanel, InsightCard } from '@/components/dashboard'
import { Bell, CheckCircle, Lock, MessageCircle, Shield, Smartphone } from '@/lib/icons'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Admin control"
        title="Settings"
        description="Kelola konfigurasi platform, keamanan akun admin, dan preferensi notifikasi operasional."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardPanel
          title="Pengaturan Platform"
          description="Informasi utama yang dipakai pada seluruh dashboard dan komunikasi sistem."
        >
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Nama Platform</label>
                <Input defaultValue="IndoTeknizi" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Email Admin</label>
                <Input type="email" defaultValue="admin@indoteknizi.com" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Simpan Perubahan</Button>
              <Button variant="outline">Batal</Button>
            </div>
          </form>
        </DashboardPanel>

        <DashboardPanel
          title="Security Center"
          description="Kontrol akses admin dan perlindungan akun."
        >
          <div className="space-y-3">
            <InsightCard
              icon={Shield}
              title="MFA belum wajib"
              description="Aktifkan TOTP/Authenticator untuk semua admin agar akses dashboard lebih aman."
              tone="warning"
            />
            <InsightCard
              icon={Smartphone}
              title="3 device aktif"
              description="Review device yang login dan cabut session tidak dikenal."
              tone="neutral"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="primary">
                <Lock className="h-4 w-4" />
                Aktifkan MFA
              </Button>
              <Button size="sm" variant="outline">Kelola Session</Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Notification Preferences"
        description="Pilih channel untuk alert penting seperti approval, rekber, chat, dan security."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Bell, title: 'In-app notifications', status: 'Aktif', desc: 'Seluruh alert masuk ke notification center.' },
            { icon: MessageCircle, title: 'WhatsApp alerts', status: 'Belum link', desc: 'Cocok untuk escrow dan approval urgent.' },
            { icon: CheckCircle, title: 'Telegram alerts', status: 'Belum link', desc: 'Channel cepat untuk admin operasional.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-surface-200/70 bg-white/70 p-4">
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
    </div>
  )
}
