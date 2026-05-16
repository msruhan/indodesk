'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Edit,
  Eye,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  UserCircle,
} from '@/lib/icons'

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

export default function UserAkunPage() {
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil')

  const tabs = [
    { id: 'profil' as const, label: 'Profil', icon: UserCircle },
    { id: 'keamanan' as const, label: 'Keamanan', icon: Shield },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink">Akun Saya</h1>
        <p className="mt-1 text-sm text-surface-500">Kelola profil, keamanan, dan preferensi akun Anda.</p>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300',
                active ? 'text-white' : 'text-surface-600 hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="user-akun-tab"
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

      {activeTab === 'profil' && (
        <motion.div {...fadeIn} className="space-y-4">
          {/* Profile card */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xl font-bold text-white shadow-soft-md">
                    US
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink text-white shadow-soft-xs hover:bg-surface-800">
                    <Edit className="h-3 w-3" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">User Customer</h2>
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle className="h-2.5 w-2.5" /> Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-surface-500">user@indoteknizi.com</p>
                  <p className="mt-1 text-xs text-surface-500">Bergabung sejak Januari 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Informasi Pribadi</h3>
                <Button variant="ghost" size="sm" className="text-primary-700">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">Nama Lengkap</label>
                  <Input value="User Customer" readOnly className="h-10 bg-surface-50" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">Email</label>
                  <Input value="user@indoteknizi.com" readOnly className="h-10 bg-surface-50" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">No. Telepon</label>
                  <Input value="+62 812-3456-7890" readOnly className="h-10 bg-surface-50" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">Alamat</label>
                  <Input value="Jakarta Selatan, DKI Jakarta" readOnly className="h-10 bg-surface-50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identitas */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Verifikasi Identitas (KYC)</h3>
                <Badge variant="success" className="text-[10px]">Terverifikasi</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-surface-50/60 px-3 py-2.5">
                  <User className="h-4 w-4 text-primary-600" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-surface-500">KTP</p>
                    <p className="text-xs font-medium text-ink">3201****1234</p>
                  </div>
                  <CheckCircle className="ml-auto h-4 w-4 text-primary-600" />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-surface-200/70 bg-surface-50/60 px-3 py-2.5">
                  <Phone className="h-4 w-4 text-primary-600" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-surface-500">Nomor HP</p>
                    <p className="text-xs font-medium text-ink">+62 812-****-7890</p>
                  </div>
                  <CheckCircle className="ml-auto h-4 w-4 text-primary-600" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Ganti Identitas
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'keamanan' && (
        <motion.div {...fadeIn} className="space-y-4">
          {/* Password */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Password</h3>
                </div>
                <Badge variant="success" className="text-[10px]">Aktif</Badge>
              </div>
              <p className="mb-3 text-[13px] text-surface-600">
                Terakhir diubah 3 bulan lalu. Gunakan password yang kuat dan unik.
              </p>
              <Button variant="outline" size="sm">
                <Lock className="h-3.5 w-3.5" /> Ubah Password
              </Button>
            </CardContent>
          </Card>

          {/* MFA */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Two-Factor Authentication (2FA)</h3>
                </div>
                <Badge variant="warning" className="text-[10px]">Belum aktif</Badge>
              </div>
              <p className="mb-3 text-[13px] text-surface-600">
                Tambahkan lapisan keamanan ekstra dengan autentikasi dua faktor via Google Authenticator atau SMS.
              </p>
              <Button variant="primary" size="sm">
                <Shield className="h-3.5 w-3.5" /> Aktifkan 2FA
              </Button>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Sesi Aktif</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-primary-200/60 bg-primary-50/40 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    <div>
                      <p className="text-xs font-medium text-ink">Chrome · macOS</p>
                      <p className="text-[10px] text-surface-500">Jakarta · Sesi ini</p>
                    </div>
                  </div>
                  <Badge variant="primary" className="text-[9px]">Aktif</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-surface-200/70 bg-surface-50/60 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-surface-400" />
                    <div>
                      <p className="text-xs font-medium text-ink">Safari · iPhone</p>
                      <p className="text-[10px] text-surface-500">Jakarta · 2 hari lalu</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-rose-600 hover:bg-rose-50">
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-rose-200/70 shadow-soft-xs">
            <CardContent className="p-5">
              <h3 className="mb-2 text-sm font-bold text-rose-700">Zona Berbahaya</h3>
              <p className="mb-3 text-[13px] text-surface-600">
                Hapus akun secara permanen. Semua data akan hilang dan tidak bisa dikembalikan.
              </p>
              <Button variant="outline" size="sm" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                Hapus Akun
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
