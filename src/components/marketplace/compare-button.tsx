'use client'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCompare, isComparable, type CompareItem } from '@/contexts/compare-context'
import { CheckSquare, Plus } from '@/lib/icons'

type Props = {
  product: CompareItem
  variant?: 'icon' | 'full'
  className?: string
}

/**
 * Tombol "Bandingkan" untuk kartu / detail produk.
 * Hanya muncul untuk kategori yang comparable (iPhone, Android, iPad, Macbook, Laptop, PC).
 */
export function CompareButton({ product, variant = 'icon', className }: Props) {
  const { add, remove, has } = useCompare()

  if (!isComparable(product.category)) return null

  const active = has(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (active) {
      remove(product.id)
      toast.info('Dihapus dari perbandingan')
      return
    }
    const res = add(product)
    if (!res.ok) {
      toast.error(res.message ?? 'Gagal menambahkan')
      return
    }
    toast.success('Ditambahkan ke perbandingan')
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
          active
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-surface-200 bg-white text-surface-700 hover:border-primary-300 hover:text-primary-700',
          className,
        )}
      >
        {active ? <CheckSquare className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {active ? 'Dibandingkan' : 'Bandingkan'}
      </button>
    )
  }

  // icon variant — untuk pojok kartu
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Hapus dari perbandingan' : 'Tambah ke perbandingan'}
      title={active ? 'Dibandingkan' : 'Bandingkan'}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-lg border shadow-soft-xs backdrop-blur-md transition-all',
        active
          ? 'border-primary-400 bg-primary-500 text-white'
          : 'border-white/60 bg-white/85 text-surface-600 hover:bg-white hover:text-primary-700',
        className,
      )}
    >
      {active ? <CheckSquare className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
    </button>
  )
}
