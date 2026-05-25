import type { TeknisiProfile, TeknisiStore, User } from '@prisma/client'
import { serializeTeknisiStore, type TeknisiStoreDto } from '@/lib/teknisi-store-serializer'

export type AdminTokoDto = TeknisiStoreDto & {
  userId: string
  ownerName: string
  ownerEmail: string
}

type StoreWithOwner = TeknisiStore & {
  user: Pick<User, 'id' | 'name' | 'email'> & {
    teknisiProfile: Pick<TeknisiProfile, 'rating' | 'reviewCount'> | null
  }
}

export function serializeAdminToko(store: StoreWithOwner): AdminTokoDto {
  const base = serializeTeknisiStore(store, store.user.teknisiProfile)
  return {
    ...base,
    userId: store.userId,
    ownerName: store.user.name,
    ownerEmail: store.user.email,
  }
}

export type TeknisiStoreOption = {
  id: string
  name: string
  email: string
}
