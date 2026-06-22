'use client'

import { useState } from 'react'
import { Smile } from '@/lib/icons'
import { cn } from '@/lib/utils'

export const QUICK_EMOJIS = [
  '😀', '😂', '😊', '🙏', '👍', '❤️', '🔥', '✅',
  '📱', '💬', '🎉', '👋', '💡', '🔧', '⚡', '🙌',
  '😅', '🤝', '👏', '✨', '💯', '🚀', '📸', '🛠️',
] as const

type EmojiPickerButtonProps = {
  onPick: (emoji: string) => void
  disabled?: boolean
  className?: string
  pickerClassName?: string
  label?: string
}

export function EmojiPickerButton({
  onPick,
  disabled,
  className,
  pickerClassName,
  label = 'Emoji',
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false)

  const handlePick = (emoji: string) => {
    onPick(emoji)
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      {open ? (
        <div
          className={cn(
            'absolute bottom-full left-0 z-20 mb-2 grid w-[min(18rem,calc(100vw-2.5rem))] grid-cols-8 gap-0.5 rounded-2xl border border-surface-200 bg-white p-2 shadow-soft-lg',
            pickerClassName,
          )}
          role="listbox"
          aria-label="Pilih emoji"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-surface-50"
              onClick={() => handlePick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
          open
            ? 'border-primary-200 bg-primary-50 text-primary-700'
            : 'border-surface-200 text-surface-600 hover:border-primary-200 hover:text-primary-700',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        aria-label={label}
        aria-expanded={open}
      >
        <Smile className="h-4 w-4" />
        Emoji
      </button>
    </div>
  )
}

export function insertAtTextCursor(
  value: string,
  emoji: string,
  element: HTMLTextAreaElement | HTMLInputElement | null,
  maxLength?: number,
): { nextValue: string; cursor: number } | null {
  const start = element?.selectionStart ?? value.length
  const end = element?.selectionEnd ?? value.length
  const nextValue = value.slice(0, start) + emoji + value.slice(end)

  if (maxLength !== undefined && nextValue.length > maxLength) return null

  return { nextValue, cursor: start + emoji.length }
}

export function focusTextCursor(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  cursor: number,
) {
  if (!element) return
  requestAnimationFrame(() => {
    element.focus()
    element.setSelectionRange(cursor, cursor)
  })
}
