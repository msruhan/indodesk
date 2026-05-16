import { redirect } from 'next/navigation'

export default function AdminTokoRedirectPage() {
  redirect('/admin/management?tab=toko')
}
