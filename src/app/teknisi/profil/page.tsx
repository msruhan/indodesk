import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function TeknisiProfilRedirectPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect(`/teknisi/${session.user.id}?tab=profil`)
  }
  redirect('/login?callbackUrl=/teknisi/profil')
}
