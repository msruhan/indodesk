'use client'

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Plus } from '@/lib/icons'

export const filterSelectClass =
  'h-10 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm sm:w-auto sm:min-w-[9.5rem] sm:max-w-none sm:shrink-0'

export function ManagementToolbar({
  addLabel,
  onAddClick,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  extra,
}: {
  addLabel: string
  onAddClick: () => void
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  extra?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
          <Button
            onClick={onAddClick}
            className="h-10 w-full shrink-0 justify-center gap-1.5 px-3 sm:w-auto sm:justify-start sm:px-4"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap text-xs sm:text-sm">{addLabel}</span>
          </Button>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-2">
            {extra}
            <SearchInput
              className="min-w-0 w-full flex-1"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
