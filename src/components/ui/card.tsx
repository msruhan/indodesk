import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Premium card system — soft layered shadows + glass variants.
 * Default surface stays bright and breathable; opt into `glass`, `flat`, `glow`.
 */
const cardVariants = cva(
  'rounded-2xl bg-white text-ink transition-shadow duration-450 ease-out-expo',
  {
    variants: {
      tone: {
        default:
          'border border-surface-200/70 shadow-soft-sm hover:shadow-soft-md',
        flat:
          'border border-surface-200/70 shadow-none',
        elevated:
          'border border-surface-200/60 shadow-soft-md',
        glass: 'glass-strong shadow-soft-md',
        glow:
          'border border-primary-200/60 shadow-glow-primary',
        ghost:
          'border-0 bg-transparent shadow-none',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ tone }), className)} {...props} />
  ),
)
Card.displayName = 'Card'

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight-lg text-ink',
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-surface-500', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
