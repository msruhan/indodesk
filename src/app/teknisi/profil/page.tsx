import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ensureTeknisiProfileSlugForUser } from '@/lib/teknisi-profile-slug-server'
import { teknisiProfilePath } from '@/lib/teknisi-profile-slug'

type Props = {
  searchParams: Promise<{ edit?: string }>
}

export default async function TeknisiProfilRedirectPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user?.id) {
    const profileSlug = await ensureTeknisiProfileSlugForUser(session.user.id)
    const { edit } = await searchParams
    const qs = new URLSearchParams({ tab: 'profil' })
    if (edit) qs.set('edit', edit)
    redirect(`${teknisiProfilePath(profileSlug, session.user.id)}?${qs.toString()}`)
  }
  redirect('/login?callbackUrl=/teknisi/profil')
}
