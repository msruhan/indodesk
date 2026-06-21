'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Linkedin, Unlock, CheckCircle, Clock, ExternalLink, RefreshCw } from '@/lib/icons'

interface TelegramStatus {
  isLinked: boolean
  telegramUsername?: string | null
  linkedAt?: string | null
}

export type TelegramLinkEndpoints = {
  status: string
  link: string
  sync: string
  unlink: string
}

const DEFAULT_ENDPOINTS: TelegramLinkEndpoints = {
  status: '/api/teknisi/telegram/status',
  link: '/api/teknisi/telegram/link',
  sync: '/api/teknisi/telegram/sync',
  unlink: '/api/teknisi/telegram/unlink',
}

type TelegramLinkCardProps = {
  endpoints?: TelegramLinkEndpoints
  subtitle?: string
  notificationItems?: string[]
  linkedNote?: string
}

export function TelegramLinkCard({
  endpoints = DEFAULT_ENDPOINTS,
  subtitle = 'Terima notifikasi request urgent langsung ke Telegram',
  notificationItems = [
    'Request konsultasi baru',
    'Request remote & inspeksi',
    'Pesanan marketplace baru',
  ],
  linkedNote = 'Username Telegram Anda ikut tercatat untuk broadcast iklan produk di channel.',
}: TelegramLinkCardProps) {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const applyStatus = useCallback((data: { isLinked: boolean; username?: string | null; linkedAt?: string | null }) => {
    setStatus({
      isLinked: data.isLinked,
      telegramUsername: data.username,
      linkedAt: data.linkedAt,
    })
    if (data.isLinked) {
      setVerificationLink(null)
      setVerificationToken(null)
      setExpiresAt(null)
    }
  }, [])

  const fetchStatus = useCallback(async (): Promise<TelegramStatus | null> => {
    try {
      const res = await fetch(endpoints.status, { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal mengecek status')
      const result = await res.json()
      if (result.success && result.data) {
        const next: TelegramStatus = {
          isLinked: result.data.isLinked,
          telegramUsername: result.data.username,
          linkedAt: result.data.linkedAt,
        }
        applyStatus(result.data)
        return next
      }
    } catch (error) {
      console.error('Error fetch status:', error)
    }
    return null
  }, [applyStatus, endpoints.status])

  const syncLink = useCallback(
    async (opts?: { silent?: boolean }): Promise<boolean> => {
      if (!verificationToken) {
        const current = await fetchStatus()
        return Boolean(current?.isLinked)
      }

      setSyncing(true)
      try {
        const res = await fetch(endpoints.sync, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verificationToken }),
        })
        const result = await res.json()

        if (result.success && result.data?.synced) {
          await fetchStatus()
          if (!opts?.silent) {
            toast.success(
              result.data.username
                ? `Telegram synced — @${result.data.username}`
                : 'Telegram synced!',
            )
          }
          return true
        }

        const refreshed = await fetchStatus()
        if (refreshed?.isLinked) return true

        if (!opts?.silent) {
          toast.info(
            result.data?.message ??
              'Belum terdeteksi. Buka link dari dashboard lalu tekan Start di bot.',
          )
        }
        return false
      } catch (error) {
        console.error('Error sync telegram:', error)
        if (!opts?.silent) toast.error('Gagal sinkronisasi Telegram')
        return false
      } finally {
        setSyncing(false)
      }
    },
    [verificationToken, fetchStatus, endpoints.sync],
  )

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await fetchStatus()
      setLoading(false)
    })()
  }, [fetchStatus])

  useEffect(() => {
    if (!verificationToken || status?.isLinked) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    pollRef.current = setInterval(() => {
      void syncLink({ silent: true })
    }, 4000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [verificationToken, status?.isLinked, syncLink])

  const handleGenerateLink = async () => {
    setLinking(true)
    try {
      const res = await fetch(endpoints.link, { method: 'POST' })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal generate link')
      }
      if (result.data) {
        setVerificationLink(result.data.deepLink)
        setVerificationToken(result.data.token)
        setExpiresAt(
          result.data.expiresAt ? new Date(result.data.expiresAt) : new Date(Date.now() + 10 * 60 * 1000),
        )
        toast.success('Link verifikasi siap — buka Telegram dan tekan Start')
      }
    } catch (error: unknown) {
      console.error('Error generate link:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal generate link Telegram')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlink = async () => {
    if (!confirm('Yakin ingin memutus koneksi Telegram? Anda tidak akan menerima notifikasi lagi.')) {
      return
    }

    setUnlinking(true)
    try {
      const res = await fetch(endpoints.unlink, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal unlink')
      }
      toast.success('Telegram berhasil diputus dari akun')
      setStatus({ isLinked: false })
      setVerificationLink(null)
      setVerificationToken(null)
      setExpiresAt(null)
    } catch (error: unknown) {
      console.error('Error unlink:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal memutus koneksi Telegram')
    } finally {
      setUnlinking(false)
    }
  }

  const handleRefreshStatus = async () => {
    setLoading(true)
    const linked = await syncLink()
    if (!linked) await fetchStatus()
    setLoading(false)
  }

  if (loading && !status) {
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
            <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
          </div>
          <Badge variant={status?.isLinked ? 'success' : 'outline'}>
            {status?.isLinked ? 'Synced' : 'Belum link'}
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
                  <p className="text-sm font-semibold text-emerald-900">Synced</p>
                  {status.telegramUsername ? (
                    <p className="mt-1 text-sm font-medium text-emerald-800">
                      @{status.telegramUsername}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-700">Username Telegram tersimpan</p>
                  )}
                  {status.linkedAt ? (
                    <p className="mt-1 text-xs text-emerald-600">
                      Terhubung sejak {new Date(status.linkedAt).toLocaleString('id-ID')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-surface-700">Notifikasi yang akan dikirim:</p>
              <ul className="space-y-1 text-xs text-surface-600">
                {notificationItems.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary-500" />
                    {item}
                  </li>
                ))}
              </ul>
              {linkedNote ? (
                <p className="text-[11px] text-surface-500">{linkedNote}</p>
              ) : null}
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
                        <p className="text-sm font-semibold text-primary-900">Link Verifikasi Siap</p>
                        <p className="mt-1 text-xs text-primary-700">
                          Klik &quot;Buka Telegram&quot; lalu tekan <strong>Start</strong> di bot.
                          Jangan ketik /start manual.
                        </p>
                        {expiresAt ? (
                          <p className="mt-1 text-xs text-primary-600">
                            Berlaku hingga {expiresAt.toLocaleTimeString('id-ID')}
                          </p>
                        ) : null}
                        {syncing ? (
                          <p className="mt-2 text-xs font-medium text-primary-800">
                            Menunggu konfirmasi dari Telegram…
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(verificationLink, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Telegram
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRefreshStatus()}
                      disabled={loading || syncing}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Sync…' : 'Cek Status'}
                    </Button>
                  </div>

                  <p className="text-xs text-surface-500">
                    Status akan otomatis berubah menjadi Synced setelah Anda menekan Start di bot.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleGenerateLink()}
                  disabled={linking}
                  className="w-full"
                >
                  <Linkedin className="h-4 w-4" />
                  {linking ? 'Membuat Link…' : 'Hubungkan Telegram'}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
