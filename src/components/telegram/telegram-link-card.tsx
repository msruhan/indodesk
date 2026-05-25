'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Linkedin, Unlock, CheckCircle, Clock, ExternalLink } from '@/lib/icons'

interface TelegramStatus {
  isLinked: boolean
  telegramUsername?: string | null
  linkedAt?: string | null
}

export function TelegramLinkCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/teknisi/telegram/status')
      if (!res.ok) throw new Error('Gagal mengecek status')
      const result = await res.json()
      if (result.success && result.data) {
        setStatus({
          isLinked: result.data.isLinked,
          telegramUsername: result.data.username,
          linkedAt: result.data.linkedAt,
        })
      }
    } catch (error) {
      console.error('Error fetch status:', error)
      toast.error('Gagal mengecek status Telegram')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStatus()
  }, [])

  // Generate link
  const handleGenerateLink = async () => {
    setLinking(true)
    try {
      const res = await fetch('/api/teknisi/telegram/link', { method: 'POST' })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Gagal generate link')
      }
      const result = await res.json()
      if (result.success && result.data) {
        setVerificationLink(result.data.deepLink)
        // Set expiry 15 minutes from now
        setExpiresAt(new Date(Date.now() + 15 * 60 * 1000))
        toast.success('Link verifikasi berhasil dibuat!')
      }
    } catch (error: any) {
      console.error('Error generate link:', error)
      toast.error(error.message || 'Gagal generate link Telegram')
    } finally {
      setLinking(false)
    }
  }

  // Unlink
  const handleUnlink = async () => {
    if (!confirm('Yakin ingin memutus koneksi Telegram? Anda tidak akan menerima notifikasi lagi.')) {
      return
    }

    setUnlinking(true)
    try {
      const res = await fetch('/api/teknisi/telegram/unlink', { method: 'DELETE' })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Gagal unlink')
      }
      const result = await res.json()
      if (result.success) {
        toast.success('Telegram berhasil diputus dari akun')
        setStatus({ isLinked: false })
        setVerificationLink(null)
        setExpiresAt(null)
      }
    } catch (error: any) {
      console.error('Error unlink:', error)
      toast.error(error.message || 'Gagal memutus koneksi Telegram')
    } finally {
      setUnlinking(false)
    }
  }

  // Refresh status (untuk polling setelah user klik link)
  const handleRefreshStatus = async () => {
    setLoading(true)
    await fetchStatus()
    if (status?.isLinked) {
      setVerificationLink(null)
      setExpiresAt(null)
      toast.success('Telegram berhasil terhubung!')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-surface-500">Memuat...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary-600" />
              Telegram Alerts
            </CardTitle>
            <p className="mt-1 text-sm text-surface-500">
              Terima notifikasi request urgent langsung ke Telegram
            </p>
          </div>
          <Badge variant={status?.isLinked ? 'success' : 'outline'}>
            {status?.isLinked ? 'Terhubung' : 'Belum link'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.isLinked ? (
          <>
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">
                    Akun Terhubung
                  </p>
                  {status.telegramUsername && (
                    <p className="mt-1 text-xs text-emerald-700">
                      @{status.telegramUsername}
                    </p>
                  )}
                  {status.linkedAt && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Terhubung sejak {new Date(status.linkedAt).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-surface-700">Notifikasi yang akan dikirim:</p>
              <ul className="space-y-1 text-xs text-surface-600">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary-500" />
                  Request konsultasi baru
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary-500" />
                  Request remote & inspeksi
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary-500" />
                  Payout siap dicairkan
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary-500" />
                  Pesan dari pelanggan
                </li>
              </ul>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinking}
              className="w-full"
            >
              <Unlock className="h-4 w-4" />
              {unlinking ? 'Memutus...' : 'Putus Koneksi'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm text-surface-600">
                Hubungkan akun Anda dengan bot Telegram untuk menerima notifikasi real-time.
              </p>

              {verificationLink ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary-200/70 bg-primary-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary-900">
                          Link Verifikasi Siap
                        </p>
                        <p className="mt-1 text-xs text-primary-700">
                          Klik tombol di bawah untuk membuka Telegram dan verifikasi akun Anda.
                        </p>
                        {expiresAt && (
                          <p className="mt-1 text-xs text-primary-600">
                            Berlaku hingga {expiresAt.toLocaleTimeString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(verificationLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Telegram
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshStatus}
                      disabled={loading}
                    >
                      Cek Status
                    </Button>
                  </div>

                  <p className="text-xs text-surface-500">
                    Setelah klik link dan verifikasi di Telegram, klik "Cek Status" untuk memperbarui.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateLink}
                  disabled={linking}
                  className="w-full"
                >
                  <Linkedin className="h-4 w-4" />
                  {linking ? 'Membuat Link...' : 'Hubungkan Telegram'}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
