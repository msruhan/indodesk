'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Check } from '@/lib/icons'

export interface ImeiServiceEditTarget {
  id: string
  title: string
  description: string | null
  price: string | number
  deliveryTime: string | null
  status: 'ACTIVE' | 'INACTIVE'
  toolId: string | null
  group: { id: string; title: string }
  api: { id: string; title: string }
  requiresImei: boolean
  requiresNetwork: boolean
  requiresModel: boolean
  requiresProvider: boolean
  requiresPin: boolean
  requiresKbh: boolean
  requiresMep: boolean
  requiresPrd: boolean
  requiresSn: boolean
}

interface Props {
  service: ImeiServiceEditTarget
  groups: { id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}

const FIELD_FLAGS: {
  key: keyof Pick<
    ImeiServiceEditTarget,
    | 'requiresImei'
    | 'requiresNetwork'
    | 'requiresModel'
    | 'requiresProvider'
    | 'requiresPin'
    | 'requiresKbh'
    | 'requiresMep'
    | 'requiresPrd'
    | 'requiresSn'
  >
  label: string
}[] = [
  { key: 'requiresImei', label: 'Digital' },
  { key: 'requiresNetwork', label: 'Network' },
  { key: 'requiresModel', label: 'Model' },
  { key: 'requiresProvider', label: 'Provider' },
  { key: 'requiresPin', label: 'PIN' },
  { key: 'requiresKbh', label: 'KBH' },
  { key: 'requiresMep', label: 'MEP' },
  { key: 'requiresPrd', label: 'PRD' },
  { key: 'requiresSn', label: 'Serial Number' },
]

export function AdminImeiServiceEditModal({ service, groups, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(service.title)
  const [toolId, setToolId] = useState(service.toolId ?? '')
  const [price, setPrice] = useState(String(Number(service.price) || 0))
  const [deliveryTime, setDeliveryTime] = useState(service.deliveryTime ?? '')
  const [status, setStatus] = useState(service.status)
  const [groupId, setGroupId] = useState(service.group.id)
  const [description, setDescription] = useState(service.description ?? '')
  const [flags, setFlags] = useState(() =>
    FIELD_FLAGS.reduce(
      (acc, { key }) => {
        acc[key] = service[key]
        return acc
      },
      {} as Record<(typeof FIELD_FLAGS)[number]['key'], boolean>,
    ),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(service.title)
    setToolId(service.toolId ?? '')
    setPrice(String(Number(service.price) || 0))
    setDeliveryTime(service.deliveryTime ?? '')
    setStatus(service.status)
    setGroupId(service.group.id)
    setDescription(service.description ?? '')
    setFlags(
      FIELD_FLAGS.reduce(
        (acc, { key }) => {
          acc[key] = service[key]
          return acc
        },
        {} as Record<(typeof FIELD_FLAGS)[number]['key'], boolean>,
      ),
    )
  }, [service])

  const handleSave = async () => {
    const priceNum = Number(price)
    if (!title.trim()) {
      setError('Nama layanan wajib diisi')
      return
    }
    if (!toolId.trim()) {
      setError('Tool ID supplier wajib diisi (SERVICEID dari panel Luteam/Dhru)')
      return
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Harga tidak valid')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/imei/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          toolId: toolId.trim(),
          price: priceNum,
          deliveryTime: deliveryTime.trim() || null,
          status,
          groupId,
          description: description.trim() || null,
          ...flags,
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
            <h3 className="text-lg font-semibold text-ink">Edit Digital Service</h3>
            <p className="mt-0.5 text-xs text-surface-500">
              API: {service.api.title} · Group: {service.group.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
              Tool ID supplier (SERVICEID) *
            </label>
            <Input
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              placeholder="Contoh: 2847"
              className="h-10 font-mono text-sm"
            />
            <p className="mt-1 text-[10px] text-surface-500">
              ID numerik dari panel supplier — dipakai saat place order ke Dhru/Luteam.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
              Nama layanan *
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 text-sm" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
                Harga (IDR) *
              </label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
                Estimasi
              </label>
              <Input
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="Instant / 1-24 jam"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
                Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="h-10 w-full rounded-lg border border-surface-200/80 bg-white px-3 text-sm text-surface-800"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="h-10 w-full rounded-lg border border-surface-200/80 bg-white px-3 text-sm text-surface-800"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-surface-500">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-surface-200/80 px-3 py-2 text-sm text-surface-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-surface-500">
              Field wajib saat order
            </p>
            <div className="flex flex-wrap gap-2">
              {FIELD_FLAGS.map(({ key, label }) => (
                <label
                  key={key}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-200/80 px-2.5 py-1.5 text-xs text-surface-700 hover:bg-surface-50"
                >
                  <input
                    type="checkbox"
                    checked={flags[key]}
                    onChange={(e) => setFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-surface-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={saving}>
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
