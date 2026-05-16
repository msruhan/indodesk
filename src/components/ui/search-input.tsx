import { forwardRef } from 'react'
import { Search } from '@/lib/icons'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Magnifying glass — dark, always above the input background */
export const searchInputIconClass =
  'pointer-events-none absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-muted'

type SearchInputProps = InputProps & {
  /** Tailwind `left-*` offset for the icon (default `left-3`) */
  iconLeftClass?: string
  /** Extra classes on the `<input>` element */
  inputClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, iconLeftClass = 'left-3', inputClassName, ...props }, ref) => (
    <div className={cn('relative min-w-0', className)}>
      <Search className={cn(searchInputIconClass, iconLeftClass)} strokeWidth={2} aria-hidden />
      <Input ref={ref} className={cn('h-10 w-full pl-9', inputClassName)} {...props} />
    </div>
  ),
)
SearchInput.displayName = 'SearchInput'
