import { redirect } from 'next/navigation'

export default function UserTicketsRedirectPage() {
  redirect('/user/bantuan?tab=tiket')
}
