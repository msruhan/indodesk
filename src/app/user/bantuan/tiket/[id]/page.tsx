import { SupportTicketDetailPage } from '@/components/support-ticket/support-ticket-detail-page'

export default async function UserBantuanTiketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SupportTicketDetailPage ticketId={id} basePath="/user/bantuan/tiket" />
}
