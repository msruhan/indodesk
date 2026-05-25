import type { PublicTeknisiDto } from '@/lib/teknisi-public'

export type TeknisiDigitalIdSource = Pick<
  PublicTeknisiDto,
  'id' | 'name' | 'specialty' | 'badge'
> & {
  isVerified: boolean
}
