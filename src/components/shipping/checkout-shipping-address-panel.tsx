'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShippingAddressForm } from '@/components/shipping/shipping-address-form'
import { cn } from '@/lib/utils'
import {
  EMPTY_STRUCTURED_SHIPPING_ADDRESS,
  formatStructuredShippingAddress,
  validateStructuredShippingAddress,
  type StructuredShippingAddress,
} from '@/lib/shipping-address'
import {
  hasCompleteSavedShippingAddress,
  profileToShippingAddress,
  shippingAddressToProfilePayload,
} from '@/lib/user-shipping-profile'
import { CheckCircle, MapPin, Plus } from '@/lib/icons'

type AddressMode = 'saved' | 'new'

type CheckoutShippingAddressPanelProps = {
  value: StructuredShippingAddress
  onChange: (value: StructuredShippingAddress) => void
  isAuthenticated: boolean
  onErrorClear?: () => void
}

export function CheckoutShippingAddressPanel({
  value,
  onChange,
  isAuthenticated,
  onErrorClear,
}: CheckoutShippingAddressPanelProps) {
  const [savedAddress, setSavedAddress] = useState<StructuredShippingAddress | null>(null)
  const [mode, setMode] = useState<AddressMode>('new')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const initialized = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoaded(true)
      return
    }

    let active = true
    void (async () => {
      try {
        const res = await fetch('/api/user/profile')
        const json = await res.json()
        if (!active || !res.ok || !json.success) return

        const addr = profileToShippingAddress(json.data)
        if (hasCompleteSavedShippingAddress(addr)) {
          setSavedAddress(addr)
          if (!initialized.current) {
            initialized.current = true
            setMode('saved')
            onChangeRef.current(addr)
          }
        } else {
          initialized.current = true
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setProfileLoaded(true)
      }
    })()

    return () => {
      active = false
    }
  }, [isAuthenticated])

  const switchToNew = () => {
    setMode('new')
    onChange(EMPTY_STRUCTURED_SHIPPING_ADDRESS)
    onErrorClear?.()
    setSaveMsg(null)
  }

  const switchToSaved = () => {
    if (!savedAddress) return
    setMode('saved')
    onChange(savedAddress)
    onErrorClear?.()
    setSaveMsg(null)
  }

  const handleSave = async () => {
    const validationError = validateStructuredShippingAddress(value)
    if (validationError) return

    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingAddressToProfilePayload(value)),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSaveMsg({ type: 'error', text: json.error ?? 'Gagal menyimpan alamat' })
        return
      }

      const addr = profileToShippingAddress(json.data)
      setSavedAddress(addr)
      setMode('saved')
      setSaveMsg({ type: 'success', text: 'Alamat berhasil disimpan' })
    } catch {
      setSaveMsg({ type: 'error', text: 'Gagal menyimpan alamat' })
    } finally {
      setSaving(false)
    }
  }

  const formValid = validateStructuredShippingAddress(value) === null
  const showSaveButton = mode === 'new' && isAuthenticated && formValid
  const savedSummary = savedAddress ? formatStructuredShippingAddress(savedAddress) : ''

  if (!profileLoaded && isAuthenticated) {
    return <p className="text-xs text-surface-500">Memuat alamat tersimpan…</p>
  }

  return (
    <div className="space-y-3">
      {savedAddress && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={switchToSaved}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors',
              mode === 'saved'
                ? 'border-primary-300 bg-primary-50 text-primary-800'
                : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300',
            )}
          >
            Alamat tersimpan
          </button>
          <button
            type="button"
            onClick={switchToNew}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors',
              mode === 'new'
                ? 'border-primary-300 bg-primary-50 text-primary-800'
                : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300',
            )}
          >
            Alamat baru
          </button>
        </div>
      )}

      {mode === 'saved' && savedAddress ? (
        <div className="rounded-xl border border-surface-200 bg-surface-50/80 p-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">{savedSummary}</p>
              <p className="mt-1 text-[11px] text-surface-500">{savedAddress.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={switchToNew}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 hover:text-primary-800"
          >
            <Plus className="h-3 w-3" />
            Gunakan alamat lain
          </button>
        </div>
      ) : (
        <>
          <ShippingAddressForm
            value={value}
            onChange={(next) => {
              onChange(next)
              onErrorClear?.()
              if (saveMsg) setSaveMsg(null)
            }}
          />

          {showSaveButton && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Menyimpan…' : 'Simpan alamat untuk berikutnya'}
              </Button>
              <p className="text-center text-[11px] text-surface-500">
                Alamat tersimpan bisa dipilih lagi saat checkout berikutnya.
              </p>
            </div>
          )}
        </>
      )}

      {saveMsg && (
        <p
          className={cn(
            'flex items-center gap-1 text-[11px]',
            saveMsg.type === 'success' ? 'text-primary-700' : 'text-rose-600',
          )}
        >
          {saveMsg.type === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
          {saveMsg.text}
        </p>
      )}
    </div>
  )
}
