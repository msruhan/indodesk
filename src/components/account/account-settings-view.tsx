'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useUserProfile } from '@/hooks/use-user-profile'
import { GoogleLinkCard } from '@/components/account/google-link-card'
import { PasswordChangedSuccessModal } from '@/components/account/password-changed-success-modal'
import {
  CheckCircle,
  Edit,
  Lock,
  Mail,
  Shield,
  UserCircle,
  X,
} from '@/lib/icons'

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatJoinDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(iso))
}

function formatPasswordChanged(iso: string | null): string {
  if (!iso) return 'Belum pernah diubah'
  const date = new Date(iso)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'Diubah hari ini'
  if (diffDays < 30) return `Diubah ${diffDays} hari lalu`
  const months = Math.floor(diffDays / 30)
  return `Diubah ${months} bulan lalu`
}

type VerifyQueryStatus = 'success' | 'invalid' | 'missing' | 'sent'

function EmailVerifyQuerySync({
  onStatus,
}: {
  onStatus: (status: VerifyQueryStatus) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const verify = searchParams.get('verify')
    if (verify === 'success' || verify === 'invalid' || verify === 'missing' || verify === 'sent') {
      onStatus(verify)
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, router, pathname, onStatus])

  return null
}

function GoogleLinkedQuerySync({ onLinked }: { onLinked: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('google') !== 'linked') return
    onLinked()
    router.replace(pathname, { scroll: false })
  }, [searchParams, router, pathname, onLinked])

  return null
}

type AccountSettingsViewProps = {
  /** Hide KYC mock block on teknisi profile tab */
  showKycSection?: boolean
  initialTab?: 'profil' | 'keamanan'
  hideTabBar?: boolean
}

