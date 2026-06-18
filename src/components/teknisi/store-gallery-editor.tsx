'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { MAX_STORE_GALLERY_IMAGES } from '@/lib/store-gallery'
import { ChevronDown, ChevronUp, Plus, Trash2 } from '@/lib/icons'

export type StoreGallerySlot = {
  key: string
  url?: string
  preview?: string
  file?: File
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

type StoreGalleryEditorProps = {
  slots: StoreGallerySlot[]
  onChange: (slots: StoreGallerySlot[]) => void
}

export function StoreGalleryEditor({ slots, onChange }: StoreGalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const removeSlot = (key: string) => {
    onChange(slots.filter((s) => s.key !== key))
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_STORE_GALLERY_IMAGES - slots.length
    if (room <= 0) return

    const incoming = Array.from(files).slice(0, room)
    const next = [...slots]

    for (const file of incoming) {
      const key = `new-${Date.now()}-${Math.random().toString(36).slice(2)}`
      next.push({
        key,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    onChange(next)
  }

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-surface-700">Galeri foto</p>
          <p className="mt-0.5 text-[11px] text-surface-500">
            Foto suasana toko, workshop, dan tim — ditampilkan di bagian &quot;Suasana &amp; Workshop&quot; halaman
            publik.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-surface-500">
          {slots.length}/{MAX_STORE_GALLERY_IMAGES}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        {slots.map((slot, idx) => {
          const src = slot.preview ?? slot.url ?? ''
          return (
            <div
              key={slot.key}
              className="relative w-28 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-50"
            >
              <div className="aspect-[4/3] w-full">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] text-surface-400">—</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-0.5 border-t border-surface-100 bg-white/95 p-1">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    title="Geser ke kiri"
                    className="grid h-6 w-6 place-items-center rounded-md text-surface-500 hover:bg-surface-100 disabled:opacity-30"
                    disabled={idx === 0}
                    onClick={() => onChange(moveItem(slots, idx, idx - 1))}
                  >
                    <ChevronUp className="h-3 w-3 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    title="Geser ke kanan"
                    className="grid h-6 w-6 place-items-center rounded-md text-surface-500 hover:bg-surface-100 disabled:opacity-30"
                    disabled={idx === slots.length - 1}
                    onClick={() => onChange(moveItem(slots, idx, idx + 1))}
                  >
                    <ChevronDown className="h-3 w-3 -rotate-90" />
                  </button>
                </div>
                <button
                  type="button"
                  title="Hapus foto"
                  className="grid h-6 w-6 place-items-center rounded-md text-rose-600 hover:bg-rose-50"
                  onClick={() => removeSlot(slot.key)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}

        {slots.length < MAX_STORE_GALLERY_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-surface-300',
              'bg-surface-50/80 text-surface-500 transition-colors hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700',
              'aspect-[4/3]',
            )}
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
        Maks. {MAX_STORE_GALLERY_IMAGES} foto (JPEG, PNG, WebP, GIF · 5 MB per file). Urutan foto mengikuti tampilan di
        halaman publik.
      </p>
    </div>
  )
}

export function slotsFromGallery(urls: string[]): StoreGallerySlot[] {
  return urls.map((url, idx) => ({
    key: `existing-${idx}-${url}`,
    url,
  }))
}

export function buildStoreGalleryFormData(slots: StoreGallerySlot[], fd: FormData): void {
  const order: Array<{ kind: 'url'; url: string } | { kind: 'file' }> = []

  for (const slot of slots) {
    if (slot.file) {
      fd.append('gallery', slot.file)
      order.push({ kind: 'file' })
    } else if (slot.url) {
      order.push({ kind: 'url', url: slot.url })
    }
  }

  fd.append('galleryOrder', JSON.stringify(order))
}
