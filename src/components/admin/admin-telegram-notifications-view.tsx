'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardPanel } from '@/components/dashboard'
import { AdminStepUpFields } from '@/components/admin/admin-step-up-fields'
import { renderTelegramTemplate } from '@/lib/telegram/template-render'
import type { EffectiveTelegramTemplate } from '@/lib/telegram/template-store'
import { cn } from '@/lib/utils'
import { Send, RefreshCw } from '@/lib/icons'

type TelegramConfig = {
  botEnabled: boolean
  channelChatId: string | null
  channelChatIdMasked: string | null
  channelConfigured: boolean
}

function audienceLabel(audience: EffectiveTelegramTemplate['audience']) {
  return audience === 'CHANNEL' ? 'Channel' : 'Teknisi pribadi'
}

function TemplateEditorCard({
  template,
  adminTwoFa,
  onSaved,
}: {
  template: EffectiveTelegramTemplate
  adminTwoFa: boolean
  onSaved: () => void
}) {
  const [body, setBody] = useState(template.body)
  const [isEnabled, setIsEnabled] = useState(template.isEnabled)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBody(template.body)
    setIsEnabled(template.isEnabled)
  }, [template.body, template.isEnabled, template.eventKey])

  const preview = useMemo(
    () => renderTelegramTemplate(body, template.sampleVars),
    [body, template.sampleVars],
  )

  const insertPlaceholder = (key: string) => {
    setBody((prev) => `${prev}{{${key}}}`)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/telegram/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventKey: template.eventKey,
          body,
          isEnabled,
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan')
        return
      }
      setConfirmPassword('')
      setTotp('')
      setMessage('Template disimpan.')
      onSaved()
    } catch {
      setError('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset template ini ke default sistem?')) return
    setResetting(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/telegram/templates/${template.eventKey}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal reset')
        return
      }
      setConfirmPassword('')
      setTotp('')
      setMessage('Template direset ke default.')
      onSaved()
    } catch {
      setError('Gagal reset')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-surface-200/70 bg-white/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{template.label}</p>
          <p className="mt-0.5 text-xs text-surface-500">{template.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{audienceLabel(template.audience)}</Badge>
          {template.isCustomized ? <Badge variant="secondary">Kustom</Badge> : null}
          <label className="flex items-center gap-2 text-xs text-surface-600">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="rounded border-surface-300"
            />
            Aktif
          </label>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {template.placeholders.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => insertPlaceholder(key)}
            className="rounded-lg border border-surface-200 bg-surface-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
          >
            {`{{${key}}}`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-600">Isi pesan</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-surface-200/80 bg-white px-3 py-2 font-mono text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-600">
            Preview (data contoh)
          </label>
          <pre
            className={cn(
              'min-h-[12rem] whitespace-pre-wrap rounded-xl border border-surface-200/80',
              'bg-surface-50 px-3 py-2 text-sm text-surface-800',
            )}
          >
            {preview || '—'}
          </pre>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-surface-100 pt-4">
        <AdminStepUpFields
          twoFactorEnabled={adminTwoFa}
          confirmPassword={confirmPassword}
          totp={totp}
          onConfirmPasswordChange={setConfirmPassword}
          onTotpChange={setTotp}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan template'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleReset()}
            disabled={resetting}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Reset default
          </Button>
        </div>
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}

export function AdminTelegramNotificationsView() {
  const [config, setConfig] = useState<TelegramConfig | null>(null)
  const [templates, setTemplates] = useState<EffectiveTelegramTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [channelChatId, setChannelChatId] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [adminTwoFa, setAdminTwoFa] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [testing, setTesting] = useState(false)
  const [configMessage, setConfigMessage] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, templatesRes] = await Promise.all([
        fetch('/api/admin/telegram/config', { cache: 'no-store' }),
        fetch('/api/admin/telegram/templates', { cache: 'no-store' }),
      ])
      const configJson = await configRes.json()
      const templatesJson = await templatesRes.json()
      if (configRes.ok && configJson.success) {
        setConfig(configJson.data)
        setChannelChatId(configJson.data.channelChatId ?? '')
      }
      if (templatesRes.ok && templatesJson.success) {
        setTemplates(templatesJson.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
    void fetch('/api/user/2fa')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAdminTwoFa(Boolean(json.data?.enabled))
      })
      .catch(() => {})
  }, [loadAll])

  const saveConfig = async () => {
    setSavingConfig(true)
    setConfigMessage(null)
    setConfigError(null)
    try {
      const res = await fetch('/api/admin/telegram/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelChatId,
          confirmPassword: adminTwoFa ? undefined : confirmPassword || undefined,
          totp: adminTwoFa ? totp || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfigError(json.error ?? 'Gagal menyimpan')
        return
      }
      setConfig(json.data)
      setConfirmPassword('')
      setTotp('')
      setConfigMessage('Konfigurasi channel disimpan.')
    } catch {
      setConfigError('Gagal menyimpan')
    } finally {
      setSavingConfig(false)
    }
  }

  const testChannel = async () => {
    setTesting(true)
    setConfigMessage(null)
    setConfigError(null)
    try {
      const res = await fetch('/api/admin/telegram/config/test', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setConfigError(json.error ?? 'Gagal kirim pesan uji')
        return
      }
      setConfigMessage('Pesan uji terkirim ke channel.')
    } catch {
      setConfigError('Gagal kirim pesan uji')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-24 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-100" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="koneksi" className="space-y-4">
      <TabsList>
        <TabsTrigger value="koneksi">Koneksi</TabsTrigger>
        <TabsTrigger value="template">Template Pesan</TabsTrigger>
      </TabsList>

      <TabsContent value="koneksi" className="space-y-4">
        <DashboardPanel
          title="Channel Telegram"
          description="Notifikasi produk baru yang sudah dipublish akan dikirim ke channel/grup ini."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={config?.botEnabled ? 'success' : 'outline'}>
                Bot: {config?.botEnabled ? 'Terhubung' : 'Token belum diset'}
              </Badge>
              <Badge variant={config?.channelConfigured ? 'success' : 'outline'}>
                Channel: {config?.channelConfigured ? 'Dikonfigurasi' : 'Belum diatur'}
              </Badge>
            </div>

            <div className="rounded-xl border border-surface-200/70 bg-surface-50/80 p-3 text-xs leading-relaxed text-surface-600">
              <p className="font-medium text-surface-700">Cara setup:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Tambahkan bot IndoTeknizi sebagai admin di channel/grup Telegram.</li>
                <li>Dapatkan Chat ID channel (biasanya dimulai dengan -100…).</li>
                <li>Paste Chat ID di bawah, simpan, lalu kirim pesan uji.</li>
              </ol>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Chat ID channel</label>
              <Input
                value={channelChatId}
                onChange={(e) => setChannelChatId(e.target.value)}
                placeholder="-1001234567890"
              />
              {config?.channelChatIdMasked ? (
                <p className="mt-1 text-xs text-surface-500">
                  Tersimpan: {config.channelChatIdMasked}
                </p>
              ) : null}
            </div>

            <AdminStepUpFields
              twoFactorEnabled={adminTwoFa}
              confirmPassword={confirmPassword}
              totp={totp}
              onConfirmPasswordChange={setConfirmPassword}
              onTotpChange={setTotp}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveConfig()} disabled={savingConfig}>
                {savingConfig ? 'Menyimpan…' : 'Simpan channel'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void testChannel()}
                disabled={testing || !config?.botEnabled}
              >
                <Send className="mr-1.5 h-4 w-4" />
                {testing ? 'Mengirim…' : 'Kirim pesan uji'}
              </Button>
            </div>

            {configMessage ? <p className="text-sm text-emerald-700">{configMessage}</p> : null}
            {configError ? <p className="text-sm text-red-600">{configError}</p> : null}
          </div>
        </DashboardPanel>
      </TabsContent>

      <TabsContent value="template" className="space-y-4">
        {templates.map((t) => (
          <TemplateEditorCard
            key={t.eventKey}
            template={t}
            adminTwoFa={adminTwoFa}
            onSaved={() => void loadAll()}
          />
        ))}
      </TabsContent>
    </Tabs>
  )
}
