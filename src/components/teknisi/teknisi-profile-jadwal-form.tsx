'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TeknisiAccountProfileDto } from '@/lib/teknisi-profile-serializer'
import { STORE_WEEKDAYS, type StoreOperatingHours } from '@/lib/store-operating-hours'
import { OperatingHoursEditor } from './operating-hours-editor'

function deepCopyOperatingHours(hours: StoreOperatingHours): StoreOperatingHours {
  const copy = {} as StoreOperatingHours
  for (const { key } of STORE_WEEKDAYS) {
    copy[key] = { ...hours[key] }
  }
  return copy
}

export function TeknisiProfileJadwalForm({
  profile,
  onSaved,
}: {
  profile: TeknisiAccountProfileDto
  onSaved: (p: TeknisiAccountProfileDto) => void
}) {
  const [hours, setHours] = useState<StoreOperatingHours>(() =>
    deepCopyOperatingHours(profile.operatingHours),
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [formMsg, setFormMsg] = useState<string | null>(null)

  const applyProfile = useCallback((p: TeknisiAccountProfileDto) => {
    setHours(deepCopyOperatingHours(p.operatingHours))
    setDirty(false)
  }, [])

  useEffect(() => {
    applyProfile(profile)
  }, [profile, applyProfile])

  const handleSave = async () => {
    setSaving(true)
    setFormMsg(null)
    try {
      const res = await fetch('/api/teknisi/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatingHours: hours }),
      })
      const data = await res.json()
      if (!data.success) {
        setFormMsg(data.error || 'Gagal menyimpan jadwal')
        return
      }
      onSaved(data.data)
      applyProfile(data.data)
      setFormMsg('Jadwal berhasil disimpan')
    } catch {
      setFormMsg('Gagal menyimpan jadwal')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    applyProfile(profile)
    setFormMsg(null)
  }

  return (
    <div className="space-y-6">
      {formMsg && (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-xs',
            formMsg.includes('berhasil')
              ? 'bg-primary-50 text-primary-800'
              : 'bg-rose-50 text-rose-700',
          )}
        >
          {formMsg}
        </p>
      )}

      <OperatingHoursEditor
        title="Jam ketersediaan konsultasi"
        hint="Ditampilkan di sidebar Availability pada profil publik."
        hours={hours}
        onChange={(next) => {
          setHours(next)
          setDirty(true)
        }}
        className="space-y-3"
      />

      <div className="flex gap-2 border-t border-surface-100 pt-4">
        <Button type="button" variant="primary" disabled={saving || !dirty} onClick={() => void handleSave()}>
          {saving ? 'Menyimpan…' : 'Simpan Jadwal'}
        </Button>
        <Button type="button" variant="outline" disabled={saving || !dirty} onClick={handleCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}
