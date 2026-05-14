import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-surface-700',
        primary:
          'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/70',
        secondary: 'bg-ink text-white shadow-soft-xs',
        success: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/70',
        warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
        danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70',
        info: 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200/70',
        outline:
          'border border-surface-200 bg-white/70 text-surface-700 backdrop-blur-sm',
        glass:
          'glass-strong text-surface-700',
        gradient:
          'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 ring-1 ring-inset ring-primary-200/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
