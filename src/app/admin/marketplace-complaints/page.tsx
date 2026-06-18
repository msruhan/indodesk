import { redirect } from 'next/navigation'

export default function AdminMarketplaceComplaintsRedirectPage() {
  redirect('/admin/komplain?tab=marketplace')
}
