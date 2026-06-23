'use client'

import { useMemo } from 'react'
import { splitProfileTextParagraphs } from '@/lib/format-profile-text'
import { cn } from '@/lib/utils'

type ProfileDescriptionTextProps = {
  text: string
  className?: string
  paragraphClassName?: string
}

export function ProfileDescriptionText({
  text,
  className,
  paragraphClassName,
}: ProfileDescriptionTextProps) {
  const paragraphs = useMemo(() => splitProfileTextParagraphs(text), [text])

  if (paragraphs.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className={cn(
            'text-pretty text-sm leading-[1.75] text-surface-600',
            index === 0 && 'text-[15px] leading-[1.8] text-surface-700',
            paragraphClassName,
          )}
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}
