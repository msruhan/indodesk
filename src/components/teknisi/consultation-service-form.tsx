'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ProfileConsultationService } from '@/lib/teknisi-profile-content'

type Props = {
  value: ProfileConsultationService
  basePrice: number
  onChange: (next: ProfileConsultationService) => void
  idPrefix?: string
}

export function ConsultationServiceForm({
  value,
  basePrice,
  onChange,
  idPrefix = 'svc',
}: Props) {
  const patch = (partial: Partial<ProfileConsultationService>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-sm font-medium text-surface-700">
          Nama layanan
        </label>
        <Input
          id={`${idPrefix}-name`}
          value={value.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Konsultasi Umum"
        />
      </div>
      <div className="md:col-span-2">
        <label
          htmlFor={`${idPrefix}-description`}
          className="mb-1 block text-sm font-medium text-surface-700"
        >
          Deskripsi
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={3}
          placeholder="Diagnosis perangkat, rekomendasi solusi..."
          className={cn(
            'w-full resize-y rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs',
            'placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-duration`} className="mb-1 block text-sm font-medium text-surface-700">
          Durasi
        </label>
        <Input
          id={`${idPrefix}-duration`}
          value={value.duration}
          onChange={(e) => patch({ duration: e.target.value })}
          placeholder="30 menit"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-price`} className="mb-1 block text-sm font-medium text-surface-700">
          Harga (opsional)
        </label>
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min={0}
          value={value.price ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            patch({ price: raw === '' ? null : Number(raw) || null })
          }}
          placeholder={String(basePrice)}
        />
        <p className="mt-1 text-[11px] text-surface-500">
          Kosongkan untuk memakai harga dasar (Rp {basePrice.toLocaleString('id-ID')}).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-surface-600 md:col-span-2">
        <input
          type="checkbox"
          checked={value.popular}
          onChange={(e) => patch({ popular: e.target.checked })}
          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
        />
        Tandai sebagai layanan populer
      </label>
      <label className="flex items-center gap-2 text-sm text-surface-600 md:col-span-2">
        <input
          type="checkbox"
          checked={value.requiresRemote}
          onChange={(e) => patch({ requiresRemote: e.target.checked })}
          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30"
        />
        Membutuhkan akses remote (IndoDesk)
      </label>
    </div>
  )
}
