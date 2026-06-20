'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ShippingLocationOption } from '@/lib/shipping-locations'

type LocationSearchSelectProps = {
  label: string
  placeholder: string
  value: ShippingLocationOption | null
  onChange: (value: ShippingLocationOption | null) => void
  searchType: 'province' | 'city' | 'district' | 'village'
  parentId?: string | null
  disabled?: boolean
  required?: boolean
  error?: string | null
  prefetch?: boolean
}

export function LocationSearchSelect({
  label,
  placeholder,
  value,
  onChange,
  searchType,
  parentId,
  disabled = false,
  required = false,
  error,
  prefetch = false,
}: LocationSearchSelectProps) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ShippingLocationOption[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value?.label ?? '')
  }, [value?.id, value?.label])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    setOptions([])
    setLoaded(false)
    setFetchError(null)
    if (!value?.id) setQuery('')
  }, [searchType, parentId, value?.id])

  useEffect(() => {
    if (disabled) return
    if (!open && !prefetch) return
    if (loaded) return
    if (searchType !== 'province' && !parentId) return

    void (async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams({
          type: searchType,
          ...(parentId ? { parentId } : {}),
        })
        const res = await fetch(`/api/shipping/locations?${params}`)
        const json = await res.json()
        if (!json.success) {
          setFetchError(json.error ?? 'Gagal memuat lokasi')
          setOptions([])
          return
        }
        setOptions(Array.isArray(json.data?.locations) ? json.data.locations : [])
        setLoaded(true)
      } catch {
        setFetchError('Gagal memuat lokasi')
        setOptions([])
      } finally {
        setLoading(false)
      }
    })()
  }, [disabled, loaded, open, parentId, prefetch, searchType])

  const pick = (loc: ShippingLocationOption) => {
    onChange(loc)
    setQuery(loc.label)
    setOpen(false)
  }

  const filteredOptions = query.trim()
    ? options.filter((loc) => loc.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div ref={rootRef} className="space-y-1">
      <label className="mb-1 block text-sm font-medium text-surface-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      <div className="relative">
        <Input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (value && e.target.value !== value.label) onChange(null)
          }}
          className={cn(error && 'border-rose-300 focus-visible:border-rose-400')}
        />
        {open && !disabled && (
          <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-surface-200 bg-white shadow-soft-md">
            {loading && (
              <p className="px-3 py-2 text-sm text-surface-500">Memuat…</p>
            )}
            {!loading && fetchError && (
              <p className="px-3 py-2 text-sm text-rose-600">{fetchError}</p>
            )}
            {!loading && !fetchError && filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-surface-500">
                {options.length === 0 ? 'Belum ada data' : 'Tidak ditemukan'}
              </p>
            )}
            {filteredOptions.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(loc)
                }}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm text-ink hover:bg-primary-50',
                  value?.id === loc.id && 'bg-primary-50/80',
                )}
              >
                {loc.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}
