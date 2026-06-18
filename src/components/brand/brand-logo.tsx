import { cn } from '@/lib/utils'

export const BRAND_ICON_SRC = '/icon/icon-bantoo.png'
export const BRAND_WORDMARK_SRC = '/icon/icon-text-bantoo.png'

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
          alt="Bantoo"
          width={148}
          height={36}
          className={cn('h-8 w-auto bg-transparent object-contain', wordmarkClassName)}
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
      alt="Bantoo"
      width={36}
      height={36}
      className={cn(
        'h-9 w-9 bg-transparent object-contain',
        iconClassName,
        className,
      )}
    />
  )
}
