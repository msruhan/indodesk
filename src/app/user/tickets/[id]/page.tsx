import { redirect } from 'next/navigation'

export default async function UserTicketDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/user/bantuan/tiket/${id}`)
}
