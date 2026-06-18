'use client'

import type { ConditionGrade, ProductCategory } from '@prisma/client'
import { CheckboxMultiDropdown } from '@/components/ui/checkbox-multi-dropdown'
import { Input } from '@/components/ui/input'
import {
  categorySupportsBenchmark,
  categorySupportsThreeUtools,
} from '@/lib/product-category-config'
import { REPLACED_PART_OPTIONS } from '@/lib/replaced-parts'
import { cn } from '@/lib/utils'

export const CONDITION_GRADE_OPTIONS: { value: ConditionGrade; label: string }[] = [
  { value: 'BNIB', label: 'Brand New (Segel)' },
  { value: 'LIKE_NEW', label: 'Like New (99%)' },
  { value: 'MULUS', label: 'Mulus (95%+)' },
  { value: 'NORMAL', label: 'Normal (tanda pakai wajar)' },
  { value: 'MINUS', label: 'Ada Minus (lecet/dent)' },
]

export type BenchmarkFormState = {
  conditionGrade: ConditionGrade | null
  conditionPercent: string
  minusNotes: string
  batteryHealth: string
  batteryCycle: string
  isAllOriginal: boolean | null
  replacedParts: string[]
  trueToneActive: boolean | null
  faceIdWorks: boolean | null
}

export const emptyBenchmarkForm: BenchmarkFormState = {
  conditionGrade: null,
  conditionPercent: '',
  minusNotes: '',
  batteryHealth: '',
  batteryCycle: '',
  isAllOriginal: null,
  replacedParts: [],
  trueToneActive: null,
  faceIdWorks: null,
}

function TriToggle({
  label,
  value,
  onChange,
  yesLabel = 'Ya',
  noLabel = 'Tidak',
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-surface-700">{label}</label>
      <div className="flex gap-1.5">
        {[
          { v: true, l: yesLabel },
          { v: false, l: noLabel },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(value === opt.v ? null : opt.v)}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              value === opt.v
                ? opt.v
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300',
            )}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProductBenchmarkFields({
  category,
  value,
  onChange,
}: {
  category: ProductCategory
  value: BenchmarkFormState
  onChange: (next: BenchmarkFormState) => void
}) {
  if (!categorySupportsBenchmark(category)) return null

  const showThreeUtools = categorySupportsThreeUtools(category)
  const showAndroidBattery =
    category === 'ANDROID' || category === 'IPAD'

  return (
    <div className="md:col-span-2 space-y-5 rounded-2xl border border-surface-200/70 bg-surface-50/40 p-4">
      <div>
        <h4 className="text-sm font-bold text-ink">Data untuk Benchmark</h4>
        <p className="mt-0.5 text-[11px] text-surface-500">
          Isi data ini agar produk bisa dibandingkan secara objektif oleh pembeli.
        </p>
      </div>

      {showThreeUtools && (
        <p className="rounded-lg border border-primary-200/60 bg-primary-50/50 px-3 py-2 text-[11px] text-primary-700">
          Device Apple — isi data 3uTools di bawah dan upload screenshot untuk skor benchmark
          hardware yang lebih akurat.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Grade Kondisi</label>
          <select
            value={value.conditionGrade ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                conditionGrade: (e.target.value || null) as ConditionGrade | null,
              })
            }
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink shadow-soft-xs focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/50"
          >
            <option value="">— Pilih grade —</option>
            {CONDITION_GRADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Kondisi Fisik (%)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={value.conditionPercent}
            onChange={(e) => onChange({ ...value, conditionPercent: e.target.value })}
            placeholder="Contoh: 95"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">
          Catatan Minus <span className="text-surface-400">(opsional)</span>
        </label>
        <Input
          value={value.minusNotes}
          onChange={(e) => onChange({ ...value, minusNotes: e.target.value })}
          placeholder="Contoh: lecet halus di sudut kiri bawah"
        />
      </div>

      {showThreeUtools && (
        <div className="space-y-3 rounded-xl border border-primary-200/60 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-700">
            Data 3uTools (Hardware)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Battery Health (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={value.batteryHealth}
                onChange={(e) => onChange({ ...value, batteryHealth: e.target.value })}
                placeholder="Contoh: 89"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Cycle Count
              </label>
              <Input
                type="number"
                min={0}
                value={value.batteryCycle}
                onChange={(e) => onChange({ ...value, batteryCycle: e.target.value })}
                placeholder="Contoh: 320"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TriToggle
              label="Semua Part Original?"
              value={value.isAllOriginal}
              onChange={(v) =>
                onChange({
                  ...value,
                  isAllOriginal: v,
                  replacedParts: v === true ? [] : value.replacedParts,
                })
              }
            />
            <TriToggle
              label="True Tone Aktif?"
              value={value.trueToneActive}
              onChange={(v) => onChange({ ...value, trueToneActive: v })}
              yesLabel="Aktif"
              noLabel="Tidak"
            />
          </div>
          <TriToggle
            label="Face ID / Touch ID Normal?"
            value={value.faceIdWorks}
            onChange={(v) => onChange({ ...value, faceIdWorks: v })}
            yesLabel="Normal"
            noLabel="Bermasalah"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Part yang Diganti
            </label>
            <CheckboxMultiDropdown
              value={value.replacedParts}
              onChange={(parts) => onChange({ ...value, replacedParts: parts })}
              options={REPLACED_PART_OPTIONS}
              placeholder="Pilih part yang diganti…"
              disabled={value.isAllOriginal === true}
            />
          </div>
          <p className="text-[11px] text-surface-500">
            Upload screenshot 3uTools di bagian foto untuk verifikasi.
          </p>
        </div>
      )}

      {showAndroidBattery && !showThreeUtools && (
        <div className="space-y-3 rounded-xl border border-surface-200/70 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-surface-600">
            Data Baterai
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Kesehatan Baterai (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={value.batteryHealth}
                onChange={(e) => onChange({ ...value, batteryHealth: e.target.value })}
                placeholder="Contoh: 85"
              />
            </div>
            {category === 'ANDROID' && (
              <TriToggle
                label="Semua Part Original?"
                value={value.isAllOriginal}
                onChange={(v) =>
                  onChange({
                    ...value,
                    isAllOriginal: v,
                    replacedParts: v === true ? [] : value.replacedParts,
                  })
                }
              />
            )}
          </div>
          {category === 'ANDROID' && value.isAllOriginal !== true && (
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">
                Part yang Diganti
              </label>
              <CheckboxMultiDropdown
                value={value.replacedParts}
                onChange={(parts) => onChange({ ...value, replacedParts: parts })}
                options={REPLACED_PART_OPTIONS}
                placeholder="Pilih part yang diganti…"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
