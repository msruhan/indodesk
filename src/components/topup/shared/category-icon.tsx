import {
  CreditCard as VoucherIcon,
  Globe,
  Headphones,
  Phone,
  Play,
  Smartphone,
} from '@/lib/icons'
import type { TopupCategory } from '@/data/topup-types'

const map: Record<TopupCategory['icon'], React.ElementType> = {
  gamepad: Smartphone,
  desktop: Globe,
  voucher: VoucherIcon,
  phone: Phone,
  wifi: Headphones,
  play: Play,
}

export function CategoryIcon({
  name,
  className,
}: {
  name: TopupCategory['icon']
  className?: string
}) {
  const Icon = map[name]
  return <Icon className={className} />
}
