'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Check } from '@/lib/icons'
import {
  SERVER_FIELD_PRESETS,
  normalizeFieldKey,
  parseServerFieldDefs,
  type ServerFieldDef,
} from '@/lib/server-fields'

interface ServerServiceEditTarget {
  id: string
  title: string
  price: string | number
  deliveryTime: string | null
  status: 'ACTIVE' | 'INACTIVE'
  requiredFields: string | null
  box: { id: string; title: string }
}

interface Props {
  service: ServerServiceEditTarget
  boxes: { id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}

function defsFromService(service: ServerServiceEditTarget): ServerFieldDef[] {
  return parseServerFieldDefs(service.requiredFields)
}

export function AdminServerServiceEditModal({ service, boxes, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(service.title)
  const [price, setPrice] = useState(String(Number(service.price) || 0))
  const [deliveryTime, setDeliveryTime] = useState(service.deliveryTime ?? '')
  const [status, setStatus] = useState(service.status)
  const [boxId, setBoxId] = useState(service.box.id)
  const [selectedDefs, setSelectedDefs] = useState<ServerFieldDef[]>(() => defsFromService(service))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(service.title)
    setPrice(String(Number(service.price) || 0))
    setDeliveryTime(service.deliveryTime ?? '')
    setStatus(service.status)
    setBoxId(service.box.id)
    setSelectedDefs(defsFromService(service))
  }, [service])

  const presetKeys = useMemo(
    () => new Set(selectedDefs.map((d) => normalizeFieldKey(d.key))),
    [selectedDefs],
  )

  const togglePreset = (preset: ServerFieldDef, enabled: boolean) => {
    const nk = normalizeFieldKey(preset.key)
    if (enabled) {
      setSelectedDefs((prev) => {
        if (prev.some((d) => normalizeFieldKey(d.key) === nk)) return prev
        return [...prev, { ...preset, required: true }]
      })
    } else {
      setSelectedDefs((prev) => prev.filter((d) => normalizeFieldKey(d.key) !== nk))
    }
  }

  const toggleRequired = (key: string) => {
    const nk = normalizeFieldKey(key)
    setSelectedDefs((prev) =>
      prev.map((d) =>
        normalizeFieldKey(d.key) === nk ? { ...d, required: !d.required } : d,
      ),
    )
  }

  const handleSave = async () => {
    const priceNum = Number(price)
    if (!title.trim()) {
      setError('Nama layanan wajib diisi')
      return
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Harga tidak valid')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/imei/server-services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          price: priceNum,
          deliveryTime: deliveryTime.trim() || null,
          status,
          boxId,
          fieldDefs: selectedDefs,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Gagal menyimpan')
        return
      }
      onSaved()
      onClose()
    } catch {
      setError('Koneksi gagal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-xl rounded-2xl border border-surface-200/70 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">Edit Server Service</h3>
            <p className="mt-0.5 text-xs text-surface-500 line-clamp-2">{service.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Nama layanan</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Harga (IDR)</label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Waktu proses</label>
              <Input
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="1-24 jam"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Box / grup</label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="h-9 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-xs"
              >
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="h-9 w-full rounded-xl border border-surface-200/80 bg-white px-3 text-xs"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <p className="text-xs font-semibold text-ink">Field order (yang diminta user)</p>
            <p className="mt-0.5 text-[10px] text-surface-500">
              Centang field yang dibutuhkan. User/teknisi hanya melihat field yang dipilih.
            </p>

            <div className="mt-3 space-y-2">
              {SERVER_FIELD_PRESETS.map((preset) => {
                const nk = normalizeFieldKey(preset.key)
                const active = presetKeys.has(nk)
                const def = selectedDefs.find((d) => normalizeFieldKey(d.key) === nk)
                return (
                  <div
                    key={preset.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-white/80 bg-white px-3 py-2"
                  >
                    <label className="flex flex-1 min-w-[140px] cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => togglePreset(preset, e.target.checked)}
                        className="rounded border-surface-300"
                      />
                      <span className="font-medium text-ink">{preset.label}</span>
                      <span className="font-mono text-[10px] text-surface-400">{preset.key}</span>
                    </label>
                    {active && def && (
                      <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-surface-600">
                        <input
                          type="checkbox"
                          checked={def.required}
                          onChange={() => toggleRequired(preset.key)}
                          className="rounded border-surface-300"
                        />
                        Wajib
                      </label>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedDefs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedDefs.map((d) => (
                  <Badge key={d.key} variant="info" className="text-[9px]">
                    {d.label}
                    {d.required ? ' *' : ' (ops)'}
                  </Badge>
                ))}
              </div>
            )}

            {selectedDefs.length === 0 && (
              <p className="mt-2 text-[10px] text-amber-700">
                Belum ada field — user tidak bisa order sampai field dikonfigurasi.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" disabled={saving} onClick={handleSave}>
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}