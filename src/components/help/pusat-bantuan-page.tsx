'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TabPills } from '@/components/dashboard'
import { HelpCircle, MessageCircle } from '@/lib/icons'
import type { HelpArticleDto } from '@/lib/help-serializer'
import { SupportTicketListPage } from '@/components/support-ticket/support-ticket-list-page'
import { TeknisiProductPublishFaq } from '@/components/help/teknisi-product-publish-faq'
import type { SupportTicketBasePath } from '@/lib/support-ticket-constants'

type HelpAudience = 'user' | 'teknisi'

type HelpPayload = {
  articles: HelpArticleDto[]
  contact: {
    platformName: string
    supportEmail: string
    supportPhone: string
    maintenanceMode: boolean
  }
}

type BantuanTab = 'faq' | 'tiket' | 'kontak'

const TABS: { id: BantuanTab; label: string }[] = [
  { id: 'faq', label: 'FAQ' },
  { id: 'tiket', label: 'Tiket' },
  { id: 'kontak', label: 'Kontak' },
]

const CONFIG: Record<
  HelpAudience,
  {
    hubPath: string
    ticketBasePath: SupportTicketBasePath
    subtitle: string
    emptyFaq: string
  }
> = {
  user: {
    hubPath: '/user/bantuan',
    ticketBasePath: '/user/bantuan/tiket',
    subtitle: 'FAQ, laporan kendala, dan kontak tim support Bantoo.',
    emptyFaq: 'Belum ada FAQ untuk user.',
  },
  teknisi: {
    hubPath: '/teknisi/bantuan',
    ticketBasePath: '/teknisi/bantuan/tiket',
    subtitle: 'FAQ teknisi, laporan kendala, dan kontak tim support.',
    emptyFaq: 'Belum ada FAQ untuk teknisi.',
  },
}

export function PusatBantuanPage({ audience }: { audience: HelpAudience }) {
  const config = CONFIG[audience]
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: BantuanTab =
    tabParam === 'tiket' || tabParam === 'kontak' || tabParam === 'faq' ? tabParam : 'faq'

  const [data, setData] = useState<HelpPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/help?audience=${audience}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal memuat bantuan')
        return
      }
      setData(json.data)
    } catch {
      setError('Gagal memuat bantuan')
    } finally {
      setLoading(false)
    }
  }, [audience])

  useEffect(() => {
    void load()
  }, [load])

  const setTab = (tab: BantuanTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'faq') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const qs = params.toString()
    router.replace(qs ? `${config.hubPath}?${qs}` : config.hubPath, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">Pusat Bantuan</h1>
        <p className="mt-1 text-sm text-surface-500">{config.subtitle}</p>
      </div>

      <TabPills options={TABS} value={activeTab} onChange={setTab} />

      {activeTab === 'tiket' ? (
        <SupportTicketListPage basePath={config.ticketBasePath} embedded />
      ) : loading ? (
        <p className="text-sm text-surface-500">Memuat…</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-rose-600">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      ) : activeTab === 'faq' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-5 w-5" />
              Pertanyaan umum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audience === 'teknisi' ? <TeknisiProductPublishFaq /> : null}
              {data?.articles.length ? (
                data.articles.map((item) => (
                  <div key={item.id}>
                    <h4 className="mb-2 font-semibold">{item.question}</h4>
                    <p className="text-sm text-surface-500">{item.answer}</p>
                  </div>
                ))
              ) : audience !== 'teknisi' ? (
                <p className="text-sm text-surface-500">{config.emptyFaq}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5" />
              Kontak Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Email Support</h4>
                <p className="text-sm text-surface-500">{data?.contact.supportEmail}</p>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Telepon</h4>
                <p className="text-sm text-surface-500">{data?.contact.supportPhone}</p>
              </div>
              {data?.contact.maintenanceMode ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Platform sedang dalam mode maintenance.
                </p>
              ) : null}
              <p className="text-sm text-surface-600">
                Untuk masalah spesifik terkait order atau layanan, buka tab{' '}
                <button
                  type="button"
                  className="font-medium text-primary-700 hover:underline"
                  onClick={() => setTab('tiket')}
                >
                  Tiket
                </button>{' '}
                dan buat laporan terstruktur.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
