'use client'

import { Input } from '@/components/ui/input'
import { inputTypeForField, type ServerFieldDef } from '@/lib/server-fields'

export function ServerOrderFieldInput({
  field,
  value,
  onChange,
}: {
  field: ServerFieldDef
  value: string
  onChange: (value: string) => void
}) {
  const commonLabel = (
    <label className="mb-1 block text-xs font-medium text-ink">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  )

  if (field.type === 'textarea') {
    return (
      <div>
        {commonLabel}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-surface-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          rows={3}
        />
      </div>
    )
  }

  return (
    <div>
      {commonLabel}
      <Input
        type={inputTypeForField(field)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 text-sm"
        autoComplete={field.type === 'password' ? 'off' : undefined}
      />
    </div>
  )
}