export function AccountSettingsView({
  showKycSection = true,
  initialTab = 'profil',
  hideTabBar = false,
}: AccountSettingsViewProps) {
  const { update } = useSession()
  const { profile, loading, error, reload, setProfile } = useUserProfile()
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>(initialTab)

  const [editingProfile, setEditingProfile] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [passwordChangedModalOpen, setPasswordChangedModalOpen] = useState(false)

  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'disable'>('idle')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [twoFaMsg, setTwoFaMsg] = useState<string | null>(null)

  const [sendingVerification, setSendingVerification] = useState(false)
  const [emailVerifyMsg, setEmailVerifyMsg] = useState<string | null>(null)
  const [googleLinkMsg, setGoogleLinkMsg] = useState<string | null>(null)

  const handleGoogleLinked = useCallback(() => {
    setActiveTab('keamanan')
    setGoogleLinkMsg('Google berhasil dihubungkan. Anda dapat login dengan tombol "Lanjutkan dengan Google".')
    void reload()
  }, [reload])

  const handleVerifyQuery = useCallback((status: VerifyQueryStatus) => {
    setActiveTab('keamanan')
    if (status === 'success') {
      setEmailVerifyMsg('Email berhasil diverifikasi.')
      void reload()
    } else if (status === 'sent') {
      setEmailVerifyMsg(
        'Akun berhasil dibuat. Kami telah mengirim email verifikasi — periksa inbox Anda (atau log server jika SMTP belum dikonfigurasi).',
      )
    } else if (status === 'invalid') {
      setEmailVerifyMsg('Tautan verifikasi tidak valid atau sudah kedaluwarsa.')
    } else {
      setEmailVerifyMsg('Tautan verifikasi tidak ditemukan.')
    }
  }, [reload])

  const sendVerificationEmail = async () => {
    setSendingVerification(true)
    setEmailVerifyMsg(null)
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        setEmailVerifyMsg(data.error || 'Gagal mengirim email verifikasi')
        return
      }
      setEmailVerifyMsg(data.data?.message ?? 'Email verifikasi telah dikirim. Periksa inbox Anda.')
    } catch {
      setEmailVerifyMsg('Gagal menghubungi server')
    } finally {
      setSendingVerification(false)
    }
  }

  const syncSession = useCallback(
    async (patch: { name?: string; image?: string | null }) => {
      await update(patch)
    },
    [update],
  )

  const startEditProfile = () => {
    if (!profile) return
    setName(profile.name)
    setPhone(profile.phone ?? '')
    setAddress(profile.address ?? '')
    setEditingProfile(true)
    setProfileMsg(null)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || null, address: address || null }),
      })
      const data = await res.json()
      if (!data.success) {
        setProfileMsg(data.error || 'Gagal menyimpan')
        return
      }
      setProfile(data.data)
      setEditingProfile(false)
      setProfileMsg('Profil berhasil disimpan')
      await syncSession({ name: data.data.name })
    } catch {
      setProfileMsg('Gagal menyimpan profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setProfileMsg(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/user/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!data.success) {
        setProfileMsg(data.error || 'Gagal mengunggah foto')
        return
      }
      setProfile(data.data)
      setProfileMsg('Foto profil diperbarui')
      await syncSession({ image: data.data.image })
    } catch {
      setProfileMsg('Gagal mengunggah foto')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Konfirmasi password tidak cocok')
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!data.success) {
        setPasswordMsg(data.error || 'Gagal mengubah password')
        return
      }
      setPasswordMsg(null)
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordChangedModalOpen(true)
    } catch {
      setPasswordMsg('Gagal mengubah password')
    } finally {
      setSavingPassword(false)
    }
  }

  const start2faSetup = async () => {
    setTwoFaLoading(true)
    setTwoFaMsg(null)
    try {
      const res = await fetch('/api/user/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        setTwoFaMsg(data.error || 'Gagal setup 2FA')
        return
      }
      setQrDataUrl(data.data.qrDataUrl)
      setTwoFaStep('setup')
      setTotpCode('')
    } catch {
      setTwoFaMsg('Gagal setup 2FA')
    } finally {
      setTwoFaLoading(false)
    }
  }

  const enable2fa = async () => {
    setTwoFaLoading(true)
    setTwoFaMsg(null)
    try {
      const res = await fetch('/api/user/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      })
      const data = await res.json()
      if (!data.success) {
        setTwoFaMsg(data.error || 'Kode tidak valid')
        return
      }
      setTwoFaStep('idle')
      setQrDataUrl(null)
      setTotpCode('')
      setTwoFaMsg('2FA Google Authenticator aktif')
      void reload()
    } catch {
      setTwoFaMsg('Gagal mengaktifkan 2FA')
    } finally {
      setTwoFaLoading(false)
    }
  }

  const disable2fa = async () => {
    setTwoFaLoading(true)
    setTwoFaMsg(null)
    try {
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: totpCode }),
      })
      const data = await res.json()
      if (!data.success) {
        setTwoFaMsg(data.error || 'Gagal menonaktifkan 2FA')
        return
      }
      setTwoFaStep('idle')
      setDisablePassword('')
      setTotpCode('')
      setTwoFaMsg('2FA dinonaktifkan')
      void reload()
    } catch {
      setTwoFaMsg('Gagal menonaktifkan 2FA')
    } finally {
      setTwoFaLoading(false)
    }
  }

  const tabs = [
    { id: 'profil' as const, label: 'Profil', icon: UserCircle },
    { id: 'keamanan' as const, label: 'Keamanan', icon: Shield },
  ]

  if (loading) {
    return <div className="p-6 text-sm text-surface-500">Memuat akun...</div>
  }

  if (error || !profile) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-rose-600">{error || 'Profil tidak tersedia'}</p>
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  return (
    <>
    <motion.div className="space-y-5">
      <Suspense fallback={null}>
        <EmailVerifyQuerySync onStatus={handleVerifyQuery} />
        <GoogleLinkedQuerySync onLinked={handleGoogleLinked} />
      </Suspense>
      {!hideTabBar && (
      <div className="inline-flex items-center gap-1 rounded-full border border-surface-200/70 bg-white/80 p-1 shadow-soft-xs backdrop-blur-md">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300',
                active ? 'text-white' : 'text-surface-600 hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="account-settings-tab"
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
      )}

      {profileMsg && (
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">{profileMsg}</div>
      )}

      {activeTab === 'profil' && (
        <motion.div {...fadeIn} className="space-y-4">
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xl font-bold text-white shadow-soft-md">
                    {profile.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(profile.name)
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink text-white shadow-soft-xs hover:bg-surface-800 disabled:opacity-60"
                    aria-label="Ubah foto profil"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => void onAvatarPick(e)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-ink">{profile.name}</h2>
                  <p className="text-sm text-surface-500">{profile.email}</p>
                  <p className="mt-1 text-xs text-surface-500">
                    Bergabung sejak {formatJoinDate(profile.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Informasi Pribadi</h3>
                {!editingProfile ? (
                  <Button variant="ghost" size="sm" className="text-primary-700" onClick={startEditProfile}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
                      <X className="h-3.5 w-3.5" /> Batal
                    </Button>
                    <Button variant="primary" size="sm" disabled={savingProfile} onClick={() => void saveProfile()}>
                      {savingProfile ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                    Nama Lengkap
                  </label>
                  <Input
                    value={editingProfile ? name : profile.name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!editingProfile}
                    className={cn('h-10', !editingProfile && 'bg-surface-50')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                    Email
                  </label>
                  <Input value={profile.email} readOnly className="h-10 bg-surface-50" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                    No. Telepon
                  </label>
                  <Input
                    value={editingProfile ? phone : profile.phone ?? ''}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={!editingProfile}
                    placeholder="Opsional"
                    className={cn('h-10', !editingProfile && 'bg-surface-50')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-surface-500">
                    Alamat
                  </label>
                  <Input
                    value={editingProfile ? address : profile.address ?? ''}
                    onChange={(e) => setAddress(e.target.value)}
                    readOnly={!editingProfile}
                    placeholder="Opsional"
                    className={cn('h-10', !editingProfile && 'bg-surface-50')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {showKycSection && (
            <Card className="shadow-soft-xs opacity-60">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Verifikasi Identitas (KYC)</h3>
                  <Badge variant="outline" className="text-[10px]">
                    Segera hadir
                  </Badge>
                </div>
                <p className="text-xs text-surface-500">Fitur KYC akan tersedia pada update berikutnya.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {activeTab === 'keamanan' && (
        <motion.div {...fadeIn} className="space-y-4">
          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Verifikasi Email</h3>
                </div>
                <Badge
                  variant={profile.emailVerified ? 'success' : 'warning'}
                  className="text-[10px]"
                >
                  {profile.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}
                </Badge>
              </div>
              <p className="mb-1 text-[13px] text-surface-600">{profile.email}</p>
              <p className="mb-3 text-xs text-surface-500">
                {profile.emailVerified
                  ? 'Email Anda sudah terverifikasi. Diperlukan untuk checkout, top-up, penarikan saldo, dan rekber.'
                  : 'Verifikasi email diperlukan sebelum checkout, top-up saldo, penarikan, atau membuat transaksi rekber.'}
              </p>
              {emailVerifyMsg && (
                <p
                  className={cn(
                    'mb-3 text-xs',
                    emailVerifyMsg.includes('berhasil') ||
                      emailVerifyMsg.includes('dikirim') ||
                      emailVerifyMsg.includes('terverifikasi')
                      ? 'text-primary-700'
                      : 'text-rose-600',
                  )}
                >
                  {emailVerifyMsg}
                </p>
              )}
              {!profile.emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendingVerification}
                  onClick={() => void sendVerificationEmail()}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {sendingVerification ? 'Mengirim…' : 'Kirim email verifikasi'}
                </Button>
              )}
            </CardContent>
          </Card>

          {profile && (
            <GoogleLinkCard profile={profile} onChanged={reload} />
          )}
          {googleLinkMsg && (
            <p className="text-xs text-primary-700">{googleLinkMsg}</p>
          )}

          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Password</h3>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Aktif
                </Badge>
              </div>
              <p className="mb-3 text-[13px] text-surface-600">
                {formatPasswordChanged(profile.passwordChangedAt)}. Gunakan password yang kuat dan unik.
              </p>
              {passwordMsg && (
                <p className={cn('mb-3 text-xs', passwordMsg.includes('berhasil') ? 'text-primary-700' : 'text-rose-600')}>
                  {passwordMsg}
                </p>
              )}
              {!profile.hasPassword ? (
                <p className="text-xs text-surface-500">Akun OAuth — ubah password tidak tersedia.</p>
              ) : !showPasswordForm ? (
                <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                  <Lock className="h-3.5 w-3.5" /> Ubah Password
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Password lama"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password baru (min. 8 karakter)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Konfirmasi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <motion.div className="flex gap-2">
                    <Button variant="primary" size="sm" disabled={savingPassword} onClick={() => void savePassword()}>
                      {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                      Batal
                    </Button>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft-xs">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink">Google Authenticator (2FA)</h3>
                </div>
                <Badge variant={profile.twoFactorEnabled ? 'success' : 'warning'} className="text-[10px]">
                  {profile.twoFactorEnabled ? 'Aktif' : 'Belum aktif'}
                </Badge>
              </div>
              <p className="mb-3 text-[13px] text-surface-600">
                Scan QR dengan aplikasi Google Authenticator untuk kode login 6 digit.
              </p>
              {twoFaMsg && (
                <p
                  className={cn(
                    'mb-3 text-xs',
                    twoFaMsg.includes('aktif') || twoFaMsg.includes('dinonaktifkan')
                      ? 'text-primary-700'
                      : 'text-rose-600',
                  )}
                >
                  {twoFaMsg}
                </p>
              )}

              <AnimatePresence mode="wait">
                {twoFaStep === 'setup' && qrDataUrl && (
                  <motion.div
                    key="setup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 space-y-3 rounded-xl border border-surface-200/70 bg-surface-50/60 p-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Google Authenticator" className="mx-auto h-44 w-44 rounded-lg" />
                    <p className="text-center text-xs text-surface-600">
                      Buka Google Authenticator → tambah akun → scan QR. Setelah scan, masukkan kode yang
                      baru muncul (bukan kode lama).
                    </p>
                    <p className="text-center text-[11px] text-surface-500">
                      Jika sudah scan, jangan klik &quot;Aktifkan 2FA&quot; lagi — langsung isi kode di bawah.
                    </p>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Kode 6 digit"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center tracking-widest"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={twoFaLoading || totpCode.length !== 6}
                        onClick={() => void enable2fa()}
                      >
                        Verifikasi & Aktifkan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void fetch('/api/user/2fa/cancel-setup', { method: 'POST' })
                          setTwoFaStep('idle')
                          setQrDataUrl(null)
                          setTotpCode('')
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </motion.div>
                )}

                {twoFaStep === 'disable' && (
                  <motion.div
                    key="disable"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 space-y-3 rounded-xl border border-rose-200/60 bg-rose-50/30 p-4"
                  >
                    <Input
                      type="password"
                      placeholder="Password akun"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                    />
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Kode Google Authenticator"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={twoFaLoading} onClick={() => void disable2fa()}>
                        Nonaktifkan 2FA
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setTwoFaStep('idle')}>
                        Batal
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!profile.twoFactorEnabled && twoFaStep === 'idle' && (
                <Button variant="primary" size="sm" disabled={twoFaLoading} onClick={() => void start2faSetup()}>
                  <Shield className="h-3.5 w-3.5" /> Aktifkan 2FA
                </Button>
              )}
              {profile.twoFactorEnabled && twoFaStep === 'idle' && (
                <Button variant="outline" size="sm" onClick={() => setTwoFaStep('disable')}>
                  Nonaktifkan 2FA
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
    <PasswordChangedSuccessModal open={passwordChangedModalOpen} />
    </>
  )
}
