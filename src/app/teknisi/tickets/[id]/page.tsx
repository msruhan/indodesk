import { redirect } from 'next/navigation'

export default async function TeknisiTicketDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/teknisi/bantuan/tiket/${id}`)
}
