'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardPageHeader, DashboardPanel, InsightCard } from '@/components/dashboard'
import { Bell, CheckCircle, Lock, MessageCircle, Shield, Smartphone } from '@/lib/icons'

export default function TeknisiSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Account control"
        title="Settings"
        description="Kelola profil akun, keamanan login, dan channel notifikasi konsultasi/remote."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardPanel
          title="Informasi Akun"
          description="Data utama yang dipakai untuk konsultasi, payout, dan verifikasi pelanggan."
        >
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Nama</label>
                <Input defaultValue="Ahmad Hidayat" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Email</label>
                <Input type="email" defaultValue="ahmad@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">No. Telepon</label>
                <Input defaultValue="081234567890" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1 block">Password Baru</label>
                <Input type="password" placeholder="••••••••" />
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
          description="Lindungi akun teknisi dan akses payout."
        >
          <div className="space-y-3">
            <InsightCard
              icon={Shield}
              title="Authenticator belum aktif"
              description="Aktifkan OTP untuk melindungi saldo, payout, dan akses remote."
              tone="warning"
            />
            <InsightCard
              icon={Smartphone}
              title="2 device dipercaya"
              description="Cabut akses device lama jika tidak lagi digunakan."
              tone="neutral"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="primary">
                <Lock className="h-4 w-4" />
                Aktifkan OTP
              </Button>
              <Button size="sm" variant="outline">Trusted Devices</Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Notification Preferences"
        description="Atur channel untuk request konsultasi, remote, payout, dan pesan pelanggan."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Bell, title: 'In-app notifications', status: 'Aktif', desc: 'Seluruh alert tampil di dashboard.' },
            { icon: MessageCircle, title: 'WhatsApp reminders', status: 'Belum link', desc: 'Reminder konsultasi dan remote masuk ke WhatsApp.' },
            { icon: CheckCircle, title: 'Telegram alerts', status: 'Belum link', desc: 'Alert payout dan request urgent ke Telegram.' },
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
