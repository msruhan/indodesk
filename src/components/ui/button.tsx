'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Premium button — Linear/Stripe inspired.
 * - Soft layered shadow ("shadow-soft-*") instead of flat box-shadow
 * - Gradient sheen on primary/gradient via ::before, GPU-only transforms
 * - Crisp focus ring, full reduced-motion support
 */
const buttonVariants = cva(
  [
    'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'rounded-full font-semibold tracking-tight overflow-hidden isolate',
    'transition-[transform,box-shadow,background-color,color] duration-300 ease-out-expo',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-ink text-white shadow-soft-md hover:shadow-soft-lg hover:-translate-y-[1px] hover:bg-ink-soft',
        primary: [
          'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white',
          'shadow-glow-primary hover:shadow-glow-primary-lg hover:-translate-y-[1px]',
          // soft top sheen
          'before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-t-full',
          'before:bg-gradient-to-b before:from-white/30 before:to-transparent before:opacity-70',
          'before:transition-opacity hover:before:opacity-90',
        ].join(' '),
        secondary:
          'bg-surface-100 text-ink hover:bg-surface-200/80 shadow-soft-xs hover:shadow-soft-sm',
        outline:
          'border border-surface-200 bg-white/80 text-ink backdrop-blur-md hover:border-surface-300 hover:bg-white shadow-soft-xs hover:shadow-soft-sm hover:-translate-y-[1px]',
        ghost:
          'text-ink hover:bg-surface-100/80',
        link:
          'text-primary-700 hover:text-primary-800 underline-offset-4 hover:underline rounded-md',
        gradient: [
          'text-white',
          'bg-[linear-gradient(120deg,#059669_0%,#10b981_45%,#06b6d4_100%)] bg-[length:200%_100%]',
          'shadow-glow-primary hover:shadow-glow-primary-lg hover:-translate-y-[1px]',
          'hover:bg-[position:100%_50%] transition-[background-position,box-shadow,transform] duration-700',
        ].join(' '),
        glass:
          'glass-strong text-ink hover:bg-white/95 shadow-soft-md hover:shadow-soft-lg hover:-translate-y-[1px]',
        destructive:
          'bg-red-600 text-white shadow-soft-md hover:bg-red-700 hover:-translate-y-[1px]',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-sm',
        xl: 'h-14 px-9 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-9 w-9 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
