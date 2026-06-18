import { apiError } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** @deprecated Remote booking hanya via konsultasi dengan requiresRemote */
export async function POST() {
  return apiError(
    'Booking remote standalone tidak lagi tersedia. Pesan konsultasi dengan layanan remote melalui profil teknisi.',
    410,
  )
}
