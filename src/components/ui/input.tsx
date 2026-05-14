import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-surface-200/80 bg-white/90 px-4 py-2 text-sm text-ink',
          'shadow-soft-xs backdrop-blur-sm',
          'transition-[box-shadow,border-color,background-color] duration-300 ease-out-expo',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-surface-400',
          'hover:border-surface-300/90',
          'focus-visible:outline-none focus-visible:border-primary-400 focus-visible:bg-white focus-visible:shadow-ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
