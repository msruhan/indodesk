'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw } from '@/lib/icons'
import { generatePassword } from '@/lib/generate-password'

type AdminPasswordFieldProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  label?: string
  hint?: string
}

export function AdminPasswordField({
  value,
  onChange,
  required,
  label = 'Password',
  hint,
}: AdminPasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-surface-700">{label}</label>
      <div className="flex gap-2">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={required ? 'Min. 8 karakter' : 'Kosongkan jika tidak diubah'}
          required={required}
          className="flex-1"
          autoComplete="new-password"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 shrink-0 px-3"
          onClick={() => onChange(generatePassword())}
          title="Generate password acak"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Generate</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 shrink-0 px-2 text-xs"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? 'Sembunyi' : 'Lihat'}
        </Button>
      </div>
      {hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>}
    </div>
  )
}
