import { cn } from '@/lib/utils'

export const BRAND_ICON_SRC = '/icon/iconbantoo.png'
export const BRAND_WORDMARK_SRC = '/icon/iconbantootext.png'

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
  default:
    'h-16 w-auto max-w-[17rem] origin-left scale-[1.12] object-contain sm:h-[4.5rem] sm:max-w-[19rem] sm:scale-[1.15]',
  compact:
    'h-14 w-auto max-w-[16rem] origin-left scale-[1.12] object-contain sm:h-16 sm:max-w-[18rem] sm:scale-[1.15] lg:h-[4.25rem] lg:max-w-[20rem]',
} as const

const ICON_SIZE_CLASS = {
  default: 'h-16 w-16 origin-left scale-[1.35] object-contain sm:h-[4.5rem] sm:w-[4.5rem] sm:scale-[1.4]',
  compact: 'h-14 w-14 origin-left scale-[1.35] object-contain sm:h-16 sm:w-16 sm:scale-[1.4]',
} as const

const SCOPE_SIZE_CLASS = {
  default: 'mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700',
  compact: 'mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700',
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
          alt="Bantoo"
          width={1672}
          height={941}
          className={cn(WORDMARK_SIZE_CLASS[size], wordmarkClassName)}
        />
        {scope ? <span className={SCOPE_SIZE_CLASS[size]}>{scope}</span> : null}
      </span>
    )
  }

  return (
    <img
      src={BRAND_ICON_SRC}
      alt="Bantoo"
      width={1254}
      height={1254}
      className={cn(ICON_SIZE_CLASS[size], iconClassName, className)}
    />
  )
}
