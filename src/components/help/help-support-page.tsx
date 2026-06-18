'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, MessageCircle, AlertCircle } from '@/lib/icons'
import type { HelpArticleDto } from '@/lib/help-serializer'
import { TeknisiProductPublishFaq } from '@/components/help/teknisi-product-publish-faq'

type HelpAudience = 'user' | 'teknisi' | 'admin'

type HelpPayload = {
  articles: HelpArticleDto[]
  contact: {
    platformName: string
    supportEmail: string
    supportPhone: string
    maintenanceMode: boolean
  }
}

const audienceTitles: Record<HelpAudience, { title: string; subtitle: string }> = {
  user: { title: 'Help & Support', subtitle: 'Bantuan dan dukungan untuk user' },
  teknisi: { title: 'Help & Support', subtitle: 'Bantuan dan dukungan untuk teknisi' },
  admin: { title: 'Help & Support', subtitle: 'Bantuan dan dukungan untuk admin' },
}

const ticketHref: Partial<Record<HelpAudience, string>> = {
  user: '/user/bantuan/tiket/new',
  teknisi: '/teknisi/bantuan/tiket/new',
}

export function HelpSupportPage({ audience }: { audience: HelpAudience }) {
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

  const meta = audienceTitles[audience]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tightest text-ink lg:text-3xl">{meta.title}</h1>
        <p className="mt-1 text-sm text-surface-500">{meta.subtitle}</p>
      </div>

      {loading ? (
        <p className="text-sm text-surface-500">Memuat…</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-rose-600">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ticketHref[audience] ? (
            <Card className="md:col-span-2 border-primary-100 bg-primary-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-primary-600" />
                  Ada kendala?
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-surface-600">
                  Laporkan masalah layanan atau gangguan platform ke tim admin melalui tiket
                  terstruktur.
                </p>
                <Button asChild size="sm">
                  <Link href={ticketHref[audience]!}>Buka Tiket</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                FAQ
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
                  <p className="text-sm text-surface-500">Belum ada FAQ untuk peran ini.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
