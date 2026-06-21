'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckboxMultiDropdown } from '@/components/ui/checkbox-multi-dropdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from '@/lib/icons'
import {
  TEKNISI_SPECIALTY_OPTIONS,
  TEKNISI_SPECIALTY_OTHER,
  isPresetSpecialty,
  mergeTeknisiSpecialty,
  splitTeknisiSpecialty,
} from '@/lib/teknisi-registration'

type TeknisiSpecialtyFieldProps = {
  value: string[]
  onChange: (value: string[]) => void
  id?: string
}

export function TeknisiSpecialtyField({ value, onChange, id }: TeknisiSpecialtyFieldProps) {
  const [customInput, setCustomInput] = useState('')
  const { presets, custom } = splitTeknisiSpecialty(value)
  const [otherEnabled, setOtherEnabled] = useState(custom.length > 0)

  useEffect(() => {
    if (custom.length > 0) setOtherEnabled(true)
  }, [custom.length])

  const options = useMemo(
    () => [
      ...TEKNISI_SPECIALTY_OPTIONS.map((label) => ({ value: label, label })),
      { value: TEKNISI_SPECIALTY_OTHER, label: 'Lainnya' },
    ],
    [],
  )

  const dropdownValue = useMemo(() => {
    const selected = [...presets]
    if (otherEnabled) selected.push(TEKNISI_SPECIALTY_OTHER)
    return selected
  }, [presets, otherEnabled])

  const handleDropdownChange = (selected: string[]) => {
    const hasOther = selected.includes(TEKNISI_SPECIALTY_OTHER)
    setOtherEnabled(hasOther)
    const nextPresets = selected.filter((s) => s !== TEKNISI_SPECIALTY_OTHER && isPresetSpecialty(s))
    onChange(mergeTeknisiSpecialty(nextPresets, hasOther ? custom : []))
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (value.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInput('')
      return
    }
    if (value.length >= 15) return
    onChange(mergeTeknisiSpecialty(presets, [...custom, trimmed]))
    setCustomInput('')
  }

  const removeCustom = (item: string) => {
    onChange(mergeTeknisiSpecialty(presets, custom.filter((c) => c !== item)))
  }

  return (
    <div className="space-y-2">
      <CheckboxMultiDropdown
        id={id}
        value={dropdownValue}
        onChange={handleDropdownChange}
        options={options}
        placeholder="Pilih spesialisasi…"
      />
      {otherEnabled && (
        <div className="space-y-2 rounded-xl border border-surface-200 bg-surface-50/50 p-3">
          <p className="text-[11px] font-medium text-surface-600">
            Spesialisasi lain — ketik lalu tambahkan
          </p>
          <div className="flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
              placeholder="Contoh: Backlight, Flex Charger, Reflow"
              maxLength={80}
            />
            <Button type="button" variant="outline" size="sm" onClick={addCustom} disabled={!customInput.trim()}>
              Tambah
            </Button>
          </div>
          {custom.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {custom.map((item) => (
                <li key={item}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-surface-700 ring-1 ring-inset ring-surface-200">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeCustom(item)}
                      className="rounded-full p-0.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                      aria-label={`Hapus ${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-[11px] text-surface-500">Pilih satu atau lebih. Centang Lainnya untuk mengetik spesialisasi custom.</p>
    </div>
  )
}
