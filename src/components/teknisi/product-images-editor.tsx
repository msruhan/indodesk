'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { MAX_PRODUCT_IMAGES } from '@/lib/product-images'
import { Plus, Star, Trash2 } from '@/lib/icons'

export type ProductImageSlot = {
  key: string
  url?: string
  preview?: string
  file?: File
  isPrimary: boolean
}

type ProductImagesEditorProps = {
  slots: ProductImageSlot[]
  onChange: (slots: ProductImageSlot[]) => void
}

export function ProductImagesEditor({ slots, onChange }: ProductImagesEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const setPrimary = (key: string) => {
    onChange(slots.map((s) => ({ ...s, isPrimary: s.key === key })))
  }

  const removeSlot = (key: string) => {
    const next = slots.filter((s) => s.key !== key)
    if (next.length > 0 && !next.some((s) => s.isPrimary)) {
      next[0] = { ...next[0]!, isPrimary: true }
    }
    onChange(next)
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_PRODUCT_IMAGES - slots.length
    if (room <= 0) return

    const incoming = Array.from(files).slice(0, room)
    const next = [...slots]
    let madePrimary = next.some((s) => s.isPrimary)

    for (const file of incoming) {
      const key = `new-${Date.now()}-${Math.random().toString(36).slice(2)}`
      next.push({
        key,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: !madePrimary && next.length === 0,
      })
      if (!madePrimary && next[next.length - 1]?.isPrimary) madePrimary = true
    }

    if (!next.some((s) => s.isPrimary) && next.length > 0) {
      next[0] = { ...next[0]!, isPrimary: true }
    }
    onChange(next)
  }

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-surface-700">Foto Produk</label>
        <span className="text-[11px] text-surface-500">
          {slots.length}/{MAX_PRODUCT_IMAGES} foto · pilih foto utama
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((slot) => {
          const src = slot.preview ?? slot.url
          return (
            <div
              key={slot.key}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border bg-surface-50',
                slot.isPrimary ? 'border-primary-500 ring-2 ring-primary-200' : 'border-surface-200',
              )}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-surface-400">—</div>
              )}

              {slot.isPrimary && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Utama
                </span>
              )}

              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                <button
                  type="button"
                  title="Jadikan foto utama"
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm',
                    slot.isPrimary ? 'text-amber-500' : 'text-surface-500 hover:text-amber-500',
                  )}
                  onClick={() => setPrimary(slot.key)}
                >
                  <Star className={cn('h-3.5 w-3.5', slot.isPrimary && 'fill-current')} />
                </button>
                <button
                  type="button"
                  title="Hapus foto"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm hover:bg-rose-50"
                  onClick={() => removeSlot(slot.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}

        {slots.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-surface-300 bg-surface-50/80 text-surface-500 transition-colors hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Tambah foto</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <p className="mt-2 text-[11px] text-surface-500">
        Maks. {MAX_PRODUCT_IMAGES} foto (JPEG, PNG, WebP, GIF · 5 MB per file). Klik bintang untuk foto utama.
      </p>
    </div>
  )
}

export function slotsFromProduct(images: { url: string; isPrimary?: boolean }[]): ProductImageSlot[] {
  if (images.length === 0) return []
  const hasPrimary = images.some((i) => i.isPrimary)
  return images.map((img, idx) => ({
    key: `existing-${idx}-${img.url}`,
    url: img.url,
    isPrimary: img.isPrimary ?? (!hasPrimary && idx === 0),
  }))
}

export function buildProductImagesFormData(
  slots: ProductImageSlot[],
  fd: FormData,
): void {
  const order: Array<{ kind: 'url'; url: string } | { kind: 'file' }> = []

  for (const slot of slots) {
    if (slot.file) {
      fd.append('images', slot.file)
      order.push({ kind: 'file' })
    } else if (slot.url) {
      order.push({ kind: 'url', url: slot.url })
    }
  }

  const primaryIndex = slots.findIndex((s) => s.isPrimary)
  fd.append('imageOrder', JSON.stringify(order))
  fd.append('primaryIndex', String(primaryIndex >= 0 ? primaryIndex : 0))
}
