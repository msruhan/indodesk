'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  emptyConsultationService,
  type ProfileConsultationService,
} from '@/lib/teknisi-profile-content'
import { ChevronDown, ChevronUp, Plus, Trash2 } from '@/lib/icons'

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

export function ConsultationServicesEditor({
  services,
  basePrice,
  onChange,
}: {
  services: ProfileConsultationService[]
  basePrice: number
  onChange: (services: ProfileConsultationService[]) => void
}) {
  const update = (idx: number, patch: Partial<ProfileConsultationService>) => {
    const next = [...services]
    next[idx] = { ...next[idx]!, ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {services.map((svc, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-surface-200/80 bg-surface-50/40 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary-700">
              Layanan {idx + 1}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={idx === 0}
                onClick={() => onChange(moveItem(services, idx, idx - 1))}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={idx === services.length - 1}
                onClick={() => onChange(moveItem(services, idx, idx + 1))}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-rose-600"
                onClick={() => onChange(services.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Nama</label>
              <Input
                value={svc.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Konsultasi Umum"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-surface-600">
                Deskripsi
              </label>
              <textarea
                value={svc.description}
                onChange={(e) => update(idx, { description: e.target.value })}
                rows={2}
                placeholder="Diagnosis perangkat, rekomendasi solusi..."
                className={cn(
                  'w-full resize-y rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink',
                  'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">Durasi</label>
              <Input
                value={svc.duration}
                onChange={(e) => update(idx, { duration: e.target.value })}
                placeholder="30 menit"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-surface-600">
                Harga (opsional)
              </label>
              <Input
                type="number"
                min={0}
                value={svc.price ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  update(idx, {
                    price: raw === '' ? null : Number(raw) || null,
                  })
                }}
                placeholder={String(basePrice)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-surface-600 md:col-span-2">
              <input
                type="checkbox"
                checked={svc.popular}
                onChange={(e) => update(idx, { popular: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
              />
              Tandai sebagai layanan populer
            </label>
            <label className="flex items-center gap-2 text-xs text-surface-600 md:col-span-2">
              <input
                type="checkbox"
                checked={svc.requiresRemote}
                onChange={(e) => update(idx, { requiresRemote: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
              />
              Membutuhkan akses remote (IndoDesk)
            </label>
          </div>
        </div>
      ))}
      {services.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...services, emptyConsultationService(basePrice)])}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah layanan
        </Button>
      )}
    </div>
  )
}
