'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import {
  defaultConsultationServices,
  type ProfileConsultationService,
} from '@/lib/teknisi-profile-content'
import { ConsultationServicesEditor } from '@/components/teknisi/consultation-services-editor'
import { InspectionServiceToggle } from '@/components/teknisi/inspection-service-toggle'

export function TeknisiProfileServicesForm({
  profile,
  onSaved,
  onClose,
}: {
  profile: TeknisiAccountProfileDto
  onSaved: (p: TeknisiAccountProfileDto) => void
  onClose: () => void
}) {
  const [services, setServices] = useState<ProfileConsultationService[]>([])
  const [providesInspection, setProvidesInspection] = useState(profile.providesInspection)
  const [inspectionPriceOnline, setInspectionPriceOnline] = useState(profile.inspectionPriceOnline)
  const [inspectionPriceOffline, setInspectionPriceOffline] = useState(profile.inspectionPriceOffline)
  const [saving, setSaving] = useState(false)
  const [formMsg, setFormMsg] = useState<string | null>(null)

  useEffect(() => {
    const list = profile.consultationServices?.length
      ? profile.consultationServices
      : defaultConsultationServices(profile.specialty, profile.price)
    setServices(list)
    setProvidesInspection(profile.providesInspection)
    setInspectionPriceOnline(profile.inspectionPriceOnline)
    setInspectionPriceOffline(profile.inspectionPriceOffline)
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setFormMsg(null)
    try {
      const res = await fetch('/api/teknisi/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationServices: services.map((s) => ({
            name: s.name.trim(),
            description: s.description.trim(),
            duration: s.duration.trim(),
            price: s.price,
            popular: s.popular,
            requiresRemote: s.requiresRemote,
          })),
          providesInspection,
          inspectionPriceOnline: providesInspection ? inspectionPriceOnline : null,
          inspectionPriceOffline: providesInspection ? inspectionPriceOffline : null,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setFormMsg(data.error || 'Gagal menyimpan layanan')
        return
      }
      onSaved(data.data)
      onClose()
    } catch {
      setFormMsg('Gagal menyimpan layanan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {formMsg ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{formMsg}</p>
      ) : null}

      <div className="space-y-3">
        <p className="text-[11px] text-surface-500">
          Paket konsultasi tampil di bagian &quot;Bandingkan & Pilih&quot; pada profil publik.
        </p>
        <ConsultationServicesEditor
          services={services}
          basePrice={profile.price}
          onChange={setServices}
        />
      </div>

      <div className="border-t border-surface-100 pt-4">
        <InspectionServiceToggle
          enabled={providesInspection}
          onChange={setProvidesInspection}
          priceOnline={inspectionPriceOnline}
          priceOffline={inspectionPriceOffline}
          onPriceOnlineChange={setInspectionPriceOnline}
          onPriceOfflineChange={setInspectionPriceOffline}
        />
      </div>

      <div className={cn('flex gap-2 border-t border-surface-100 pt-4')}>
        <Button type="button" variant="primary" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          Batal
        </Button>
      </div>
    </div>
  )
}
