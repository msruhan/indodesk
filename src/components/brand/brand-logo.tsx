import { cn } from '@/lib/utils'

export const BRAND_ICON_SRC = '/icon/icon-bandoo.png'
export const BRAND_WORDMARK_SRC = '/icon/icon-text-bandoo.png'

type BrandLogoProps = {
  /** `icon` = ikon saja; `wordmark` = logo + teks lengkap */
  variant: 'icon' | 'wordmark'
  /** `compact` = sidebar dashboard; `default` = landing, auth, footer */
  size?: 'default' | 'compact'
  className?: string
  iconClassName?: string
  wordmarkClassName?: string
  /** Label peran di bawah wordmark (mis. Admin, Teknisi) */
  scope?: string
}

const WORDMARK_SIZE_CLASS = {
  default: 'h-9 w-auto max-w-[10.5rem] object-contain sm:h-10 sm:max-w-[11.5rem]',
  compact: 'h-6 w-auto max-w-[6.75rem] object-contain',
} as const

const SCOPE_SIZE_CLASS = {
  default: 'mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-700',
  compact: 'mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary-700',
} as const

export function BrandLogo({
  variant,
  size = 'default',
  className,
  iconClassName,
  wordmarkClassName,
  scope,
}: BrandLogoProps) {
  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex flex-col items-start', className)}>
        <img
          src={BRAND_WORDMARK_SRC}
          alt="Bandoo"
          width={180}
          height={46}
          className={cn(WORDMARK_SIZE_CLASS[size], wordmarkClassName)}
        />
        {scope ? (
          <span className={SCOPE_SIZE_CLASS[size]}>
            {scope}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <img
      src={BRAND_ICON_SRC}
      alt="Bandoo"
      width={40}
      height={40}
      className={cn(
        size === 'compact' ? 'h-8 w-8' : 'h-10 w-10',
        'object-contain',
        iconClassName,
        className,
      )}
    />
  )
}
