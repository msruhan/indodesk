import { redirect } from 'next/navigation'

export default function AdminRekberComplaintsRedirectPage() {
  redirect('/admin/komplain?tab=rekber')
}
