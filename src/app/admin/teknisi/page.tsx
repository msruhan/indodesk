import { redirect } from 'next/navigation'

export default function AdminTeknisiRedirectPage() {
  redirect('/admin/management?tab=teknisi')
}
