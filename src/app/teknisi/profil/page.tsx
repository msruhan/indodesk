import { redirect } from 'next/navigation'

export default function TeknisiProfilRedirectPage() {
  redirect('/teknisi/settings?tab=profil')
}
