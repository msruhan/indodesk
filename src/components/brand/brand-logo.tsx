import { cn } from '@/lib/utils'

export const BRAND_ICON_SRC = '/icon/icon-bandoo.png'
export const BRAND_WORDMARK_SRC = '/icon/icon-text-bandoo.png'

type BrandLogoProps = {
  /** `icon` = ikon saja; `wordmark` = logo + teks lengkap */
  variant: 'icon' | 'wordmark'
  className?: string
  iconClassName?: string
  wordmarkClassName?: string
  /** Label peran di bawah wordmark (mis. Admin, Teknisi) */
  scope?: string
}

export function BrandLogo({
  variant,
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
          className={cn('h-9 w-auto object-contain sm:h-10', wordmarkClassName)}
        />
        {scope ? (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-700">
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
      className={cn('h-10 w-10 object-contain', iconClassName, className)}
    />
  )
}
